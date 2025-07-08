import { Redis, RedisOptions } from "ioredis"
import { ConnectionConfig, Metadata } from "../utils/types"


export class BaseMQClient {

    protected redis!: Redis;
    protected queueName: string;

    private connection: ConnectionConfig


    constructor(connection: ConnectionConfig, queueName: string) {
        this.connection = connection
        this.queueName = queueName
        this.connect()
    }

    private async connect() {
        try {
            this.redis = this.connection.url
                ? new Redis(this.connection.url as string)
                : new Redis(this.connection.redisOptions as RedisOptions);
        } catch (error) {
            throw new Error("Failed to connect to Redis");
        }
    }

    //method to get the job meta data by id
    public async getJobMetadata(jobId: string): Promise<Metadata | null> {
        const jobKey = `job:data:${jobId}`;
        const metadata = await this.redis.hgetall(jobKey);

        if (Object.keys(metadata).length === 0) {
            return null;
        }

        const result: Metadata = {
            id: metadata['id']!,
            name: metadata['name']!,
            priority: parseInt(metadata['priority']!),
            createdAt: new Date(metadata['createdAt']!),
            payload: JSON.parse(metadata['payload']!),
            attempts: parseInt(metadata['attempts'] || '1'),
            timeout: parseInt(metadata['timeout'] || '0'),
            delay: parseInt(metadata['delay'] || '0'),
            status: metadata['status'] as Metadata['status']
        };

        if (metadata['startedAt']) {
            result.startedAt = new Date(metadata['startedAt']);
        }
        if (metadata['finishedAt']) {
            result.finishedAt = new Date(metadata['finishedAt']);
        }
        if (metadata['workerId']) {
            result.workerId = metadata['workerId'];
        }

        return result;
    }


    public async updateState(jobID: string, status: Metadata['status']): Promise<boolean> {

        const jobKey = `job:data:${jobID}`;

        const exists = await this.redis.exists(jobKey);
        if (!exists) {
            return false;
        }

        const updates: Record<string, string> = {
            status: status
        };

        console.log(updates);
        console.log(status);
        
        

        // Set startedAt when job becomes active (starts processing)
        if (status === 'active') {
            updates["startedAt"] = new Date().toISOString();
        }

        // Set finishedAt when job completes or fails
        if (status === 'completed' || status === 'failed') {
            updates["finishedAt"] = new Date().toISOString();
        }

        await this.redis.hmset(jobKey, updates);

        return true;
    }

    public async getAllJobs(): Promise<Metadata[]> {
        const pattern = 'job:data:*';
        const keys = await this.redis.keys(pattern);

        if (keys.length === 0) {
            return [];
        }

        const jobs: Metadata[] = [];

        for (const key of keys) {
            const metadata = await this.redis.hgetall(key);

            if (Object.keys(metadata).length > 0) {
                const job: Metadata = {
                    id: metadata['id']!,
                    name: metadata['name']!,
                    priority: parseInt(metadata['priority']!),
                    createdAt: new Date(metadata['createdAt']!),
                    payload: JSON.parse(metadata['payload']!),
                    attempts: parseInt(metadata['attempts'] || '1'),
                    timeout: parseInt(metadata['timeout'] || '0'),
                    delay: parseInt(metadata['delay'] || '0'),
                    status: metadata['status'] as Metadata['status']
                };

                if (metadata['startedAt']) {
                    job.startedAt = new Date(metadata['startedAt']);
                }
                if (metadata['finishedAt']) {
                    job.finishedAt = new Date(metadata['finishedAt']);
                }
                if (metadata['workerId']) {
                    job.workerId = metadata['workerId'];
                }

                jobs.push(job);
            }
        }

        return jobs;
    }

    public async storeJobLog(jobId: string, message: string): Promise<void> {
        try {
            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${message}`;
            
            console.log(`Storing log for job ${jobId}: ${logEntry}`);
            
            await this.redis.lpush(`job:logs:${jobId}`, logEntry);
            await this.redis.ltrim(`job:logs:${jobId}`, 0, 999);
            
            console.log(`Log stored successfully for job ${jobId}`);
        } catch (error) {
            console.error(`Failed to store log for job ${jobId}:`, error);
            throw error;
        }
    }

    public async getJobLogs(jobId: string, limit: number = 100): Promise<string[]> {
        try {
            const logs = await this.redis.lrange(`job:logs:${jobId}`, 0, limit - 1);
            console.log(`Retrieved ${logs.length} logs for job ${jobId}`);
            return logs.reverse(); // Return in chronological order
        } catch (error) {
            console.error(`Failed to get logs for job ${jobId}:`, error);
            return [];
        }
    }

    public async testRedisConnection(): Promise<boolean> {
        try {
            await this.redis.ping();
            console.log("Redis connection is working");
            return true;
        } catch (error) {
            console.error("Redis connection failed:", error);
            return false;
        }
    }

    // Method to cancel a job
    public async cancelJob(jobId: string): Promise<boolean> {
        try {
            // Get job metadata first
            const job = await this.getJobMetadata(jobId);
            if (!job) {
                console.log(`Job ${jobId} not found`);
                return false;
            }

            // Only allow cancellation of waiting jobs
            if (job.status !== 'waiting') {
                console.log(`Cannot cancel job ${jobId} - status is ${job.status}`);
                return false;
            }

            // Remove from priority queue if it exists
            const priorityKey = `${this.queueName}:priority`;
            const priorityJobs = await this.redis.zrange(priorityKey, 0, -1);
            for (const jobData of priorityJobs) {
                const parsedJob = JSON.parse(jobData);
                if (parsedJob.id === jobId) {
                    await this.redis.zrem(priorityKey, jobData);
                    console.log(`Removed job ${jobId} from priority queue`);
                    break;
                }
            }

            // Remove from wait queue if it exists
            const waitKey = `${this.queueName}:wait`;
            const waitJobs = await this.redis.lrange(waitKey, 0, -1);
            for (const jobData of waitJobs) {
                const parsedJob = JSON.parse(jobData);
                if (parsedJob.id === jobId) {
                    await this.redis.lrem(waitKey, 1, jobData);
                    console.log(`Removed job ${jobId} from wait queue`);
                    break;
                }
            }

            // Update job status to canceled
            await this.updateState(jobId, 'canceled');
            console.log(`Job ${jobId} canceled successfully`);
            
            return true;
        } catch (error) {
            console.error(`Failed to cancel job ${jobId}:`, error);
            return false;
        }
    }

}