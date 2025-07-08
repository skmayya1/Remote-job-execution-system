import axios from "axios";

const JOB_LABEL = "race-check";
const POST_URL = "http://localhost:5000/add";

// Simulated worker logic
const simulateWorker = async ( ) => {


  try {
    const response = await axios.post(POST_URL, {
      label: JOB_LABEL,
      payload: "sleep 5 && echo Done",
      priority: 0,
      attempts: 1,
      timeout: 10000
    });

    console.log(`ob submitted:`, response.data?.jobs?.jobId || response.data);
  } catch (error) {
    console.error(`failed to submit:`, error.response?.data || error.message);
  }
};

const main = async () => {
  console.log("=== Submitting race test job concurrently ===");
  await Promise.all([
    simulateWorker(),
    simulateWorker(),  
    simulateWorker(),
    simulateWorker(),
    simulateWorker(),
  ]);
};

main();
