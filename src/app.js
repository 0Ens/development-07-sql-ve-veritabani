const express = require('express');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const notesRouter = require('./routes/notes');
const categoriesRouter = require('./routes/categories');

const app = express();

// 1. Logger — her istegi yakalasin diye en basta
app.use(logger);
// 2. Body parser
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/notes', notesRouter);
app.use('/categories', categoriesRouter);

// 3. Merkezi hata middleware — tum route'lardan SONRA gelmeli
app.use(errorHandler);

module.exports = app;
