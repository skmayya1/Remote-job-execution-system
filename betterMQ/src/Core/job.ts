import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { job } from "../utils/types"

export class JOB {
    private id: string; 
    private priority: number;  // > 1  means the highest priority 0 means it works as a normal job
    private createdAt: Date;
    private payload: any;
    private name:string;
    private attempts?: number | undefined;
    private timeout?: number | undefined;
    private delay?: number | undefined;

    private redis: Redis;

    constructor(priority: number = 0, payload: any, name:string, attempts:number = 0, timeout:number | undefined = undefined , delay:number | undefined = undefined , redis:Redis) {
        this.id = uuidv4();
        this.priority = priority;
        this.createdAt = new Date();
        this.payload = payload;
        this.name = name;
        this.attempts = attempts;
        this.timeout = timeout;
        this.delay = delay;
        this.redis = redis;
    }


    public removeFromQueue(queueName:string) {
        this.redis.lrem(queueName, 1, JSON.stringify(this.Payload()))
    }

    public Payload(): job {   // this is used to export the job to a queue
        return {
                id: this.id,
                priority: this.priority,
                createdAt: this.createdAt,
                payload: this.payload,
                name: this.name,
                attempts:this.attempts,
                timeout:this.timeout,
                delay:this.delay
        };
    }
}

