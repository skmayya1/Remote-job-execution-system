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
        while (!this.isRunning) {
            try {
                const job = await this.getNextJob();
                if (job && !this.isRunning) {
                    this.isRunning = true
                    const jobData: job = JSON.parse(job);

                    try {
                        await this.updateState(jobData.id, "active");
                        
                        const command = jobData.payload?.data;
                        if (!command) {
                            console.error("No command found in job.payload.data");
                            await this.updateState(jobData.id, "failed");

                            continue;
                        }
                        console.log(`Executing remote command: ${command}`);

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
                            await Promise.race([
                                this.executeRemotely(jobData.id, command)
                            ])
                        }
                        await this.updateState(jobData.id, "completed");

                    } catch (error) {
                        console.error("Error executing remote command:", error);
                        await this.updateState(jobData.id, "failed");

                    } finally {
                        // Clean up listeners when job is done
                        // this.cleanupJobListeners(jobData.id);
                        this.isRunning = false
                    }
                }
            } catch (error) {
                console.error("Error processing job:", error);
            }
        }
    }

    public async executeRemotely(jobId: string, command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const conn = new Client();
                                         this.updateState(jobId,"active")

            conn.on("ready", () => {
                conn.exec(command, (err, stream) => {
                    if (err) return reject(err);
                    stream
                        .on("close", () => {
                            conn.end();
                            resolve();
                        })
                        .on("data", (data: any) => {
                            const chunk = data.toString();
                            this.storeJobLog(jobId, chunk)
                            if (this.Logger)
                                this.Logger(jobId, chunk);
                        })
                        .stderr.on("data", (data) => {
                            const chunk = data.toString();
                            this.storeJobLog(jobId, chunk)
                             this.updateState(jobId,"failed")
                            if (this.Logger)
                                this.Logger(jobId, chunk);
                        });
                });

            }).on("error", (err) => {
                reject(err);

            }).connect({
                host: this.SSHConfig.host,
                port: this.SSHConfig.port || 22,
                username: this.SSHConfig.username,
                privateKey: this.SSHConfig.privateKey,
            });
        });
    }
}