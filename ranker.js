const TOP_K = 5;

/**
 * Tokenize text: lowercase, strip punctuation, split on whitespace.
 */
function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Build term-frequency map for a list of tokens.
 */
function termFrequency(tokens) {
  const tf = new Map();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  // Normalize by total token count
  for (const [term, count] of tf) {
    tf.set(term, count / tokens.length);
  }
  return tf;
}

/**
 * Build inverse-document-frequency map across all chunks.
 * IDF(t) = log(1 + N / df(t))  — the +1 prevents zero scores when all
 * chunks contain a term (e.g. single-chunk documents).
 */
function inverseDocFrequency(chunkTokens) {
  const n = chunkTokens.length;
  const df = new Map();
  for (const tokens of chunkTokens) {
    const unique = new Set(tokens);
    for (const t of unique) {
      df.set(t, (df.get(t) || 0) + 1);
    }
  }
  const idf = new Map();
  for (const [term, count] of df) {
    idf.set(term, Math.log(1 + n / count));
  }
  return idf;
}

/**
 * Score a single chunk against query tokens using TF-IDF.
 * Score = sum of TF(term_in_chunk) * IDF(term) for each query term.
 */
function scoreChunk(queryTokens, chunkTF, idf) {
  let score = 0;
  for (const qt of queryTokens) {
    const tf = chunkTF.get(qt) || 0;
    const idfVal = idf.get(qt) || 0;
    score += tf * idfVal;
  }
  return score;
}

/**
 * Rank chunks against a question and return the top K results.
 *
 * @param {string} question
 * @param {{ text: string, pageStart: number, pageEnd: number, chunkIndex: number }[]} chunks
 * @param {number} [topK=5]
 * @returns {{ text: string, pageStart: number, pageEnd: number, chunkIndex: number, score: number }[]}
 */
function rankChunks(question, chunks, topK = TOP_K) {
  if (chunks.length === 0) return [];

  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) return [];

  // Tokenize all chunks and build IDF
  const chunkTokens = chunks.map((c) => tokenize(c.text));
  const idf = inverseDocFrequency(chunkTokens);

  // Score each chunk
  const scored = chunks.map((chunk, i) => {
    const tf = termFrequency(chunkTokens[i]);
    return {
      text: chunk.text,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      chunkIndex: chunk.chunkIndex,
      score: scoreChunk(queryTokens, tf, idf),
    };
  });

  // Sort descending by score, return top K with score > 0
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

module.exports = { rankChunks };
