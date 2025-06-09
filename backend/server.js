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
import jwt from "jsonwebtoken"; // Import jsonwebtoken
import cookieParser from "cookie-parser"; // Import cookie-parser

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
const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  TIME_ZONE,
  JWT_SECRET,
  VITE_DOMAIN_SERVER,
} = process.env;

console.log("=== ENVIRONMENT VARIABLES ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("JWT_SECRET (present):", !!process.env.JWT_SECRET); // Check if secret is loaded
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

app.use(
  cors({
    origin: VITE_DOMAIN_SERVER, // Ganti dengan origin frontend Anda jika berbeda
    credentials: true, // Izinkan pengiriman cookie lintas origin
  })
);
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
app.use(cookieParser()); // Gunakan cookie-parser
app.use("/uploads", express.static(uploadsDir));

// Pastikan JWT_SECRET ada
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1);
}

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

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  // Check for token in HttpOnly cookie
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Akses ditolak. Tidak ada token otentikasi." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded; // Store decoded payload in req.admin
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Token tidak valid atau kadaluarsa." });
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
        email VARCHAR(50) NOT NULL UNIQUE,
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
      // Set timezone to 'Asia/Jakarta'
      timezone: TIME_ZONE || "Asia/Jakarta", // Use from .env or default
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
    app.post("/api/tiket", authenticateToken, (req, res) => {
      // Protected route
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
    app.get("/api/tiket/tersedia", authenticateToken, (req, res) => {
      // Protected route
      const sql = `SELECT * FROM Tiket WHERE tersedia = TRUE ORDER BY nomor_tiket`;
      db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      });
    });

    // GET ALL TICKETS
    app.get("/api/tiket", authenticateToken, (req, res) => {
      // Protected route
      const sql = `SELECT * FROM Tiket ORDER BY created_at DESC`;
      db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
      });
    });

    // UPDATE TICKET AVAILABILITY
    app.put("/api/tiket/:id/tersedia", authenticateToken, (req, res) => {
      // Protected route
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

    app.post("/api/kendaraan", authenticateToken, (req, res) => {
      // Protected route
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

    app.post(
      "/api/parkirMasuk",
      authenticateToken,
      upload.single("foto_masuk"),
      (req, res) => {
        // Protected route
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
            const filename = `vehicle-camera-<span class="math-inline">\{timestamp\}\-</span>{uniqueSuffix}.jpg`;
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

                  // Update ticket availability to FALSE
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
      }
    );

    app.post("/api/parkirKeluar", authenticateToken, (req, res) => {
      // Protected route
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
                res.status(404).json({
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
    app.get("/api/logParkir", authenticateToken, (req, res) => {
      // Protected route
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

    // Admin Registration (only accessible via CLI, or if you want to make it an API, make it a restricted API)
    app.post("/api/admin/register", async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email dan password harus diisi" });
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = `INSERT INTO Admin (email, password) VALUES (?, ?)`;
        db.query(sql, [email, hashedPassword], (err, result) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              return res.status(400).json({ error: "Email sudah terdaftar" });
            }
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: "Admin berhasil didaftarkan" });
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Admin Login
    app.post("/api/admin/login", (req, res) => {
      const { email, password } = req.body;
      console.log("Login attempt with:", { email, password });

      if (!email || !password) {
        // Tetap validasi input awal untuk memastikan tidak kosong
        return res.status(400).json({ error: "Email atau Password Salah!" }); // Pesan umum
      }

      const sql = `SELECT * FROM Admin WHERE email = ?`;
      db.query(sql, [email], async (err, results) => {
        if (err) {
          console.error("Database error during login:", err);
          return res.status(500).json({ error: "Terjadi kesalahan server." });
        }

        // Jika email tidak ditemukan ATAU password salah, berikan pesan yang sama
        if (results.length === 0) {
          // Untuk keamanan, tetap lakukan delay singkat untuk mencegah timing attacks
          await new Promise((resolve) => setTimeout(resolve, 500)); // Delay 500ms
          return res.status(400).json({ error: "Email atau Password Salah!" });
        }

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);

        if (!match) {
          return res.status(400).json({ error: "Email atau Password Salah!" });
        }

        // Generate JWT
        const payload = {
          id: admin.id,
          email: admin.email,
          // Anda bisa menambahkan role atau informasi lain di sini
        };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" }); // Token berlaku 1 hari

        // Set JWT as an HttpOnly cookie
        res.cookie("token", token, {
          httpOnly: true, // Not accessible by client-side JavaScript
          secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
          maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
          sameSite: "Lax", // Protects against CSRF attacks
          // domain: '.yourdomain.com' // Uncomment and set if you have a specific domain
        });

        res.json({ message: "Login berhasil", id_admin: admin.id });
      });
    });

    app.get("/api/check-auth", authenticateToken, (req, res) => {
      // Jika middleware authenticateToken berhasil melewati (artinya token valid),
      // maka rute ini akan dijangkau dan kita bisa merespons 200 OK.
      // Anda bisa mengirim kembali informasi admin dasar jika diperlukan di frontend.
      res
        .status(200)
        .json({
          message: "Authenticated",
          adminId: req.admin.id,
          adminEmail: req.admin.email,
        });
    });

    // Admin Logout
    app.post("/api/admin/logout", authenticateToken, (req, res) => {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
      });
      res.json({ message: "Logout berhasil" });
    });

    app.post("/api/backup", authenticateToken, (req, res) => {
      // Protected route
      const { waktu_backup } = req.body; // id_admin can be taken from req.admin.id
      const id_admin = req.admin.id; // Get admin ID from decoded token

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

// Ambil argumen dari CLI
const args = process.argv.slice(2);

if (args[0] === "--add-admin") {
  const email = args[1];
  const password = args[2];

  if (!email || !password) {
    console.error(
      "❌ Format salah. Gunakan: node server.js --add-admin [email] [password]"
    );
    process.exit(1);
  }

  // Connect to the database to add the admin
  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  db.connect((err) => {
    if (err) {
      console.error("❌ Gagal terhubung ke database:", err);
      process.exit(1);
    }
    console.log(
      `Connected to MySQL database ${process.env.DB_NAME} for admin creation.`
    );

    // Hash password dan simpan ke DB
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error("❌ Gagal mengenkripsi password:", err);
        db.end(); // Close DB connection
        process.exit(1);
      }

      const sql = "INSERT INTO Admin (email, password) VALUES (?, ?)";
      db.query(sql, [email, hashedPassword], (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            console.error("❌ Gagal menyimpan admin: Email sudah terdaftar");
          } else {
            console.error("❌ Gagal menyimpan admin:", err);
          }
          db.end(); // Close DB connection
          process.exit(1);
        }

        console.log("✅ Admin berhasil dibuat dengan ID:", result.insertId);
        db.end(); // Close DB connection
        process.exit(0);
      });
    });
  });
} else {
  // If no specific CLI argument is provided, start the server
  const shouldRebuild = process.argv.includes("--rebuild");
  startServer(shouldRebuild);
}
