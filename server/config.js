const path = require('path');
const fs = require('fs');

// In production on Railway, set DATA_DIR to your mounted volume path (e.g. /data)
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname);
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure uploads directory exists on startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

module.exports = { DATA_DIR, UPLOADS_DIR };
