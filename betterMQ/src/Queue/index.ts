import { JOB } from "../Core/job";
import { BaseMQClient } from "../Core/BaseMQClient"

import { ConnectionConfig, JobConfig } from "../utils/types"


export class Queue extends BaseMQClient {

    constructor(queueName: string, connection: ConnectionConfig) {
        super(connection, queueName)
    }

    public async add(config: JobConfig): Promise<string> {
        //new job
        const job = new JOB(
            config.priority,
            config.payload,
            config.label,
            config.attempts,
            config.timeout,
            config.delay,
            this.redis
        );

        const jobPayload = job.Payload();
        const jobData = JSON.stringify(jobPayload);

        const queueKey = jobPayload.priority > 0
            ? `${this.queueName}:priority`
            : `${this.queueName}:wait`;

        //job is pushed into queue
        if (jobPayload.priority > 0) {
            await this.redis.zadd(queueKey, jobPayload.priority, jobData);
        } else {
            await this.redis.rpush(queueKey, jobData);
        }

        // Store metadata properly
        const metadataKey = `job:data:${jobPayload.id}`;

        await this.redis.hmset(metadataKey, {
            id: jobPayload.id,
            name: jobPayload.name,
            priority: jobPayload.priority.toString(),
            createdAt: jobPayload.createdAt.toISOString(),
            payload: JSON.stringify(jobPayload.payload),
            attempts: (jobPayload.attempts ?? 1).toString(),
            timeout: (jobPayload.timeout ?? 0).toString(),
            delay: (jobPayload.delay ?? 0).toString(),
            status: "waiting"
        });

        return jobPayload.id;
    }

}