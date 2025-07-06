
import axios from "axios"

const commands = [
  "echo Job 1",
  "sleep 2",
  "echo Job 3",
  "sleep 1",
  "ls -la",
  "echo Job 6",
  "sleep 3",
  "echo Job 8",
  "sleep 4",
  "date"
];

async function sendJob(index, command) {
  try {
    const response = await axios.post("http://localhost:3000/add", {
      label: `job-${index + 1}`,
      payload: {
        data: command
      },
      priority: index % 5,         // priority from 0 to 4
      attempts: 1,
      timeout: 10000,
      delay: 0
    });
    console.log(`Job ${index + 1} added:`, response.data.jobs.id);
  } catch (err) {
    console.error(`Job ${index + 1} failed:`, err.message);
  }
}

async function runJobs() {
  const promises = commands.map((cmd, index) => sendJob(index, cmd));
  await Promise.all(promises);
  console.log("All jobs dispatched!");
}

runJobs();
