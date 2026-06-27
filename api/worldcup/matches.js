const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Enable CORS handling for your local testing environment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const FD_TOKEN = process.env.FOOTBALL_DATA_TOKEN;

  try {
    const response = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
      headers: { "X-Auth-Token": FD_TOKEN }
    });
    
    if (!response.ok) throw new Error(`API response status: ${response.status}`);
    const data = await response.json();
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

