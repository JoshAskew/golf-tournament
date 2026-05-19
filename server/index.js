const express = require('express');
const cors = require('cors');
const path = require('path');
const { UPLOADS_DIR } = require('./config');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/api/players', require('./routes/players'));
app.use('/api/tournaments', require('./routes/tournaments'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/awards', require('./routes/awards'));
app.use('/api/stats', require('./routes/stats'));

// Serve the React build in production
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
