export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method Not Allowed' } });
  }

  try {
    const body = req.body;

    const payload = {
      model: body.model || 'claude-sonnet-4-20250514',
      max_tokens: body.max_tokens || 2000,
      messages: body.messages,
    };
    if (body.tools) payload.tools = body.tools;
    if (body.system) payload.system = body.system;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonErr) {
      return res.status(502).json({ error: { message: 'Unexpected response from Anthropic: ' + responseText.slice(0, 200) } });
    }

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error || { message: 'Anthropic API error ' + response.status } });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
