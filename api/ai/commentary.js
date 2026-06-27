const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

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
    userQuery = `Context: ${matchContext}. Explain the rule mechanics and tactical impact of a ${eventType} received by ${playerName} in the ${matchTime} minute of the World Cup match.`;
  }

  try {
    // Calling the exact IBM Granite model via DeepInfra's card-free open API gateway
    const response = await fetch("https://api.deepinfra.com/v1/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.WATSONX_API_KEY}`, // Put your DeepInfra Token here
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "ibm/granite-3-8b-instruct",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userQuery }
        ],
        temperature: 0.3
      })
    });

    const aiData = await response.json();
    const aiText = aiData.choices[0].message.content;

    // Log query metrics into Supabase table securely
    await supabase.from('chat_history').insert([
      { user_query: userQuery, ai_response: aiText }
    ]);

    return res.status(200).json({
      explanation: aiText,
      reply: aiText,
      questions: ["How does VAR review this?", "What are the rules regarding this?", "Historical precedents?"]
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
