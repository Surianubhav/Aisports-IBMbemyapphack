const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

// Initialize your Supabase client connection
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { context, prompt, eventType, playerName, matchTime, matchContext } = req.body;
  
  let userQuery = prompt || `Explain ${eventType} for ${playerName} at ${matchTime}'`;
  let systemMessage = "You are an expert football analyst. Explain football regulations, tactical shifts, and match milestones with extreme transparency.";
  
  if (context === "event-explainer") {
    userQuery = `Context: ${matchContext}. Explain the rule mechanics and impact of a ${eventType} received by ${playerName} in the ${matchTime} minute of the World Cup match.`;
  }

  try {
    // 1. Fetch explanation from IBM Watsonx / Open-Source Granite Architecture Gateway
    const watsonxResponse = await fetch("https://us-south.ml.cloud.ibm.com/ml/v1/chat/completions?version=2024-05-01", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WATSONX_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        model_id: "ibm/granite-3-8b-instruct",
        project_id: process.env.WATSONX_PROJECT_ID,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userQuery }
        ],
        temperature: 0.3
      })
    });

    const aiData = await watsonxResponse.json();
    const aiText = aiData.choices[0].message.content;

    // 2. Log query metrics transaction into Supabase asynchronously
    await supabase.from('chat_history').insert([
      { user_query: userQuery, ai_response: aiText }
    ]);

    // 3. Return payload back down to MatchMind dashboard
    return res.status(200).json({
      explanation: aiText,
      reply: aiText,
      questions: ["How does VAR review this?", "What are the physical consequences?", "Historical precedents?"]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
