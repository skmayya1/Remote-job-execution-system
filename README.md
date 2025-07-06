# Remote Job Execution System

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
![brave_screenshot_localhost](https://github.com/user-attachments/assets/3e14d91a-eaab-49ac-8b30-9a0ee325b1eb)

