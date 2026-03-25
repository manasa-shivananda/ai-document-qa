const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Multer config — store uploads in memory, limit to 50MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Make upload middleware available to routes
app.locals.upload = upload;

// Wrap multer to return JSON errors instead of HTML
const handleUpload = (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Maximum size is 50MB.'
          : err.message;
      return res.status(400).json({ error: message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Routes
const uploadHandler = require('./routes/upload');
const askHandler = require('./routes/ask');
app.post('/api/upload', handleUpload, uploadHandler);
app.post('/api/ask', askHandler);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
