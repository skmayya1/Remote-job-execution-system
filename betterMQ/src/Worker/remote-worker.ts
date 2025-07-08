import { ConnectionConfig, SSHConfig, job } from "../utils/types"
import { Worker } from "./index"

import { Client } from "ssh2";

export class RemoteWorker extends Worker {
    private SSHConfig: SSHConfig;

    constructor(queueName: string, connection: ConnectionConfig, SSHConfig: SSHConfig) {
        super(queueName, connection)
        this.SSHConfig = SSHConfig
        this.init()
    }

    private init() {
        const conn = new Client();
        conn.on("ready", () => {
            console.log(`SSH connected to ${this.SSHConfig.host}`);
            conn.end();
        })
            .on("error", (err) => {
                console.error("SSH connection error:", err.message);
            })
            .connect({
                host: this.SSHConfig.host,
                port: this.SSHConfig.port || 22,
                username: this.SSHConfig.username,
                privateKey: this.SSHConfig.privateKey,
            });
    }

    // Override the startProcessing method to use remote execution
    protected override async startProcessing(): Promise<void> {
        while (true) { // Run indefinitely until explicitly stopped
            try {
                const job = await this.getNextJob();
                if (job && !this.isRunning) { // Only process if not already processing a job
                    this.isRunning = true;
                    const jobData: job = JSON.parse(job);

                    try {
                        const command = jobData.payload?.data;
                        if (!command) {
                            console.error("No command found in job.payload.data");
                            await this.updateState(jobData.id, "failed");
                            this.isRunning = false; // Reset here too
                            continue;
                        }

                        await this.updateState(jobData.id, "active");

                        if (this.Logger)
                            this.Logger(jobData.id, `you: ${command}`);

                        if (jobData.timeout && jobData.timeout > 0) {
                            const timeoutPromise = new Promise<never>((_, reject) => {
                                setTimeout(() => {
                                    reject(new Error(`Job ${jobData.id} timed out after ${jobData.timeout}ms`));
                                }, jobData.timeout);
                            });

                            // Race between remote execution and timeout
                            await Promise.race([
                                this.executeRemotely(jobData.id, command),
                                timeoutPromise
                            ]);
                        } else {
                            await this.executeRemotely(jobData.id, command);
                        }

                    } catch (error) {
                        console.error("Error executing remote command:", error);
                        await this.updateState(jobData.id, "failed");
                        if (this.Logger)
                            this.Logger(jobData.id, `Job failed: ${error}`);
                    } finally {
                        this.isRunning = false; // Reset job processing flag
                    }
                } else if (!job) {
                    // No job available, wait a bit before checking again
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error("Error processing job:", error);
                this.isRunning = false; // Reset on error
            }
        }
    }

    public async executeRemotely(jobId: string, command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const conn = new Client();
            let hasStderr = false;
            let commandExecutionFailed = false; // Flag to track if the main command failed

            conn.on("ready", () => {
                conn.exec(command, (err, stream) => {
                    if (err) {
                        conn.end();
                        return reject(err);
                    }

                    stream
                        .on("close", async (code: number) => {
                            commandExecutionFailed = (code !== 0 || hasStderr);

                            try {
                                if (commandExecutionFailed) {
                                    await this.updateState(jobId, "failed");
                                    if (this.Logger) {
                                        this.Logger(jobId, `Process failed (exit code: ${code})`);
                                    }
                                } else {
                                    await this.updateState(jobId, "completed");
                                    if (this.Logger) {
                                        this.Logger(jobId, `Process completed successfully (exit code: ${code})`);
                                    }
                                }

                                // --- Log System Metrics Here ---
                                await this.executeMetricCommand(conn, jobId, "df -h /", "Disk Usage");
                                await this.executeMetricCommand(conn, jobId, "free -h", "Memory Usage");
                                // --- End System Metrics ---

                                conn.end(); // Close connection after metrics are fetched
                                resolve();
                            } catch (updateError) {
                                console.error("Error updating job status or fetching metrics:", updateError);
                                conn.end(); // Ensure connection is closed even on update/metric error
                                reject(updateError);
                            }
                        })
                        .on("data", (data: any) => {
                            const chunk = data.toString();
                            this.storeJobLog(jobId, chunk);
                            if (this.Logger)
                                this.Logger(jobId, chunk);
                        })
                        .stderr.on("data", (data) => {
                            const chunk = data.toString();
                            hasStderr = true; // Mark that we have stderr output
                            this.storeJobLog(jobId, chunk);
                            if (this.Logger)
                                this.Logger(jobId, `STDERR: ${chunk}`);
                        });
                });
            })
                .on("error", async (err) => {
                    try {
                        await this.updateState(jobId, "failed");
                        if (this.Logger)
                            this.Logger(jobId, `SSH connection error: ${err.message}`);
                    } catch (updateError) {
                        console.error("Error updating job status on SSH error:", updateError);
                    }
                    reject(err);
                })
                .connect({
                    host: this.SSHConfig.host,
                    port: this.SSHConfig.port || 22,
                    username: this.SSHConfig.username,
                    privateKey: this.SSHConfig.privateKey,
                });
        });
    }

    private async executeMetricCommand(conn: Client, jobId: string, command: string, metricName: string): Promise<void> {
        return new Promise((resolve) => {
            conn.exec(command, (err, stream) => {
                if (err) {
                    const errMsg = `Error fetching ${metricName}: ${err.message}`;
                    console.error(errMsg);
                    this.storeJobMetrics(jobId, metricName, errMsg);
                    return resolve();
                }

                let output = '';
                stream.on('data', (data: any) => {
                    output += data.toString();
                }).on('close', () => {
                    const logMsg = `--- ${metricName} ---\n${output.trim()}\n--- End ${metricName} ---`;
                    console.log(logMsg);
                    this.storeJobMetrics(jobId, metricName, output);
                    resolve();
                }).stderr.on('data', (data: any) => {
                    const errMsg = data.toString().trim();
                    console.error(`STDERR for ${metricName}:`, errMsg);
                    this.storeJobMetrics(jobId, metricName, `STDERR: ${errMsg}`);
                });
            });
        });
    }

    private async storeJobMetrics(jobId: string, metricName: string, output: string): Promise<void> {
        try {
            // Store as a hash field for each metric
            await this.redis.hset(`job:metrics:${jobId}`, metricName, output.trim());
            console.log(`Stored ${metricName} for job ${jobId}`);
        } catch (error) {
            console.error(`Failed to store ${metricName} for job ${jobId}:`, error);
        }
    }
}