const { YoutubeTranscript } = require("youtube-transcript");

// ── In-memory transcript cache (keyed by videoId) ─────────────────────────
const transcriptCache = new Map();

// Max words to send per request — keeps token usage low
const MAX_WORDS = 5000;

// ── Helpers ───────────────────────────────────────────────────────────────

function extractVideoId(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    return u.searchParams.get("v") || null;
  } catch {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
    return null;
  }
}

/**
 * Find the most relevant portion of the transcript based on question keywords.
 */
function extractRelevantChunk(transcriptText, question) {
  const words = transcriptText.split(/\s+/);
  if (words.length <= MAX_WORDS) return transcriptText;

  const stopwords = new Set([
    "what","is","the","a","an","how","why","when","where","who","which",
    "does","do","did","can","could","please","tell","me","about","explain","describe"
  ]);
  const qWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !stopwords.has(w));

  if (qWords.length === 0) return words.slice(0, MAX_WORDS).join(" ");

  const windowSize = MAX_WORDS;
  const step = Math.floor(windowSize / 2);
  let bestStart = 0, bestScore = 0;

  for (let i = 0; i + windowSize <= words.length; i += step) {
    const windowText = words.slice(i, i + windowSize).join(" ").toLowerCase();
    const score = qWords.reduce((acc, kw) => acc + (windowText.split(kw).length - 1), 0);
    if (score > bestScore) { bestScore = score; bestStart = i; }
  }

  return words.slice(bestStart, bestStart + windowSize).join(" ");
}

/**
 * Call Groq API (OpenAI-compatible, completely free) using Node's built-in fetch.
 */
async function callGroq(systemPrompt, userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in .env");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message || JSON.stringify(data);
    throw new Error(`Groq API error (${response.status}): ${errMsg}`);
  }

  return data.choices[0].message.content;
}

// ── Controller ────────────────────────────────────────────────────────────

exports.ask = async (req, res) => {
  try {
    const { youtubeUrl, question } = req.body;
    if (!youtubeUrl || !question) {
      return res.status(400).json({ error: "youtubeUrl and question are required." });
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL." });
    }

    // ── Fetch or reuse cached transcript ──────────────────────────────────
    let transcriptText = transcriptCache.get(videoId);
    if (!transcriptText) {
      let transcriptItems;
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
      } catch {
        try {
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "hi" });
        } catch {
          transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        }
      }
      transcriptText = transcriptItems.map((t) => t.text).join(" ");
      transcriptCache.set(videoId, transcriptText);
    }

    // ── Extract relevant chunk to save tokens ─────────────────────────────
    const context = extractRelevantChunk(transcriptText, question);
    const truncated = transcriptText.split(/\s+/).length > MAX_WORDS;

    const systemPrompt = `You are VidQuery, an AI assistant that answers questions based on YouTube video transcripts.

Rules:
- Answer ONLY from the provided transcript context.
- If the answer is not in the context, say: "I don't know based on the video."
- Respond in the same language as the question (Hindi or English).
- Be concise. Format your response as bullet points.
- Do NOT add external knowledge or assumptions.
${truncated ? "- Note: Only a relevant portion of the transcript is shown." : ""}`;

    const userMessage = `Transcript:\n${context}\n\nQuestion: ${question}`;

    const answer = await callGroq(systemPrompt, userMessage);
    return res.json({ answer, videoId });

  } catch (err) {
    console.error("VidQuery error:", err.message);
    return res.status(500).json({ error: "Failed to process request. " + err.message });
  }
};
