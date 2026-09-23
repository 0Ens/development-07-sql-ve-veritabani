const request = require('supertest');
const app = require('../src/app');
const notesRouter = require('../src/routes/notes');

// Her testten once bellegi temizle
beforeEach(() => {
  notesRouter.reset();
});

// --- Yardimci ---
async function createNote(title = 'Test Baslik', content = 'Icerik') {
  const res = await request(app)
    .post('/notes')
    .send({ title, content });
  return res;
}

// ============================================================
// POST /notes
// ============================================================
describe('POST /notes', () => {
  it('gecerli body ile 201 ve id dondurmeli', async () => {
    const res = await createNote('Ilk Not', 'Merhaba');
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Ilk Not');
  });

  it('title eksikse 400 + alan bazli mesaj dondurmeli', async () => {
    const res = await request(app).post('/notes').send({ content: 'basliksiz' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
    expect(res.body.fields.title).toBeDefined();
  });

  it('title bos string ise 400 dondurmeli', async () => {
    const res = await request(app).post('/notes').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.fields.title).toBeDefined();
  });
});

// ============================================================
// GET /notes
// ============================================================
describe('GET /notes', () => {
  it('bos liste 200 ve [] dondurmeli', async () => {
    const res = await request(app).get('/notes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('olusturulan notlari listemeli', async () => {
    await createNote('A');
    await createNote('B');
    const res = await request(app).get('/notes');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('?q= ile baslikta arama yapmali', async () => {
    await createNote('Express dersi');
    await createNote('Vitest kurulumu');
    const res = await request(app).get('/notes?q=express');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Express dersi');
  });

  it('?q= eslesmiyorsa bos liste dondurmeli', async () => {
    await createNote('Express dersi');
    const res = await request(app).get('/notes?q=xyz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ============================================================
// GET /notes/:id
// ============================================================
describe('GET /notes/:id', () => {
  it('var olan id ile 200 ve notu dondurmeli', async () => {
    const created = await createNote('Bul beni');
    const res = await request(app).get(`/notes/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Bul beni');
  });

  it('olmayan id ile 404 dondurmeli', async () => {
    const res = await request(app).get('/notes/999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe(true);
  });
});

// ============================================================
// PUT /notes/:id
// ============================================================
describe('PUT /notes/:id', () => {
  it('guncelleme hem cevapta hem sonraki GET te gorunmeli', async () => {
    const created = await createNote('Eski baslik');
    const id = created.body.id;

    const put = await request(app)
      .put(`/notes/${id}`)
      .send({ title: 'Yeni baslik', content: 'Yeni icerik' });
    expect(put.status).toBe(200);
    expect(put.body.title).toBe('Yeni baslik');

    const get = await request(app).get(`/notes/${id}`);
    expect(get.body.title).toBe('Yeni baslik');
  });

  it('olmayan id ile 404 dondurmeli', async () => {
    const res = await request(app)
      .put('/notes/999')
      .send({ title: 'Bos' });
    expect(res.status).toBe(404);
  });

  it('gecersiz body ile 400 dondurmeli', async () => {
    const created = await createNote();
    const res = await request(app)
      .put(`/notes/${created.body.id}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
    expect(res.body.fields.title).toBeDefined();
  });
});

// ============================================================
// DELETE /notes/:id
// ============================================================
describe('DELETE /notes/:id', () => {
  it('var olan id ile 204 dondurmeli', async () => {
    const created = await createNote();
    const res = await request(app).delete(`/notes/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it('olmayan id ile 404 dondurmeli', async () => {
    const res = await request(app).delete('/notes/999');
    expect(res.status).toBe(404);
  });
});

// ============================================================
// Durum yonetimi zinciri: olustur -> sil -> ayni id 404
// ============================================================
describe('Durum yonetimi zinciri', () => {
  it('olustur 201, sil 204, sildikten sonra GET 404 donmeli', async () => {
    // 1. Olustur ve id al
    const created = await createNote('Silinecek Not');
    expect(created.status).toBe(201);
    const id = created.body.id;
    expect(id).toBeDefined();

    // 2. Sil
    const deleted = await request(app).delete(`/notes/${id}`);
    expect(deleted.status).toBe(204);

    // 3. Ayni id GET: 404
    const getAfterDelete = await request(app).get(`/notes/${id}`);
    expect(getAfterDelete.status).toBe(404);
  });
});
