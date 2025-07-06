import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { Queue, RemoteWorker, Worker } from "bettermq";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import cors from "cors";
import { createServer } from "http";
import { Server } from 'socket.io';
import dotenv from "dotenv"

const execAsync = promisify(exec);

const privateKey = fs.readFileSync(path.resolve(__dirname, "../src/sk-remote.pem"));

const app = express();
app.use(bodyParser.json());


dotenv.config()

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

const queue = new Queue("queue:test", {
    url: "redis://localhost:6379"
});

const remoteWorker = new RemoteWorker("queue:test", {
    url: "redis://localhost:6379"
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
    
    // Join specific job rooms for targeted log emission
    socket.on('join-job', (jobId: string) => {
        socket.join(`job-${jobId}`);
        console.log(`Client ${socket.id} joined job room: job-${jobId}`);
    });
    
    // Leave job rooms
    socket.on('leave-job', (jobId: string) => {
        socket.leave(`job-${jobId}`);
        console.log(`Client ${socket.id} left job room: job-${jobId}`);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

remoteWorker.on((id: string, log: string ) => {
    console.log("remote::id:" + id, log);
    io.emit('logger', {
        jobId: id,
        message: log,
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

        // Emit job creation event
        io.emit('job-created', {
            jobId: job,
            jobData: jobs,
            timestamp: new Date().toISOString()
        });

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




// Use httpServer instead of app for listening
httpServer.listen(5000, () => {
    console.log("Server running on port 5000");
    console.log("Socket.IO server initialized");
});