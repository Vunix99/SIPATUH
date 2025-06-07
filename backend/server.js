import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Untuk keperluan path saat import ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === DATABASE SETUP ===
const db = new sqlite3.Database("./database.sqlite");

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS ParkirMasuk (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomortiket TEXT NOT NULL,
    platnomor TEXT,
    tanggal TEXT NOT NULL,
    isKeluar INTEGER DEFAULT 0
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS ParkirKeluar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomortiket TEXT NOT NULL,
    tanggal TEXT NOT NULL
  )`);
});

// === API ROUTES ===
app.post("/api/parkirMasuk", (req, res) => {
  const { nomortiket, platnomor, tanggal } = req.body;
  if (!/^\d+$/.test(nomortiket)) {
    return res.status(400).json({ error: "Nomor tiket harus berupa angka" });
  }

  const sql =
    "INSERT INTO ParkirMasuk (nomortiket, platnomor, tanggal, isKeluar) VALUES (?, ?, ?, 0)";
  db.run(sql, [nomortiket, platnomor || "", tanggal], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Data masuk berhasil ditambahkan", id: this.lastID });
  });
});

app.post("/api/parkirKeluar", (req, res) => {
  const { nomortiket, tanggal } = req.body;
  if (!/^\d+$/.test(nomortiket)) {
    return res.status(400).json({ error: "Nomor tiket harus berupa angka" });
  }

  db.serialize(() => {
    db.run(
      "INSERT INTO ParkirKeluar (nomortiket, tanggal) VALUES (?, ?)",
      [nomortiket, tanggal],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const updateSql =
          "UPDATE ParkirMasuk SET isKeluar = 1 WHERE nomortiket = ? AND tanggal = ?";
        db.run(updateSql, [nomortiket, tanggal], function (err) {
          if (err) return res.status(500).json({ error: err.message });
          if (this.changes === 0) {
            return res.status(404).json({
              error: "Data Masuk tidak ditemukan untuk tiket dan tanggal yang sama",
            });
          }

          res.json({
            message: "Data keluar ditambahkan dan status masuk diupdate.",
          });
        });
      }
    );
  });
});

app.get("/api/parkirMasuk", (req, res) => {
  db.all("SELECT * FROM ParkirMasuk", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/api/parkirKeluar", (req, res) => {
  db.all("SELECT * FROM ParkirKeluar", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// === SERVE FILE VUE (dist/) ===
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback ke index.html jika tidak ada route API yang cocok (penting untuk Vue Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// === START SERVER ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
