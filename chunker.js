const CHUNK_SIZE = 500;   // ~500 words per chunk
const OVERLAP = 50;       // ~50 word overlap

/**
 * Splits page-extracted text into overlapping word-based chunks,
 * each tagged with the page range it spans.
 *
 * @param {{ pageNumber: number, text: string }[]} pages
 * @returns {{ text: string, pageStart: number, pageEnd: number, chunkIndex: number }[]}
 */
function chunkPages(pages) {
  // Build a flat word list, each word tagged with its source page
  const words = [];
  for (const page of pages) {
    for (const word of page.text.split(/\s+/).filter(Boolean)) {
      words.push({ word, page: page.pageNumber });
    }
  }

  if (words.length === 0) return [];

  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + CHUNK_SIZE, words.length);
    const slice = words.slice(start, end);

    chunks.push({
      text: slice.map((w) => w.word).join(' '),
      pageStart: slice[0].page,
      pageEnd: slice[slice.length - 1].page,
      chunkIndex: chunks.length,
    });

    // Advance by (CHUNK_SIZE - OVERLAP) so the next chunk overlaps
    start += CHUNK_SIZE - OVERLAP;
  }

  return chunks;
}

module.exports = { chunkPages };
