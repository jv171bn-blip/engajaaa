require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;
const APIFY_TOKEN = process.env.APIFY_TOKEN;
const ACTOR_ID = "coderx/instagram-profile-scraper-api";
const API_BASE = "https://api.apify.com/v2";

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `request_failed_${response.status}`);
  }
  return response.json();
};

app.post("/api/run-actor", async (req, res) => {
  try {
    const { usernames } = req.body;
    if (!usernames) {
      return res.status(400).json({ error: "usernames is required" });
    }
    const url = `${API_BASE}/acts/${encodeURIComponent(ACTOR_ID)}/runs?token=${encodeURIComponent(APIFY_TOKEN)}&waitForFinish=120`;
    const run = await requestJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames })
    });
    res.json(run.data || run);
  } catch (error) {
    console.error("Error running actor:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dataset/:datasetId", async (req, res) => {
  try {
    const { datasetId } = req.params;
    const url = `${API_BASE}/datasets/${encodeURIComponent(datasetId)}/items?token=${encodeURIComponent(APIFY_TOKEN)}&clean=1`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `dataset_failed_${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching dataset:", error);
    res.status(500).json({ error: error.message });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
