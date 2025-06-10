import express from "express";
import mysql from "mysql2/promise"; // <-- Keep this for promise-based operations
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import crypto from "crypto"; // This imports the entire module, but randomBytes might not be directly exposed as a default export


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
console.log("JWT_SECRET (present):", !!process.env.JWT_SECRET);
console.log("VITE_DOMAIN_SERVER:", process.env.VITE_DOMAIN_SERVER);
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
    cb(null, "vehicle-file-" + uniqueSuffix + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"), false);
  },
});

app.use(
  cors({
    origin: VITE_DOMAIN_SERVER,
    credentials: true,
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
app.use(cookieParser());
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
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Akses ditolak. Tidak ada token otentikasi." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Token tidak valid atau kadaluarsa." });
  }
};

// Function to create default tickets (1-100)
async function createDefaultTickets(db) {
  try {
    const [results] = await db.query("SELECT COUNT(*) as count FROM Tiket");

    const ticketCount = results[0].count;
    if (ticketCount > 0) {
      console.log(
        `Found ${ticketCount} existing tickets, skipping default creation.`
      );
      return;
    }

    console.log("Creating default tickets 1-100...");

    const values = [];
    for (let i = 1; i <= 100; i++) {
      values.push([i.toString().padStart(3, "0")]); // Correct format for batch insert with mysql2/promise
    }

    const sql = `INSERT INTO Tiket (nomor_tiket) VALUES ?`;
    const [result] = await db.query(sql, [values]);

    console.log(`Successfully created ${result.affectedRows} default tickets.`);
  } catch (err) {
    console.error("Error creating default tickets:", err);
    throw err;
  }
}

// Function to create tables (used in rebuild mode)
// Function to create tables (used in rebuild mode)
async function createTables(db) {
  try {
    await db.query(
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
        password VARCHAR(255) NOT NULL -- <--- THIS LINE WAS CHANGED
      );

      CREATE TABLE IF NOT EXISTS Log_Backup (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waktu_backup DATETIME NOT NULL,
        id_admin INT,
        FOREIGN KEY (id_admin) REFERENCES Admin(id)
      );
    `
    );
    console.log("All tables created or confirmed exist.");
  } catch (err) {
    console.error("Error creating tables:", err);
    throw err;
  }
}

// Main function to initialize DB and server
async function startServer(rebuild = false) {
  let dbPool; // Renamed to dbPool to clearly indicate it's a pool

  try {
    // Temporary connection without DB, to create DB if not exists
    const tempDb = await mysql.createConnection({
      // Direct connection
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
    });

    await tempDb.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`Database ${DB_NAME} siap digunakan`);
    await tempDb.end();

    // Connect to main DB using a Connection Pool
    dbPool = mysql.createPool({
      // <-- Use createPool
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true, // Default true
      connectionLimit: 10, // Adjust as needed
      queueLimit: 0, // Default 0
      multipleStatements: true,
      timezone: TIME_ZONE || "Asia/Jakarta",
    });
    console.log(
      `Connected to MySQL database ${DB_NAME} (using connection pool)`
    );

    // Use a temporary connection from the pool for initial setup
    const initialConnection = await dbPool.getConnection();
    try {
      if (rebuild) {
        console.log("Rebuild mode: dropping and recreating tables...");
        await initialConnection.query(
          `
            DROP TABLE IF EXISTS Log_Backup;
            DROP TABLE IF EXISTS Log_Parkir;
            DROP TABLE IF EXISTS Tiket;
            DROP TABLE IF EXISTS Admin;
            DROP TABLE IF EXISTS Kendaraan;
          `
        );
        console.log("Dropped existing tables.");

        await createTables(initialConnection);
        await createDefaultTickets(initialConnection);
      } else {
        await createTables(initialConnection);
        await createDefaultTickets(initialConnection);
      }
    } finally {
      initialConnection.release(); // Release the initial connection
    }

    // === API ENDPOINTS ===

    // CREATE TICKET
    app.post("/api/tiket", authenticateToken, async (req, res) => {
      const { nomor_tiket } = req.body;
      if (!nomor_tiket) {
        return res.status(400).json({ error: "nomor_tiket is required" });
      }

      try {
        const sql = `INSERT INTO Tiket (nomor_tiket, tersedia) VALUES (?, TRUE)`;
        const [result] = await dbPool.query(sql, [nomor_tiket]); // Use dbPool directly for simple queries
        res.json({ message: "Tiket berhasil dibuat", id: result.insertId });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Nomor tiket sudah ada" });
        }
        return res.status(500).json({ error: err.message });
      }
    });

    // GET AVAILABLE TICKETS ONLY
    app.get("/api/tiket/tersedia", authenticateToken, async (req, res) => {
      try {
        const [results] = await dbPool.query(
          `SELECT * FROM Tiket WHERE tersedia = TRUE ORDER BY nomor_tiket`
        );
        res.json(results);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });

    // GET ALL TICKETS
    app.get("/api/tiket", authenticateToken, async (req, res) => {
      try {
        const [results] = await dbPool.query(
          `SELECT * FROM Tiket ORDER BY created_at DESC`
        );
        res.json(results);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });

    // UPDATE TICKET AVAILABILITY
    app.put("/api/tiket/:id/tersedia", authenticateToken, async (req, res) => {
      const { id } = req.params;
      const { tersedia } = req.body;

      if (typeof tersedia !== "boolean") {
        return res
          .status(400)
          .json({ error: "tersedia must be boolean (true/false)" });
      }

      try {
        const sql = `UPDATE Tiket SET tersedia = ? WHERE id = ?`;
        const [result] = await dbPool.query(sql, [tersedia, id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Tiket tidak ditemukan" });
        }
        res.json({
          message: `Tiket ${tersedia ? "diaktifkan" : "dinonaktifkan"}`,
        });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });

    // CREATE KENDARAAN (Vehicle)
    app.post("/api/kendaraan", authenticateToken, async (req, res) => {
      const { plat_nomor } = req.body;
      const sql = `INSERT INTO Kendaraan (plat_nomor) VALUES (?)`;

      try {
        const [result] = await dbPool.query(sql, [plat_nomor]);
        res.json({ message: "Kendaraan ditambahkan", id: result.insertId });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Plat nomor sudah terdaftar" });
        }
        return res.status(500).json({ error: err.message });
      }
    });

    // PARKIR MASUK (Vehicle Entry)
    app.post(
      "/api/parkirMasuk",
      authenticateToken,
      upload.single("foto_masuk"),
      async (req, res) => {
        console.log("=== parkirMasuk request received ===");
        console.log("Body keys:", Object.keys(req.body));
        console.log(
          "File (from Multer):",
          req.file ? req.file.filename : "No file via Multer"
        );

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
            console.log(
              "Image received from Multer (file upload):",
              foto_filename
            );
          } else if (foto_base64) {
            console.log(
              "Processing base64 image, size:",
              Math.round(foto_base64.length / 1024),
              "KB"
            );
            const timestamp = Date.now();
            const uniqueSuffix = Math.round(Math.random() * 1e9);
            const filename = `vehicle-camera-${timestamp}-${uniqueSuffix}.jpeg`;
            foto_filename = saveBase64Image(foto_base64, filename);
            console.log(
              "Image received as base64 and saved as:",
              foto_filename
            );
          }

          // --- Database Operations using async/await and connection from pool ---
          const connection = await dbPool.getConnection(); // <-- Get connection from pool

          try {
            await connection.beginTransaction();

            // 1. Check if Ticket is Available
            const [tiketRows] = await connection.query(
              `SELECT id FROM Tiket WHERE nomor_tiket = ? AND tersedia = TRUE`,
              [nomor_tiket]
            );

            if (tiketRows.length === 0) {
              await connection.rollback();
              return res.status(400).json({
                error: "Tiket tidak tersedia atau tidak ditemukan",
              });
            }
            const id_tiket = tiketRows[0].id;

            // 2. Find or Create Vehicle
            const [kendaraanRows] = await connection.query(
              `SELECT id FROM Kendaraan WHERE plat_nomor = ?`,
              [plat_nomor]
            );

            let id_kendaraan;
            if (kendaraanRows.length > 0) {
              id_kendaraan = kendaraanRows[0].id;
            } else {
              const [result] = await connection.query(
                `INSERT INTO Kendaraan (plat_nomor) VALUES (?)`,
                [plat_nomor]
              );
              id_kendaraan = result.insertId;
            }

            // 3. Update Ticket availability to FALSE
            await connection.query(
              `UPDATE Tiket SET tersedia = FALSE WHERE id = ?`,
              [id_tiket]
            );

            // 4. Insert parking log
            const [logResult] = await connection.query(
              `INSERT INTO Log_Parkir (id_kendaraan, id_tiket, waktu_masuk, foto_masuk) VALUES (?, ?, ?, ?)`,
              [id_kendaraan, id_tiket, waktu_masuk, foto_filename]
            );

            await connection.commit();
            console.log(
              "Parking entry recorded successfully and ticket updated."
            );

            res.json({
              message: "Parkir masuk tercatat",
              id: logResult.insertId,
              nomor_tiket: nomor_tiket,
              foto_path: foto_filename ? `/uploads/${foto_filename}` : null,
            });
          } catch (transactionErr) {
            await connection.rollback();
            console.error("Transaction error in parkirMasuk:", transactionErr);
            throw transactionErr;
          } finally {
            connection.release(); // <-- Release connection back to pool
          }
        } catch (error) {
          console.error("Error processing /api/parkirMasuk request:", error);
          if (error.message.includes("Only image files are allowed!")) {
            return res.status(400).json({ error: error.message });
          }
          return res
            .status(500)
            .json({ error: "Failed to process request: " + error.message });
        }
      }
    );

    // PARKIR KELUAR (Vehicle Exit)
    app.post("/api/parkirKeluar", authenticateToken, async (req, res) => {
      const { nomor_tiket } = req.body;

      if (!nomor_tiket) {
        return res.status(400).json({ error: "Nomor tiket wajib diisi" });
      }

      const connection = await dbPool.getConnection(); // <-- Get connection from pool

      try {
        await connection.beginTransaction();

        // 1. Get Ticket ID
        const [tiketRows] = await connection.query(
          `SELECT id FROM Tiket WHERE nomor_tiket = ?`,
          [nomor_tiket]
        );

        if (tiketRows.length === 0) {
          await connection.rollback();
          return res.status(404).json({ error: "Nomor tiket tidak ditemukan" });
        }
        const id_tiket = tiketRows[0].id;

        // 2. Update Log_Parkir (set waktu_keluar)
        const [updateLogResult] = await connection.query(
          `
          UPDATE Log_Parkir
          SET waktu_keluar = NOW()
          WHERE id_tiket = ? AND waktu_keluar IS NULL
        `,
          [id_tiket]
        );

        if (updateLogResult.affectedRows === 0) {
          await connection.rollback();
          return res.status(404).json({
            error: "Tidak ada log parkir aktif untuk tiket ini",
          });
        }

        // 3. Update Tiket (set tersedia = TRUE)
        await connection.query(
          `UPDATE Tiket SET tersedia = TRUE WHERE id = ?`,
          [id_tiket]
        );

        await connection.commit();
        console.log("Parking exit recorded, ticket available again.");
        res.json({
          message: "Parkir keluar tercatat, tiket tersedia kembali",
        });
      } catch (err) {
        await connection.rollback();
        console.error("Error in parkirKeluar transaction:", err);
        return res
          .status(500)
          .json({ error: "Gagal memproses parkir keluar: " + err.message });
      } finally {
        connection.release(); // <-- Release connection back to pool
      }
    });

    // GET PARKING LOGS WITH DETAILS
    app.get("/api/logParkir", authenticateToken, async (req, res) => {
      try {
        const [results] = await dbPool.query(
          // Use dbPool directly
          `
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
      `
        );
        res.json(results);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });

    // Admin Registration
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
        const [result] = await dbPool.query(sql, [email, hashedPassword]); // Use dbPool directly
        res.json({
          message: "Admin berhasil didaftarkan",
          id: result.insertId,
        });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Email sudah terdaftar" });
        }
        res.status(500).json({ error: err.message });
      }
    });

    // Admin Login
    app.post("/api/admin/login", async (req, res) => {
      const { email, password } = req.body;
      console.log("Login attempt with:", { email, password });

      if (!email || !password) {
        return res.status(400).json({ error: "Email atau Password Salah!" });
      }

      try {
        const [results] = await dbPool.query(
          `SELECT * FROM Admin WHERE email = ?`,
          [email]
        ); // Use dbPool directly

        if (results.length === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          return res.status(400).json({ error: "Email atau Password Salah!" });
        }

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);

        if (!match) {
          return res.status(400).json({ error: "Email atau Password Salah!" });
        }

        const payload = { id: admin.id, email: admin.email };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });

        res.cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: "Lax",
        });

        res.json({ message: "Login berhasil", id_admin: admin.id });
      } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ error: "Terjadi kesalahan server." });
      }
    });

    app.get("/api/check-auth", authenticateToken, (req, res) => {
      res.status(200).json({
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

    // BACKUP LOG
    app.post("/api/backup", authenticateToken, async (req, res) => {
      const { waktu_backup } = req.body;
      const id_admin = req.admin.id;

      if (!waktu_backup || !id_admin) {
        return res
          .status(400)
          .json({ error: "Missing waktu_backup or id_admin" });
      }
      try {
        const sql = `INSERT INTO Log_Backup (waktu_backup, id_admin) VALUES (?, ?)`;
        await dbPool.query(sql, [waktu_backup, id_admin]); // Use dbPool directly
        res.json({ message: "Log backup berhasil dicatat" });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
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
  // Use promise-based connection here too for consistency and safety
  mysql
    .createConnection({
      // Direct connection for CLI tool
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    })
    .then(async (connection) => {
      console.log(
        `Connected to MySQL database ${process.env.DB_NAME} for admin creation.`
      );

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO Admin (email, password) VALUES (?, ?)";
        const [result] = await connection.query(sql, [email, hashedPassword]);

        console.log("✅ Admin berhasil dibuat dengan ID:", result.insertId);
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          console.error("❌ Gagal menyimpan admin: Email sudah terdaftar");
        } else {
          console.error("❌ Gagal menyimpan admin:", err);
        }
      } finally {
        await connection.end(); // Close DB connection
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error("❌ Gagal terhubung ke database:", err);
      process.exit(1);
    });
} else {
  // If no specific CLI argument is provided, start the server
  const shouldRebuild = process.argv.includes("--rebuild");
  startServer(shouldRebuild);
}

if (args[0] === "--generate-key") {
  const envFilePath = path.join(__dirname, ".env");
  const newSecret = crypto.randomBytes(32).toString("hex"); // Generate 32 bytes (64 hex characters)

  try {
    let envContent = "";
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, "utf8");
    }

    const jwtSecretRegex = /^JWT_SECRET=.*$/m; // Regex to find JWT_SECRET line
    if (envContent.match(jwtSecretRegex)) {
      envContent = envContent.replace(jwtSecretRegex, `JWT_SECRET=${newSecret}`);
      console.log("✅ JWT_SECRET updated in .env file.");
    } else {
      envContent += `\nJWT_SECRET=${newSecret}`;
      console.log("✅ JWT_SECRET added to .env file.");
    }

    fs.writeFileSync(envFilePath, envContent.trim() + "\n"); // Trim and ensure a newline at end
    console.log("Generated new JWT Secret and saved to .env.");
    console.log(`New JWT_SECRET: ${newSecret}`);
    console.log("⚠️ Remember to restart your server for the changes to take effect.");
    process.exit(0);

  } catch (err) {
    console.error("❌ Failed to generate or save JWT_SECRET:", err);
    process.exit(1);
  }
}