const { PDFParse } = require('pdf-parse');
const { v4: uuidv4 } = require('uuid');
const { documents } = require('../store');
const { chunkPages } = require('../chunker');

async function uploadHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    const buffer = req.file.buffer;

    // Parse PDF to get total page count
    const parser = new PDFParse({ data: buffer });
    const info = await parser.getInfo();
    const totalPages = info.total;

    // Extract text page by page
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      const result = await parser.getText({ partial: [i] });
      pages.push({
        pageNumber: i,
        text: result.text.trim(),
      });
    }

    await parser.destroy();

    // Check if any text was extracted
    const totalText = pages.reduce((sum, p) => sum + p.text.length, 0);
    if (totalText === 0) {
      return res.status(422).json({
        error: 'No text could be extracted. The PDF may be scanned/image-based.',
      });
    }

    // Chunk pages for retrieval
    const chunks = chunkPages(pages);

    // Store with unique ID
    const docId = uuidv4();
    documents.set(docId, {
      id: docId,
      filename: req.file.originalname,
      pages,
      chunks,
      totalPages,
      uploadedAt: new Date().toISOString(),
    });

    res.json({
      docId,
      filename: req.file.originalname,
      totalPages,
      totalChunks: chunks.length,
      message: 'PDF uploaded and processed successfully',
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process PDF' });
  }
}

module.exports = uploadHandler;
