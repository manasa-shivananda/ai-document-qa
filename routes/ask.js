const Anthropic = require('@anthropic-ai/sdk');
const { documents } = require('../store');
const { rankChunks } = require('../ranker');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a document Q&A assistant. Answer the user's question using ONLY the provided context chunks from the document. Each chunk is labeled with its page range.

Rules:
- Base your answer strictly on the provided context. Do not use outside knowledge.
- Cite the page number(s) where you found the answer (e.g. "(page 3)" or "(pages 2-4)").
- If the answer is not in the provided context, respond with exactly: "I couldn't find that in the document."
- Be concise and direct.`;

function buildUserPrompt(question, chunks) {
  const context = chunks
    .map(
      (c) =>
        `[Pages ${c.pageStart}-${c.pageEnd}]:\n${c.text}`
    )
    .join('\n\n---\n\n');

  return `Context from the document:\n\n${context}\n\nQuestion: ${question}`;
}

function extractPages(chunks) {
  const pageSet = new Set();
  for (const c of chunks) {
    for (let p = c.pageStart; p <= c.pageEnd; p++) {
      pageSet.add(p);
    }
  }
  return [...pageSet].sort((a, b) => a - b);
}

async function askHandler(req, res) {
  try {
    const { docId, question } = req.body;

    if (!docId || !question) {
      return res
        .status(400)
        .json({ error: 'Both docId and question are required' });
    }

    const doc = documents.get(docId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Rank chunks against the question
    const relevantChunks = rankChunks(question, doc.chunks, 5);

    if (relevantChunks.length === 0) {
      return res.json({
        answer: "I couldn't find that in the document.",
        pages: [],
      });
    }

    // Call Claude
    const message = await client.messages.create({
      model: 'claude-4-sonnet-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(question, relevantChunks) },
      ],
    });

    const answer = message.content[0].text;
    const pages = extractPages(relevantChunks);

    res.json({ answer, pages });
  } catch (err) {
    console.error('Ask error:', err);
    res.status(500).json({ error: 'Failed to generate answer' });
  }
}

module.exports = askHandler;
