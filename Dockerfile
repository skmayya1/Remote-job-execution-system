
    FROM node:18-alpine

    WORKDIR /app
    
    COPY /package*.json ./server/
    COPY ../betterMQ  ./betterMQ
    
    COPY . .


    WORKDIR /app/betterMQ
    RUN npm install && npx tsc

    WORKDIR /app/server
    RUN npm install
    RUN npx tsc 
    
    EXPOSE 5000
    
    # Start app
    CMD ["node", "server/dist/index.js"]
    