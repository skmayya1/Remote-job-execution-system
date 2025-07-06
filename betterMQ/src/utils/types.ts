import {RedisOptions} from "ioredis"

export type job = {
    id: string;
    priority: number;
    createdAt: Date;
    payload: any;
    name: string;
    attempts?: number | undefined;
    timeout?: number | undefined;
    delay?: number | undefined;
}


export type ConnectionConfig =
    | { url: string; redisOptions?: never }
    | { url?: never; redisOptions: RedisOptions };

export interface JobConfig {
    label: string;
    payload: { data: any };
    priority: number;
    attempts?: number;
    timeout?: number;
    delay?: number;
}

export interface Metadata extends job {
    status: "waiting" | "active" | "completed" | "failed" | "canceled";
    startedAt?: Date;
    finishedAt?: Date;
    logs?: string[];
    workerId?: string;
}

export interface SSHConfig {
    host:string
    port:number
    username:string
    privateKey: Buffer
}

export type Logger = (jobId: string, message: string  ) => void;