const express = require('express');
const router = express.Router();
const repo = require('../notesRepository');

function validateNote(body) {
  const fields = {};
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    fields.title = 'title zorunlu ve bos olamaz';
  }
  return fields;
}

// GET /notes — tum notlari kategori adiyla listele (LEFT JOIN)
router.get('/', (req, res) => {
  res.json(repo.listNotes());
});

// GET /notes/:id — tek not getir
router.get('/:id', (req, res) => {
  const note = repo.getNote(parseInt(req.params.id));
  if (!note) {
    return res.status(404).json({ error: true, message: 'Not bulunamadi', fields: {} });
  }
  res.json(note);
});

// POST /notes — yeni not olustur
router.post('/', (req, res) => {
  const errors = validateNote(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: true, message: 'Dogrulama hatasi', fields: errors });
  }
  const note = repo.createNote(
    req.body.title.trim(),
    req.body.content || '',
    req.body.category_id ?? null
  );
  res.status(201).json(note);
});

// PUT /notes/:id — notu guncelle
router.put('/:id', (req, res) => {
  const errors = validateNote(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: true, message: 'Dogrulama hatasi', fields: errors });
  }
  const note = repo.updateNote(
    parseInt(req.params.id),
    req.body.title.trim(),
    req.body.content !== undefined ? req.body.content : '',
    req.body.category_id ?? null
  );
  if (!note) {
    return res.status(404).json({ error: true, message: 'Not bulunamadi', fields: {} });
  }
  res.json(note);
});

// DELETE /notes/:id — notu sil
router.delete('/:id', (req, res) => {
  const deleted = repo.deleteNote(parseInt(req.params.id));
  if (!deleted) {
    return res.status(404).json({ error: true, message: 'Not bulunamadi', fields: {} });
  }
  res.status(204).send();
});

module.exports = router;
