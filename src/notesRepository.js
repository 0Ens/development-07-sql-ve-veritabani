const { getDb } = require('./db');

function createNote(title, content = '', categoryId = null) {
  const db = getDb();
  const stmt = db.prepare(
    'INSERT INTO notes (title, content, category_id) VALUES (?, ?, ?)'
  );
  const result = stmt.run(title, content, categoryId);
  return getNote(result.lastInsertRowid);
}

function listNotes() {
  const db = getDb();
  // LEFT JOIN: kategorisi olmayan notlar da listelenir, category_name null gelir
  return db.prepare(`
    SELECT n.id, n.title, n.content, n.category_id, n.created_at,
           c.name AS category_name
    FROM notes n
    LEFT JOIN categories c ON c.id = n.category_id
    ORDER BY n.id
  `).all();
}

function getNote(id) {
  const db = getDb();
  return db.prepare(`
    SELECT n.id, n.title, n.content, n.category_id, n.created_at,
           c.name AS category_name
    FROM notes n
    LEFT JOIN categories c ON c.id = n.category_id
    WHERE n.id = ?
  `).get(id) ?? null;
}

function updateNote(id, title, content, categoryId) {
  const db = getDb();
  const stmt = db.prepare(
    'UPDATE notes SET title = ?, content = ?, category_id = ? WHERE id = ?'
  );
  const result = stmt.run(title, content, categoryId ?? null, id);
  if (result.changes === 0) return null;
  return getNote(id);
}

function deleteNote(id) {
  const db = getDb();
  const result = db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  return result.changes > 0;
}

// Kategori yardımcıları
function createCategory(name) {
  const db = getDb();
  const result = db.prepare('INSERT INTO categories (name) VALUES (?)').run(name);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
}

function listCategories() {
  return getDb().prepare('SELECT * FROM categories ORDER BY id').all();
}

module.exports = {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
  createCategory,
  listCategories,
};
