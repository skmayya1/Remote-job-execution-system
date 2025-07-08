# ---- Base Image ----
    FROM node:18-alpine

    # Set base working directory
    WORKDIR /app
    
    # Copy server and shared package manifests
    COPY server/package*.json ./server/
    COPY betterMQ/package*.json ./betterMQ/
    
    # Copy the rest of the source code
    COPY . .
    

    WORKDIR /app/betterMQ
    RUN npm install && npx tsc
    

    WORKDIR /app/server
    RUN npm install && npx tsc
    

    WORKDIR /app

    EXPOSE 5000

    CMD ["node", "server/dist/index.js"]
    