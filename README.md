# Remote Job Execution System

This project is a distributed remote job execution system, consisting of three main components:

- **betterMQ**: A custom message queue and job management library
- **server**: The backend API and real-time gateway
- **client**: The frontend web application for users

---

## Project Structure

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
├── server/     # Backend API and real-time gateway
│   ├── src/
│   │   ├── index.ts   # Express server, REST API, and Socket.IO setup
│   │   └── tests/     # Test scripts for job submission
│   └── ...            # Package files
│
├── client/     # Frontend web application (Next.js + React)
│   ├── app/            # Next.js app directory
│   ├── components/     # UI components (job table, log viewer, etc.)
│   ├── context/        # React context for table and log state
│   ├── lib/            # Client-side utilities
│   └── ...             # Config and static files
│
└── README.md  # Project documentation (this file)
```

---

## Component Overview

### 1. **betterMQ**
- Implements a Redis-backed message queue and job management system
- Provides:
  - Job creation, metadata, and state management
  - Worker and RemoteWorker classes for local/remote job execution
  - Logging and job status tracking
- Used as a library by the server and worker processes

### 2. **server**
- Node.js Express backend
- Exposes REST API endpoints for:
  - Adding jobs
  - Querying job status and metadata
  - Fetching job logs
  - Cancelling jobs
- Integrates with Socket.IO for real-time log and job status updates to clients
- Uses betterMQ for all queue/job operations

### 3. **client**
- Next.js (React) frontend
- Features:
  - Job submission form
  - Real-time job table (status, metadata, actions)
  - Log viewer for real-time and historical logs
  - Job details viewer (execution time, timestamps, config, payload)
- Connects to the server via REST API and Socket.IO for real-time updates

---

## How They Work Together

1. **User submits a job** via the client UI
2. **Client** sends a request to the **server** (`/add` endpoint)
3. **Server** adds the job to the queue using **betterMQ**
4. **Worker/RemoteWorker** (from betterMQ) picks up the job, executes it (locally or via SSH), and updates job status/logs in Redis
5. **Server** emits real-time updates (logs, status) to the **client** via Socket.IO
6. **Client** displays job progress, logs, and details in the UI

---

## Development

- Each folder (`betterMQ`, `server`, `client`) is a separate Node.js project with its own dependencies and scripts
- Start the server and client separately for development
- The betterMQ library can be developed and tested independently

---

## Notes
- Redis must be running and accessible to both server and workers
- Remote job execution uses SSH (see `RemoteWorker` config)
- All job and log data is stored in Redis

---

For more details, see the source code in each folder. 