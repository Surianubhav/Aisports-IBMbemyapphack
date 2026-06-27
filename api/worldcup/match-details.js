const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Setup standard headers to bypass frontend browser CORS walls
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract the specific incoming match entity ID query string parameter
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "Missing required 'id' parameter query string." });
  }

  const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN || "7ec682b78bb74e9cb9d2c2efaecda851";

  try {
    // Request historical telemetry log arrays from football-data source endpoint
    const response = await fetch(`https://api.football-data.org/v4/matches/${id}`, {
      headers: { "X-Auth-Token": FD_TOKEN }
    });

    if (!response.ok) {
      throw new Error(`Football data provider returned error status: ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
