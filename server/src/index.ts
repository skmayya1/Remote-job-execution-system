import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Queue, RemoteWorker } from "bettermq";

import fs from "fs";
import path from "path";
import cors from "cors";
import { createServer } from "http";
import { Server } from 'socket.io';
import dotenv from "dotenv"

dotenv.config()

// "../src/sk-remote.pem"

const privateKey = fs.readFileSync(path.resolve(__dirname, "/etc/secrets/sk-remote.pem"));

const app = express();
app.use(bodyParser.json());

const host = process.env.host

// Create HTTP server and Socket.IO server
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: "*"
}));

const redis_url = process.env.redisUrl || "redis://localhost:6379"

const queue = new Queue("queue:test", {
    url: redis_url
});

const remoteWorker = new RemoteWorker("queue:test", {
    url: redis_url
},
    {
        host: host as string,
        port: 22,
        username: "ec2-user",
        privateKey: privateKey
    }
);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

remoteWorker.on(async (id: string, log: string ) => {
    
    const job = await remoteWorker.getJobMetadata(id)
    
    io.emit('logger', {
        jobId: id,
        message: log,
        job,
        timestamp: new Date().toISOString()
    });
});

app.post("/add", async (req: Request, res: Response) => {
    try {
        const { label, payload, priority, attempts, timeout, delay } = req.body;
        const job = await queue.add({
            label,
            payload: {
                data: payload
            },
            priority,
            attempts,
            timeout,
            delay
        });

        const jobs = await queue.getJobMetadata(job);

        console.log(jobs);
        

        res.status(201).json({ jobs });

    } catch (err) {
        res.status(500).json({ error: "Failed to add job" });
    }
});

app.get("/test", (req: Request, res: Response) => {
    res.json({ message: "Server is running!" });
});

app.get("/jobs", async (req: Request, res: Response) => {
    try {
        const jobs = await queue.getAllJobs();
        res.json({ jobs });
    } catch (err) {
        res.status(500).json({ error: "Failed to get jobs" });
    }
});

// Get job by ID
app.get("/jobs/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const job = await queue.getJobMetadata(id);
        
        if (!job) {
             res.status(404).json({ error: "Job not found" });
             return;
        }
        
        res.json({ job });
    } catch (err) {
        res.status(500).json({ error: "Failed to get job" });
    }
});

// Cancel a job
app.delete("/jobs/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const success = await queue.cancelJob(id);
        
        if (success) {
            io.emit('job-cancelled', {
                jobId: id,
                timestamp: new Date().toISOString()
            });
            
            res.json({ message: "Job canceled successfully" });
        } else {
            res.status(400).json({ error: "Failed to cancel job - job not found or not in waiting status" });
        }
    } catch (err) {
        res.status(500).json({ error: "Failed to cancel job" });
    }
});

// Get job logs
app.get("/jobs/:id/logs", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { limit = "100" } = req.query;
        
        const logs = await queue.getJobLogs(id, parseInt(limit as string));
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: "Failed to get job logs" });
    }
});

function getRedisClient() {
    // @ts-ignore
    return queue.redis;
}

// Get job metrics
app.get("/jobs/:id/metrics", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const redis = getRedisClient();
        const metrics = await redis.hgetall(`job:metrics:${id}`);
        res.json({ metrics });
    } catch (err) {
        res.status(500).json({ error: "Failed to get job metrics" });
    }
});


httpServer.listen(5000, () => {
    console.log("Server running on port 5000");
    console.log("Socket.IO server initialized");
});