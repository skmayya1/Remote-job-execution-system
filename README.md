# Remote Job Execution System

- **betterMQ**: A custom message queue and job management library
- **server**: The backend API and real-time gateway
- **client**: The frontend web application for users

## Features
- **Job Submission:** Submit shell commands or scripts with parameters, priority, and timeout.
- **Job Management:**
  - Track job status (waiting, active, completed, failed, canceled)
  - Real-time execution logs
  - Cancel jobs
- **Persistence:**
  - All jobs, logs, and metrics are stored in Redis
  - System metrics (disk, memory) are collected after job execution
- **Web UI:**
  - Submit jobs, view job table, see logs and metrics in real time

## Codebase Structure

```
remote-job-execution-system/
│
├── betterMQ/   # Custom message queue and job management library
│   ├── src/
│   │   ├── Core/      # Core queue and job logic (BaseMQClient, job metadata, etc.)
│   │   ├── Worker/    # Worker and RemoteWorker implementations (job execution)
│   │   ├── Queue/     # Queue management logic
│   │   ├── utils/     # Shared types and utility functions
│   │   └── index.ts   # Library entry point
│   └── ...            # Package files (package.json, tsconfig.json, etc.)
│
├── server/     # Express API & Socket.IO for job management and logs
│   └── src/
│       └── index.ts   # REST API, real-time events, job endpoints
│
├── client/     # Next.js web UI
│   ├── components/    # Job table, log viewer, job details, etc.
│   ├── context/       # React context for jobs/logs
│   └── ...
│
└── README.md  # This file
```

## How it Works
1. **User submits a job** (command or script) via the web UI.
2. **Server** adds the job to the queue, exposes REST endpoints for job CRUD, logs, and metrics.
3. **RemoteWorker** picks up jobs, executes them via SSH, streams logs, updates status, and collects system metrics.
4. **Client** shows job status, logs, and metrics in real time.

## Tech Stack
- Node.js, TypeScript, Express, Socket.IO, Redis, Next.js (React)
- Remote execution via SSH (node-ssh2)

## Assignment Mapping
- **Job Submission:** `/add` endpoint, web UI form
- **Job Management:** `/jobs`, `/jobs/:id`, `/jobs/:id/logs`, `/jobs/:id/metrics` endpoints, real-time logs via Socket.IO
- **Persistence:** All job data and logs in Redis
- **Web UI:** For all user interaction

---
![brave_screenshot_localhost](https://github.com/user-attachments/assets/3e14d91a-eaab-49ac-8b30-9a0ee325b1eb)

