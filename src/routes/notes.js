const express = require('express');
const router = express.Router();

// In-memory veri deposu
let notes = [];
let nextId = 1;

function validateNote(body) {
  const fields = {};
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    fields.title = 'title zorunlu ve bos olamaz';
  }
  return fields;
}

// GET /notes — tum notlari listele (opsiyonel: ?q= ile baslik arama)
router.get('/', (req, res) => {
  const { q } = req.query;
  if (q) {
    const filtered = notes.filter(n =>
      n.title.toLowerCase().includes(q.toLowerCase())
    );
    return res.json(filtered);
  }
  res.json(notes);
});

// GET /notes/:id — tek not getir
router.get('/:id', (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id));
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
  const note = {
    id: nextId++,
    title: req.body.title.trim(),
    content: req.body.content || '',
  };
  notes.push(note);
  res.status(201).json(note);
});

// PUT /notes/:id — notu guncelle
router.put('/:id', (req, res) => {
  const idx = notes.findIndex(n => n.id === parseInt(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: true, message: 'Not bulunamadi', fields: {} });
  }
  const errors = validateNote(req.body);
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ error: true, message: 'Dogrulama hatasi', fields: errors });
  }
  notes[idx] = {
    ...notes[idx],
    title: req.body.title.trim(),
    content: req.body.content !== undefined ? req.body.content : notes[idx].content,
  };
  res.json(notes[idx]);
});

// DELETE /notes/:id — notu sil
router.delete('/:id', (req, res) => {
  const idx = notes.findIndex(n => n.id === parseInt(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: true, message: 'Not bulunamadi', fields: {} });
  }
  notes.splice(idx, 1);
  res.status(204).send();
});

// Test ortami icin bellegi sifirlamak uzere kullanilan yardimci
router.reset = () => {
  notes = [];
  nextId = 1;
};

module.exports = router;
