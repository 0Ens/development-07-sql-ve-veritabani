# development-07 — Notlar API'si (SQLite)

development-06'daki in-memory notlar API'sinin veri katmanı SQLite'a taşındı.  
Endpoint sözleşmesi aynı kaldı; içeride array'lerin yerini tablolar ve SQL sorguları aldı.

---

## Tablo Şeması

```
categories
  id   INTEGER PRIMARY KEY AUTOINCREMENT
  name TEXT NOT NULL UNIQUE

notes
  id          INTEGER PRIMARY KEY AUTOINCREMENT
  title       TEXT NOT NULL
  content     TEXT NOT NULL DEFAULT ''
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
```

**Tasarım kararları:**
- `category_id` foreign key'i `notes` tablosundadır çünkü ilişki "bir kategoriye birçok not" yönündedir; FK her zaman "çok" tarafında durur.
- Kategori silinirse not silinmez, `category_id` NULL'a düşer (`ON DELETE SET NULL`).
- `GET /notes` ve `GET /notes/:id` sorguları **LEFT JOIN** kullanır: kategorisi olmayan notlar da listelenir, `category_name` alanı `null` gelir.

---

## Kurulum

```bash
npm install
npm start        # http://localhost:3000
```

İlk çalıştırmada `notes.db` otomatik oluşturulur, tablolar yoksa yaratılır.

---

## Endpoint'ler

| Method | URL | Açıklama |
|--------|-----|----------|
| GET    | /notes | Tüm notları kategori adıyla listele |
| GET    | /notes/:id | Tek not getir |
| POST   | /notes | Yeni not oluştur |
| PUT    | /notes/:id | Notu güncelle |
| DELETE | /notes/:id | Notu sil |
| GET    | /categories | Kategorileri listele |
| POST   | /categories | Yeni kategori oluştur |

**POST /notes gövdesi:**
```json
{ "title": "Not başlığı", "content": "İçerik", "category_id": 1 }
```

---

## Test

```bash
npm test
```

6 birim testi `:memory:` SQLite ile çalışır; dosya oluşturmaz, her test temiz veritabanı kurar.

| # | Test | Kanıtladığı |
|---|------|-------------|
| 1 | createNote | INSERT çalışıyor |
| 2 | listNotes | Tüm notlar geliyor |
| 3 | getNote | Var olan id bulunuyor |
| 4 | getNote (yok) | Olmayan id → null (404 için) |
| 5 | updateNote + deleteNote | UPDATE ve DELETE çalışıyor |
| 6 | LEFT JOIN | category_name doğru geliyor |

---

## Restart Kanıtı

Sunucu çalışırken bir not eklendi (11:58:37), sunucu durduruldu ve yeniden başlatıldı; not 12:00:49'da sorgulandığında hâlâ veritabanında duruyordu — SQLite kalıcı depolama sağlıyor, in-memory array gibi restart'ta veri kaybetmiyor.

---

## Ne Öğrendim

- **Foreign key kararı:** İlişkinin "çok" tarafı her zaman FK'yı taşır. `notes.category_id → categories.id` doğru yön; tersine yapmak normalizasyonu bozardı.
- **INNER vs LEFT JOIN farkı:** `INNER JOIN` kategorisi olmayan notları listeden düşürür. `LEFT JOIN` tüm notları getirir, kategori yoksa `null` gelir — hangi davranışın isteniyor olduğunu önceden karar vermek gerekiyor.
- **Parametrik sorgu zorunluluğu:** `WHERE id = ${req.params.id}` yazmak SQL injection'a kapı açar. `WHERE id = ?` ile `stmt.run(id)` şeklinde parametrik yazmak bu riski tamamen kapatır.
- **:memory: ile test:** Her test kendi izole veritabanını kuruyor; dosya silme derdi yok, testler birbirini etkilemiyor.
