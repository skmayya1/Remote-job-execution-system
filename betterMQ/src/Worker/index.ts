import { BaseMQClient } from "../Core/BaseMQClient"

import { ConnectionConfig, Logger } from "../utils/types"


export abstract class Worker extends BaseMQClient {
    protected isRunning: boolean = false;
    protected Logger ?: Logger
    

    constructor(queueName: string, connection: ConnectionConfig) {
        super(connection, queueName)
    }

    public async on(logger:Logger): Promise<void> {
        this.Logger = logger
        this.startProcessing();
    }

    public end(): void {
        this.isRunning = false;
    }

    protected abstract startProcessing(): Promise<void>;

    protected async getNextJob(): Promise<string | null> {
        const priorityJob = await this.redis.zpopmax(`${this.queueName}:priority`);
        if (priorityJob.length > 0) {
            return priorityJob[0] as string
        }

        const waitJob = await this.redis.blpop(`${this.queueName}:wait`, 1);
        if (waitJob) {
            return waitJob[1];
        }

        return null;
    }
}
