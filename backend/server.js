import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Function to create default tickets (1-100)
function createDefaultTickets(db) {
  return new Promise((resolve, reject) => {
    // Check if tickets already exist
    db.query("SELECT COUNT(*) as count FROM Tiket", (err, results) => {
      if (err) return reject(err);

      const ticketCount = results[0].count;
      if (ticketCount > 0) {
        console.log(
          `Found ${ticketCount} existing tickets, skipping default creation.`
        );
        return resolve();
      }

      console.log("Creating default tickets 1-100...");

      // Prepare batch insert
      const values = [];
      const placeholders = [];

      for (let i = 1; i <= 100; i++) {
        values.push(i.toString().padStart(3, "0")); // 001, 002, ... 100
        placeholders.push("(?)");
      }

      const sql = `INSERT INTO Tiket (nomor_tiket) VALUES ${placeholders.join(
        ", "
      )}`;

      db.query(sql, values, (err, result) => {
        if (err) return reject(err);
        console.log(
          `Successfully created ${result.affectedRows} default tickets.`
        );
        resolve();
      });
    });
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

console.log("=== ENVIRONMENT VARIABLES ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("=============================");

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "vehicle-" + uniqueSuffix + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

app.use(cors());
app.use(bodyParser.json({ limit: "50mb", parameterLimit: 50000 }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static(uploadsDir));

const { DB_HOST, DB_USER, DB_PASS, DB_NAME, TIME_ZONE } = process.env;

// Utility function to save base64 images
const saveBase64Image = (base64Data, filename) => {
  try {
    const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Image, "base64");
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(
      `Base64 image saved: ${filename}, size: ${Math.round(
        buffer.length / 1024
      )}KB`
    );
    return filename;
  } catch (error) {
    console.error("Error saving base64 image:", error);
    throw error;
  }
};

// Function to create tables (used in rebuild mode)
function createTables(db) {
  return new Promise((resolve, reject) => {
    db.query(
      `
      CREATE TABLE IF NOT EXISTS Kendaraan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        plat_nomor VARCHAR(20) NOT NULL UNIQUE
      );
      
      CREATE TABLE IF NOT EXISTS Tiket (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomor_tiket VARCHAR(50) NOT NULL UNIQUE,
        tersedia BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS Log_Parkir (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_kendaraan INT,
        id_tiket INT,
        waktu_masuk DATETIME DEFAULT CURRENT_TIMESTAMP,
        foto_masuk VARCHAR(500),
        waktu_keluar DATETIME,
        FOREIGN KEY (id_kendaraan) REFERENCES Kendaraan(id),
        FOREIGN KEY (id_tiket) REFERENCES Tiket(id)
      );
      
      CREATE TABLE IF NOT EXISTS Admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS Log_Backup (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waktu_backup DATETIME NOT NULL,
        id_admin INT,
        FOREIGN KEY (id_admin) REFERENCES Admin(id)
      );
    `,
      (err) => {
        if (err) {
          reject(err);
        } else {
          console.log("All tables created or confirmed exist.");
          resolve();
        }
      }
    );
  });
}

// Main function to initialize DB and server
async function startServer(rebuild = false) {
  try {
    // Temporary connection without DB, to create DB if not exists
    const tempDb = mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
    });

    await new Promise((res, rej) => {
      tempDb.connect((err) => {
        if (err) return rej(err);
        console.log("Connected to MySQL (temporary connection)");
        res();
      });
    });

    await new Promise((res, rej) => {
      tempDb.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``, (err) => {
        if (err) return rej(err);
        console.log(`Database ${DB_NAME} siap digunakan`);
        res();
      });
    });

    tempDb.end();

    // Connect to main DB
    const db = mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      multipleStatements: true,
    });

    await new Promise((res, rej) => {
      db.connect((err) => {
        if (err) return rej(err);
        console.log(`Connected to MySQL database ${DB_NAME}`);
        res();
      });
    });

    // If rebuild flag is on, drop and recreate tables
    if (rebuild) {
      console.log("Rebuild mode: dropping and recreating tables...");
      await new Promise((res, rej) => {
        db.query(
          `
          DROP TABLE IF EXISTS Log_Backup;
          DROP TABLE IF EXISTS Log_Parkir;
          DROP TABLE IF EXISTS Tiket;
          DROP TABLE IF EXISTS Admin;
          DROP TABLE IF EXISTS Kendaraan;
        `,
          (err) => {
            if (err) return rej(err);
            console.log("Dropped existing tables.");
            res();
          }
        );
      });

      await createTables(db);

      // CREATE DEFAULT TICKETS (1-100) AFTER REBUILD
      await createDefaultTickets(db);
    } else {
      await createTables(db);

      // CREATE DEFAULT TICKETS (1-100) IF NOT EXISTS
      await createDefaultTickets(db);
    }

    // === API ENDPOINTS ===

    // CREATE TICKET
    app.post("/api/tiket", (req, res) => {
      const { nomor_tiket } = req.body;
      if (!nomor_tiket) {
        return res.status(400).json({ error: "nomor_tiket is required" });
      }

      const sql = `INSERT INTO Tiket (nomor_tiket, tersedia) VALUES (?, TRUE)`;
      db.query(sql, [nomor_tiket], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ error: "Nomor tiket sudah ada" });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Tiket berhasil dibuat", id: result.insertId });
      });
    });

    // GET AVAILABLE TICKETS ONLY
    app.get("/api/tiket/tersediaable", (req, res) => {
      const sql = `SELECT * FROM Tiket WHERE tersedia = TRUE ORDER BY nomor_tiket`;
      db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      });
    });

    // GET ALL TICKETS
    app.get("/api/tiket", (req, res) => {
      const sql = `SELECT * FROM Tiket ORDER BY created_at DESC`;
      db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      });
    });

    // UPDATE TICKET AVAILABILITY
    app.put("/api/tiket/:id/tersedia", (req, res) => {
      const { id } = req.params;
      const { tersedia } = req.body;

      if (typeof tersedia !== "boolean") {
        return res
          .status(400)
          .json({ error: "tersedia must be boolean (true/false)" });
      }

      const sql = `UPDATE Tiket SET tersedia = ? WHERE id = ?`;
      db.query(sql, [tersedia, id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Tiket tidak ditemukan" });
        }
        res.json({
          message: `Tiket ${tersedia ? "diaktifkan" : "dinonaktifkan"}`,
        });
      });
    });

    app.post("/api/kendaraan", (req, res) => {
      const { plat_nomor } = req.body;
      const sql = `INSERT INTO Kendaraan (plat_nomor) VALUES (?)`;

      db.query(sql, [plat_nomor], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(400)
              .json({ error: "Plat nomor sudah terdaftar" });
          }
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Kendaraan ditambahkan", id: result.insertId });
      });
    });

    app.post("/api/parkirMasuk", upload.single("foto_masuk"), (req, res) => {
      console.log("=== parkirMasuk request received ===");
      console.log("Body keys:", Object.keys(req.body));
      console.log("File:", req.file ? req.file.filename : "No file");

      const { plat_nomor, waktu_masuk, nomor_tiket, foto_base64 } = req.body;

      if (!plat_nomor || !waktu_masuk || !nomor_tiket) {
        return res.status(400).json({
          error:
            "Missing required fields: plat_nomor, waktu_masuk, nomor_tiket",
        });
      }

      let foto_filename = null;

      try {
        if (req.file) {
          foto_filename = req.file.filename;
          console.log("File uploaded:", foto_filename);
        } else if (foto_base64) {
          console.log(
            "Processing base64 image, size:",
            Math.round(foto_base64.length / 1024),
            "KB"
          );
          const timestamp = Date.now();
          const uniqueSuffix = Math.round(Math.random() * 1e9);
          const filename = `vehicle-camera-${timestamp}-${uniqueSuffix}.jpg`;
          foto_filename = saveBase64Image(foto_base64, filename);
          console.log("Base64 image saved:", foto_filename);
        }

        // CHECK IF TICKET IS AVAILABLE
        const cekTiket = `SELECT id FROM Tiket WHERE nomor_tiket = ? AND tersedia = TRUE`;
        db.query(cekTiket, [nomor_tiket], (err, tiketRows) => {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: err.message });
          }

          if (tiketRows.length === 0) {
            return res.status(400).json({
              error: "Tiket tidak tersedia atau tidak ditemukan",
            });
          }

          const id_tiket = tiketRows[0].id;

          // FIND OR CREATE VEHICLE
          const cariKendaraan = `SELECT id FROM Kendaraan WHERE plat_nomor = ?`;
          db.query(cariKendaraan, [plat_nomor], (err, rows) => {
            if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ error: err.message });
            }

            const insertLog = (id_kendaraan) => {
              // SET TICKET TO UNAVAILABLE AND INSERT LOG
              db.beginTransaction((err) => {
                if (err) {
                  console.error("Transaction error:", err);
                  return res.status(500).json({ error: err.message });
                }

                // Update ticket tersediaability to FALSE
                const updateTiket = `UPDATE Tiket SET tersedia = FALSE WHERE id = ?`;
                db.query(updateTiket, [id_tiket], (err) => {
                  if (err) {
                    return db.rollback(() => {
                      console.error("Update tiket error:", err);
                      res.status(500).json({ error: err.message });
                    });
                  }

                  // Insert parking log
                  const sql = `INSERT INTO Log_Parkir (id_kendaraan, id_tiket, waktu_masuk, foto_masuk) VALUES (?, ?, ?, ?)`;
                  db.query(
                    sql,
                    [id_kendaraan, id_tiket, waktu_masuk, foto_filename],
                    (err, result) => {
                      if (err) {
                        return db.rollback(() => {
                          console.error("Insert log error:", err);
                          res.status(500).json({ error: err.message });
                        });
                      }

                      db.commit((err) => {
                        if (err) {
                          return db.rollback(() => {
                            console.error("Commit error:", err);
                            res.status(500).json({ error: err.message });
                          });
                        }

                        console.log("Parking entry recorded successfully");
                        res.json({
                          message: "Parkir masuk tercatat",
                          id: result.insertId,
                          nomor_tiket: nomor_tiket,
                          foto_path: foto_filename
                            ? `/uploads/${foto_filename}`
                            : null,
                        });
                      });
                    }
                  );
                });
              });
            };

            if (rows.length > 0) {
              insertLog(rows[0].id);
            } else {
              const insertKendaraan = `INSERT INTO Kendaraan (plat_nomor) VALUES (?)`;
              db.query(insertKendaraan, [plat_nomor], (err, result) => {
                if (err) {
                  console.error("Insert kendaraan error:", err);
                  return res.status(500).json({ error: err.message });
                }
                insertLog(result.insertId);
              });
            }
          });
        });
      } catch (error) {
        console.error("Error processing request:", error);
        return res
          .status(500)
          .json({ error: "Failed to process request: " + error.message });
      }
    });

    app.post("/api/parkirKeluar", (req, res) => {
      const { nomor_tiket } = req.body;

      if (!nomor_tiket) {
        return res.status(400).json({ error: "Nomor tiket wajib diisi" });
      }

      const getTiketId = `SELECT id FROM Tiket WHERE nomor_tiket = ?`;
      db.query(getTiketId, [nomor_tiket], (err, tiketRows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (tiketRows.length === 0) {
          return res.status(404).json({ error: "Nomor tiket tidak ditemukan" });
        }

        const id_tiket = tiketRows[0].id;

        db.beginTransaction((err) => {
          if (err) return res.status(500).json({ error: err.message });

          const updateLog = `
        UPDATE Log_Parkir
        SET waktu_keluar = NOW()
        WHERE id_tiket = ? AND waktu_keluar IS NULL
      `;
          db.query(updateLog, [id_tiket], (err, result) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: err.message });
              });
            }
            if (result.affectedRows === 0) {
              return db.rollback(() => {
                res
                  .status(404)
                  .json({
                    error: "Tidak ada log parkir aktif untuk tiket ini",
                  });
              });
            }

            const updateTiket = `UPDATE Tiket SET tersedia = TRUE WHERE id = ?`;
            db.query(updateTiket, [id_tiket], (err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: err.message });
                });
              }

              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ error: err.message });
                  });
                }
                res.json({
                  message: "Parkir keluar tercatat, tiket tersedia kembali",
                });
              });
            });
          });
        });
      });
    });

    // GET PARKING LOGS WITH DETAILS
    app.get("/api/logParkir", (req, res) => {
      const sql = `
        SELECT 
          lp.id,
          k.plat_nomor,
          t.nomor_tiket,
          lp.waktu_masuk,
          lp.waktu_keluar,
          lp.foto_masuk,
          CASE WHEN lp.waktu_keluar IS NULL THEN 'Aktif' ELSE 'Selesai' END as status
        FROM Log_Parkir lp
        JOIN Kendaraan k ON lp.id_kendaraan = k.id
        JOIN Tiket t ON lp.id_tiket = t.id
        ORDER BY lp.waktu_masuk DESC
      `;
      db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      });
    });

    app.post("/api/admin/register", async (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username dan password harus diisi" });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO Admin (username, password) VALUES (?, ?)`;
        db.query(sql, [username, hashedPassword], (err, result) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              return res
                .status(400)
                .json({ error: "Username sudah terdaftar" });
            }
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: "Admin berhasil didaftarkan" });
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post("/api/admin/login", (req, res) => {
      const { username, password } = req.body;
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username dan password harus diisi" });
      }

      const sql = `SELECT * FROM Admin WHERE username = ?`;
      db.query(sql, [username], async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0)
          return res.status(400).json({ error: "Username tidak ditemukan" });

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);
        if (!match) return res.status(400).json({ error: "Password salah" });

        res.json({ message: "Login berhasil", id_admin: admin.id });
      });
    });

    app.post("/api/backup", (req, res) => {
      const { waktu_backup, id_admin } = req.body;
      if (!waktu_backup || !id_admin) {
        return res
          .status(400)
          .json({ error: "Missing waktu_backup or id_admin" });
      }
      const sql = `INSERT INTO Log_Backup (waktu_backup, id_admin) VALUES (?, ?)`;
      db.query(sql, [waktu_backup, id_admin], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Log backup berhasil dicatat" });
      });
    });

    app.get("/", (req, res) => {
      res.send("Server API Kendaraan Parkir aktif");
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Gagal memulai server:", error);
    process.exit(1);
  }
}

// Run server with or without rebuild based on CLI argument
const shouldRebuild = process.argv.includes("--rebuild");
startServer(shouldRebuild);
