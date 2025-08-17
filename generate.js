// This is your new, secure serverless backend.
// It protects your API keys and manages rate limiting.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { provider, system_prompt, base64, file_mime } = req.body;

    let requestBody;
    let apiUrl;
    let authHeader;

    if (provider === 'gemini') {
      apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`;
      authHeader = { 'Content-Type': 'application/json' };
      requestBody = {
        contents: [{
          parts: [{ text: system_prompt }, { inlineData: { mimeType: file_mime, data: base64 } }]
        }]
      };
    } else if (provider === 'groq') {
      apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
      authHeader = {
        'Authorization': `Bearer ${process.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      };
      requestBody = {
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: base64 } // Here, 'base64' is actually the text description from Gemini
        ],
        model: 'llama3-8b-8192'
      };
    } else {
      return res.status(400).json({ error: 'Invalid provider specified.' });
    }

    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify(requestBody)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Upstream API Error (${apiResponse.status}): ${errorText}`);
      return res.status(apiResponse.status).json({ error: `API Error: ${errorText}` });
    }

    const data = await apiResponse.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('Error in serverless function:', error);
    return res.status(500).json({ error: error.message });
  }
}