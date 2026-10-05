export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' });
    try {
      const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listRes.json();
      return res.status(200).json({ 
        keyConfigured: true, 
        models: (listData.models || []).map(m => m.name) 
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { url, title: initialTitle } = body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY environment variable is not configured in Vercel.' 
      });
    }

    let metaTitle = initialTitle || '';
    let metaDescription = '';

    // Step 1: Attempt metadata enrichment (oEmbed for YouTube/TikTok/Vimeo, or HTML OpenGraph)
    try {
      if (/youtube\.com|youtu\.be/i.test(url)) {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, { signal: AbortSignal.timeout(3500) });
        if (oembedRes.ok) {
          const odata = await oembedRes.json();
          metaTitle = odata.title || metaTitle;
          metaDescription = `YouTube video by ${odata.author_name || 'creator'}`;
        }
      } else {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
          signal: AbortSignal.timeout(3500)
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
                              html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
          if (titleMatch && !metaTitle) metaTitle = titleMatch[1].trim();
          if (ogDescMatch) metaDescription = ogDescMatch[1].trim();
        }
      }
    } catch (metaErr) {
      // Metadata enrichment is non-blocking; proceed to Gemini with URL
    }

    // Step 2: Call Google Gemini API
    const prompt = `You are the AI engine for "Later.", an intelligent reading and video study-list app.
A student saved this link to check later.
URL: ${url}
Title / Metadata: ${metaTitle || 'Unknown'}
Description: ${metaDescription || 'None'}

TASK:
1. Write ONE punchy, high-signal takeaway sentence (maximum 20-25 words) explaining why this post or video is valuable to study or review.
2. Suggest ONE short lowercase category tag (e.g. coding, business, math, design, physics, career, productivity, psychology, news).
3. If the title is generic or missing, provide a clean, readable title for the post.

Return strictly a valid JSON object matching this schema:
{
  "title": "Clean concise title",
  "summary": "One punchy takeaway sentence explaining the core lesson or insight.",
  "tag": "singletag"
}`;

    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-pro'
    ];

    let geminiRes = null;
    let lastError = '';

    for (const model of candidateModels) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const resp = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2
            }
          }),
          signal: AbortSignal.timeout(7000)
        });

        if (resp.ok) {
          geminiRes = resp;
          break;
        } else {
          lastError = await resp.text();
        }
      } catch (callErr) {
        lastError = callErr.message;
      }
    }

    if (!geminiRes) {
      return res.status(502).json({ error: 'Gemini API failed across all candidate models', details: lastError });
    }

    const geminiData = await geminiRes.json();
    const rawContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsed = {};
    try {
      parsed = JSON.parse(rawContent);
    } catch (parseErr) {
      parsed = {
        summary: rawContent.replace(/```json|```/g, '').trim(),
        tag: 'study'
      };
    }

    return res.status(200).json({
      success: true,
      title: parsed.title || metaTitle || url,
      summary: parsed.summary || 'Saved to check later.',
      tag: parsed.tag || 'general'
    });

  } catch (err) {
    return res.status(500).json({ error: 'Server error generating summary', details: err.message });
  }
}
