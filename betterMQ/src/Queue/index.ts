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

            const metadataKey = `job:data:${jobPayload.id}`;

        const multi = this.redis.multi();

        if (jobPayload.priority > 0) {
            multi.zadd(queueKey, jobPayload.priority, jobData);
        } else {
            multi.rpush(queueKey, jobData);
        }
        
        multi.hmset(metadataKey, {
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
        
        await multi.exec();

        return jobPayload.id;
    }

}