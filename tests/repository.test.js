const Database = require('better-sqlite3');
const { setup } = require('../src/db');

// Her test kendi temiz :memory: veritabanını kurar
function makeRepo() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  setup(db);

  // db.js'in getDb() yerine bu test db'sini kullan
  jest.resetModules();
  jest.doMock('../src/db', () => ({
    getDb: () => db,
    setup,
    closeDb: () => db.close(),
  }));

  const repo = require('../src/notesRepository');
  return { db, repo };
}

afterEach(() => {
  jest.resetModules();
});

// Test 1: createNote — INSERT calisiyor, donen nesne title'i iceriyor
test('createNote: yeni not olusturur ve id atar', () => {
  const { repo } = makeRepo();
  const note = repo.createNote('Ilk not', 'icerik');
  expect(note.id).toBeDefined();
  expect(note.title).toBe('Ilk not');
  expect(note.content).toBe('icerik');
});

// Test 2: listNotes — INSERT sonrasi liste dolu geliyor
test('listNotes: olusturulan notlari listeler', () => {
  const { repo } = makeRepo();
  repo.createNote('A');
  repo.createNote('B');
  const notes = repo.listNotes();
  expect(notes.length).toBe(2);
});

// Test 3: getNote — var olan id'yi bulur
test('getNote: var olan notu getirir', () => {
  const { repo } = makeRepo();
  const created = repo.createNote('Bulunacak not');
  const found = repo.getNote(created.id);
  expect(found.title).toBe('Bulunacak not');
});

// Test 4: getNote yok — olmayan id null donmeli (route 404 yapacak)
test('getNote: olmayan id icin null doner', () => {
  const { repo } = makeRepo();
  const result = repo.getNote(9999);
  expect(result).toBeNull();
});

// Test 5: updateNote + deleteNote
test('updateNote ve deleteNote calisiyor', () => {
  const { repo } = makeRepo();
  const note = repo.createNote('Eski baslik');
  const updated = repo.updateNote(note.id, 'Yeni baslik', 'yeni icerik', null);
  expect(updated.title).toBe('Yeni baslik');

  const deleted = repo.deleteNote(note.id);
  expect(deleted).toBe(true);
  expect(repo.getNote(note.id)).toBeNull();
});

// Test 6: LEFT JOIN — kategori adi JOIN ile geliyor
test('LEFT JOIN: kategori adi nota ekleniyor', () => {
  const { repo } = makeRepo();
  const kategori = repo.createCategory('Is');
  const note = repo.createNote('Toplanti notu', '', kategori.id);
  const found = repo.getNote(note.id);
  // Bu satir kirmizi gormen icin: beklenen degeri degistir, testi calistir, sonra geri al
  expect(found.category_name).toBe('Is');
});
