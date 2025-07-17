// server.js (or app.js)

import express from "express";
import mysql from "mysql2/promise";
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
import crypto from "crypto";
import http from "http";
import { Server } from "socket.io";
import { exec } from "child_process"; // Import exec from child_process

// Polyfill for __filename and __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, ".env") });

// Destructure environment variables
const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  TIME_ZONE, // Note: TIME_ZONE from .env isn't directly used in dbPool currently, but good to have
  JWT_SECRET,
  VITE_DOMAIN_SERVER, // This is crucial for CORS and Socket.IO origin
} = process.env;

// Log environment variables for debugging purposes (especially during deployment)
console.log("=== ENVIRONMENT VARIABLES ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASS ? "********" : "NOT SET"); // Mask password
console.log("DB_NAME:", process.env.DB_NAME);
console.log("JWT_SECRET (present):", !!process.env.JWT_SECRET);
// Log VITE_DOMAIN_SERVER to ensure it's loaded correctly at runtime
console.log("VITE_DOMAIN_SERVER:", process.env.VITE_DOMAIN_SERVER); 
console.log("TIME_ZONE (from .env):", process.env.TIME_ZONE);
console.log("=============================");

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server with CORS configuration
// The 'origin' here MUST match the exact domain of your frontend application when deployed
const io = new Server(server, {
  cors: {
    origin: VITE_DOMAIN_SERVER, // This line correctly uses the environment variable
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Create 'uploads' directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory:", uploadsDir);
}

// Create 'backups' directory if it doesn't exist
const backupsDir = path.join(__dirname, "backups");
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
  console.log("Created backups directory:", backupsDir);
}

// Multer storage for general file uploads (images)
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

// Multer storage for SQL files (for database restore)
const sqlStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir), // Store temporarily in uploads
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    if (ext.toLowerCase() !== '.sql') {
        return cb(new Error("Only .sql files are allowed for restore!"), false);
    }
    cb(null, `restore-${uniqueSuffix}${ext}`);
  },
});
const uploadSql = multer({
  storage: sqlStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.sql' || file.mimetype === 'application/x-sql') {
      cb(null, true);
    } else {
      cb(new Error("Only .sql files are allowed for restore!"), false);
    }
  },
});

// CORS middleware for Express (HTTP requests)
// This also uses the VITE_DOMAIN_SERVER for origin control
app.use(
  cors({
    origin: VITE_DOMAIN_SERVER,
    credentials: true,
  })
);

// Body-parser middleware for JSON and URL-encoded data
app.use(bodyParser.json({ limit: "50mb", parameterLimit: 50000 }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
// Express built-in body-parser (can replace body-parser package if not using specific features)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Cookie-parser middleware for handling cookies
app.use(cookieParser());

// Serve static files from 'uploads' and 'backups' directories
app.use("/uploads", express.static(uploadsDir));
app.use("/backups", express.static(backupsDir));

// Critical check for JWT_SECRET
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1);
}

// Helper function to save Base64 images
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

// Middleware to authenticate JWT token
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

let dbPool; // Database connection pool

// Helper function to create log messages and emit updates
const createLogMessage = async (message, adminId, adminEmail) => {
  if (!dbPool) {
    console.warn("Database pool not initialized for logging.");
    return;
  }
  try {
    const sql = `INSERT INTO LogMessages (tanggal_pesan, isi_pesan, id_admin) VALUES (NOW(), ?, ?)`;
    const formattedMessage = message.replace("email_admin", adminEmail || "Unknown Admin");
    await dbPool.query(sql, [formattedMessage, adminId || null]);
    console.log(`LogMessages recorded: ${formattedMessage}`);

    // Emit WebSocket update for log messages
    emitDashboardUpdate('logMessages');
  } catch (err) {
    console.error("Error creating log message:", err);
  }
};

// --- WebSocket Emit Helper Function ---
// This function fetches data and emits it to all connected WebSocket clients
const emitDashboardUpdate = async (type) => {
  try {
    let data;
    switch (type) {
      case 'parkingLogs':
        const [logs] = await dbPool.query(
          `SELECT
            lp.id,
            k.plat_nomor,
            t.nomor_tiket,
            lp.waktu_masuk,
            lp.waktu_keluar,
            -- Ensure VITE_DOMAIN_SERVER is correctly prepended for image paths
            CONCAT('${VITE_DOMAIN_SERVER}/uploads/', lp.foto_masuk) AS foto_masuk,
            CASE WHEN lp.waktu_keluar IS NULL THEN 'active' ELSE 'completed' END as status
          FROM Log_Parkir lp
          JOIN Kendaraan k ON lp.id_kendaraan = k.id
          JOIN Tiket t ON lp.id_tiket = t.id
          ORDER BY lp.waktu_masuk DESC
          LIMIT 20`
        );
        data = logs;
        break;
      case 'availableTickets':
        const [availableTickets] = await dbPool.query(
          `SELECT id, nomor_tiket FROM Tiket WHERE tersedia = TRUE ORDER BY nomor_tiket`
        );
        data = availableTickets;
        break;
      case 'totalAvailableTickets':
        const [totalAvailable] = await dbPool.query(
          `SELECT COUNT(*) AS count FROM Tiket WHERE tersedia = TRUE`
        );
        data = totalAvailable[0].count;
        break;
      case 'totalActiveVehicles':
        const [activeVehicles] = await dbPool.query(
          `SELECT COUNT(*) AS count FROM Log_Parkir WHERE waktu_keluar IS NULL`
        );
        data = activeVehicles[0].count;
        break;
      case 'revenueSummary':
          const [monthlyRevenue] = await dbPool.query(
              `SELECT
                  MONTH(tanggal_pemasukan) AS month_number,
                  SUM(nominal_pemasukan) AS total_revenue
               FROM PemasukanMingguan
               WHERE YEAR(tanggal_pemasukan) = YEAR(CURDATE())
               GROUP BY MONTH(tanggal_pemasukan)
               ORDER BY month_number ASC`
          );
          const getMonthName = (monthNumber) => {
              const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
              return months[monthNumber - 1];
          };
          data = monthlyRevenue.map(row => ({
              month_name: getMonthName(row.month_number),
              total_revenue: row.total_revenue,
          }));
          break;
      case 'logMessages':
          const [logMsgs] = await dbPool.query(`
              SELECT
                  lm.id,
                  lm.tanggal_pesan,
                  lm.isi_pesan,
                  a.email AS admin_email
              FROM LogMessages lm
              LEFT JOIN Admin a ON lm.id_admin = a.id
              ORDER BY lm.tanggal_pesan DESC
              LIMIT 50
          `);
          data = logMsgs;
          break;
      case 'weeklyParkingTrend':
          const [weeklyParkingDataRaw] = await dbPool.query(`
              SELECT
                  -- MySQL's WEEK(date, mode) function. Mode 0 means Sunday is the first day of the week.
                  -- This calculates week number within the month.
                  WEEK(lp.waktu_masuk, 0) -
                  WEEK(DATE_FORMAT(lp.waktu_masuk, '%Y-%m-01'), 0) + 1 AS week_in_month,
                  COUNT(*) AS total_vehicles
              FROM Log_Parkir lp
              WHERE
                  YEAR(lp.waktu_masuk) = YEAR(CURDATE()) AND MONTH(lp.waktu_masuk) = MONTH(CURDATE())
              GROUP BY
                  week_in_month
              ORDER BY
                  week_in_month;
          `);

          const allWeeksLabels = ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4', 'Minggu 5'];
          const formattedWeeklyData = allWeeksLabels.map((label, index) => ({
              week_of_month: label,
              total_vehicles: 0
          }));

          weeklyParkingDataRaw.forEach(row => {
              const weekIndex = row.week_in_month - 1;
              if (weekIndex >= 0 && weekIndex < formattedWeeklyData.length) {
                  formattedWeeklyData[weekIndex].total_vehicles = row.total_vehicles;
              }
          });

          // Limit to 4 weeks, as typically a month has 4 full weeks. Adjust if needed.
          data = formattedWeeklyData.slice(0, 4);
          break;
      default:
        console.warn('Unknown dashboard update type:', type);
        return;
    }
    // Emit the data to all connected clients
    io.emit(type + 'Update', data);
    console.log(`Emitted ${type}Update WebSocket event.`);
  } catch (error) {
    console.error(`Error emitting ${type} update:`, error);
  }
};

// Function to create default tickets if none exist
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
      values.push([i.toString().padStart(3, "0")]); // Format as 001, 002, etc.
    }

    const sql = `INSERT INTO Tiket (nomor_tiket) VALUES ?`;
    const [result] = await db.query(sql, [values]);

    console.log(`Successfully created ${result.affectedRows} default tickets.`);
  } catch (err) {
    console.error("Error creating default tickets:", err);
    throw err;
  }
}

// Function to create all necessary database tables
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
        password VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS Log_Backup (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waktu_backup DATETIME NOT NULL,
        id_admin INT,
        FOREIGN KEY (id_admin) REFERENCES Admin(id)
      );
      
      CREATE TABLE IF NOT EXISTS PemasukanMingguan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal_pemasukan DATE NOT NULL,
        nominal_pemasukan DECIMAL(15, 0) NOT NULL,
        nominal_bersih DECIMAL(15, 0) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS LogMessages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal_pesan DATETIME DEFAULT CURRENT_TIMESTAMP, 
        isi_pesan TEXT NOT NULL,
        id_admin INT,
        FOREIGN KEY (id_admin) REFERENCES Admin(id)
      );

      CREATE TABLE IF NOT EXISTS LogPemulihan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waktu_pemulihan DATETIME NOT NULL,
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

// Main function to start the server
async function startServer(rebuild = false) {
  try {
    // Connect to MySQL without specifying database to create it if not exists
    const tempDb = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
    });

    await tempDb.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
    console.log(`Database ${DB_NAME} siap digunakan`);
    await tempDb.end();

    // Create a connection pool to the specified database
    dbPool = mysql.createPool({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      timezone: "Z", // Use 'Z' for UTC or set to '+07:00' if your DB timezone is WIB
    });
    console.log(
      `Connected to MySQL database ${DB_NAME} (using connection pool)`
    );

    const initialConnection = await dbPool.getConnection();
    try {
      if (rebuild) {
        console.log("Rebuild mode: dropping and recreating tables...");
        await initialConnection.query(
          `
            SET FOREIGN_KEY_CHECKS = 0;
            DROP TABLE IF EXISTS Log_Backup;
            DROP TABLE IF EXISTS Log_Parkir;
            DROP TABLE IF EXISTS PemasukanMingguan;
            DROP TABLE IF EXISTS Tiket;
            DROP TABLE IF EXISTS Admin;
            DROP TABLE IF EXISTS Kendaraan;
            DROP TABLE IF EXISTS LogMessages;
            DROP TABLE IF EXISTS LogPemulihan;
            SET FOREIGN_KEY_CHECKS = 1;
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
      initialConnection.release();
    }

    // --- WebSocket Connection Handling ---
    io.on('connection', (socket) => {
      console.log('A client connected via WebSocket:', socket.id);

      // Emit initial data to the newly connected client
      // This ensures the dashboard is populated immediately upon connection
      emitDashboardUpdate('parkingLogs');
      emitDashboardUpdate('availableTickets');
      emitDashboardUpdate('totalAvailableTickets');
      emitDashboardUpdate('totalActiveVehicles');
      emitDashboardUpdate('revenueSummary');
      emitDashboardUpdate('logMessages');
      emitDashboardUpdate('weeklyParkingTrend');

      socket.on('disconnect', () => {
        console.log('Client disconnected from WebSocket:', socket.id);
      });
    });


    // === API ENDPOINTS ===
    // (All your existing API endpoints follow here. No major changes needed)

    app.post("/api/tiket", authenticateToken, async (req, res) => {
      const { nomor_tiket } = req.body;
      const { id: adminId, email: adminEmail } = req.admin;

      if (!nomor_tiket) {
        return res.status(400).json({ error: "nomor_tiket is required" });
      }

      try {
        const sql = `INSERT INTO Tiket (nomor_tiket, tersedia) VALUES (?, TRUE)`;
        const [result] = await dbPool.query(sql, [nomor_tiket]);
        
        await createLogMessage(`email_admin telah menambah tiket nomor ${nomor_tiket}`, adminId, adminEmail);
        emitDashboardUpdate('availableTickets');
        emitDashboardUpdate('totalAvailableTickets');

        res.json({ message: "Tiket berhasil dibuat", id: result.insertId });
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ error: "Nomor tiket sudah ada" });
        }
        return res.status(500).json({ error: err.message });
      }
    });

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

    app.put("/api/tiket/:id/tersedia", authenticateToken, async (req, res) => {
      const { id } = req.params;
      const { tersedia } = req.body;
      const { id: adminId, email: adminEmail } = req.admin;


      if (typeof tersedia !== "boolean") {
        return res
          .status(400)
          .json({ error: "tersedia must be boolean (true/false)" });
      }

      try {
        const [ticketData] = await dbPool.query(`SELECT nomor_tiket FROM Tiket WHERE id = ?`, [id]);
        if (ticketData.length === 0) {
            return res.status(404).json({ error: "Tiket tidak ditemukan" });
        }
        const nomor_tiket = ticketData[0].nomor_tiket;

        const sql = `UPDATE Tiket SET tersedia = ? WHERE id = ?`;
        const [result] = await dbPool.query(sql, [tersedia, id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Tiket tidak ditemukan" });
        }

        await createLogMessage(`email_admin telah ${tersedia ? "mengaktifkan" : "menonaktifkan"} tiket nomor ${nomor_tiket}`, adminId, adminEmail);
        emitDashboardUpdate('availableTickets');
        emitDashboardUpdate('totalAvailableTickets');

        res.json({
          message: `Tiket ${tersedia ? "diaktifkan" : "dinonaktifkan"}`,
        });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });

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

    app.get("/api/logParkir", authenticateToken, async (req, res) => {
      try {
        const [results] = await dbPool.query(
          `
        SELECT
          lp.id,
          k.plat_nomor,
          t.nomor_tiket,
          lp.waktu_masuk,
          lp.waktu_keluar,
          CONCAT('${VITE_DOMAIN_SERVER}/backend/uploads/', lp.foto_masuk) AS foto_masuk,
          CASE WHEN lp.waktu_keluar IS NULL THEN 'active' ELSE 'completed' END as status
        FROM Log_Parkir lp
        JOIN Kendaraan k ON lp.id_kendaraan = k.id
        JOIN Tiket t ON lp.id_tiket = t.id
        ORDER BY lp.waktu_masuk DESC
      `
        );
        res.json(results);
      } catch (err) {
        console.error("Error fetching parking logs:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch parking logs: " + err.message });
      }
    });

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
        const { id: adminId, email: adminEmail } = req.admin;


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

          const connection = await dbPool.getConnection();

          try {
            await connection.beginTransaction();

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

            await connection.query(
              `UPDATE Tiket SET tersedia = FALSE WHERE id = ?`,
              [id_tiket]
            );

            const [logResult] = await connection.query(
              `INSERT INTO Log_Parkir (id_kendaraan, id_tiket, waktu_masuk, foto_masuk) VALUES (?, ?, ?, ?)`,
              [id_kendaraan, id_tiket, waktu_masuk, foto_filename]
            );

            await connection.commit();
            console.log(
              "Parking entry recorded successfully and ticket updated."
            );

            await createLogMessage(`email_admin telah memakai No. Tiket ${nomor_tiket}`, adminId, adminEmail);
            emitDashboardUpdate('parkingLogs');
            emitDashboardUpdate('availableTickets');
            emitDashboardUpdate('totalAvailableTickets');
            emitDashboardUpdate('totalActiveVehicles');
            emitDashboardUpdate('weeklyParkingTrend');


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
            connection.release();
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

    app.post("/api/parkirKeluar", authenticateToken, async (req, res) => {
      const { nomor_tiket } = req.body;
      const { id: adminId, email: adminEmail } = req.admin;

      if (!nomor_tiket) {
        return res.status(400).json({ error: "Nomor tiket wajib diisi" });
      }

      const connection = await dbPool.getConnection();

      try {
        await connection.beginTransaction();

        const [logInfo] = await connection.query(
          `
          SELECT lp.id, lp.id_tiket, k.plat_nomor
          FROM Log_Parkir lp
          JOIN Kendaraan k ON lp.id_kendaraan = k.id
          WHERE lp.id_tiket = (SELECT id FROM Tiket WHERE nomor_tiket = ?) AND lp.waktu_keluar IS NULL
          ORDER BY lp.waktu_masuk DESC LIMIT 1
          `,
          [nomor_tiket]
        );

        if (logInfo.length === 0) {
          await connection.rollback();
          return res.status(404).json({
            error: "Tidak ada log parkir aktif untuk tiket ini",
          });
        }
        const { id: logId, id_tiket, plat_nomor } = logInfo[0];


        const [updateLogResult] = await connection.query(
          `
          UPDATE Log_Parkir
          SET waktu_keluar = NOW()
          WHERE id = ?
        `,
          [logId]
        );

        await connection.query(
          `UPDATE Tiket SET tersedia = TRUE WHERE id = ?`,
          [id_tiket]
        );

        await connection.commit();
        console.log("Parking exit recorded, ticket available again.");

        await createLogMessage(`email_admin telah mengembalikan No. Tiket ${nomor_tiket}`, adminId, adminEmail);
        emitDashboardUpdate('parkingLogs');
        emitDashboardUpdate('availableTickets');
        emitDashboardUpdate('totalAvailableTickets');
        emitDashboardUpdate('totalActiveVehicles');
        emitDashboardUpdate('weeklyParkingTrend');

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
        connection.release();
      }
    });

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
        const [result] = await dbPool.query(sql, [email, hashedPassword]);
        
        await createLogMessage(`email_admin telah menambah admin baru dengan email: ${email}`, null, email);

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

    app.post("/api/admin/login", async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email atau Password Salah!" });
      }

      try {
        const [results] = await dbPool.query(
          `SELECT * FROM Admin WHERE email = ?`,
          [email]
        );

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
          secure: process.env.NODE_ENV === "production", // Set to true in production for HTTPS
          maxAge: 24 * 60 * 60 * 1000,
          sameSite: "Lax", // Or 'None' with secure:true if cross-site
        });

        await createLogMessage(`email_admin telah berhasil login`, admin.id, admin.email);

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

    app.post("/api/admin/logout", authenticateToken, async (req, res) => {
      const { id: adminId, email: adminEmail } = req.admin;

      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 0, 
        sameSite: "Lax",
      });
      await createLogMessage(`email_admin telah logout`, adminId, adminEmail);

      res.json({ message: "Logout berhasil" });
    });

    app.post("/api/pemasukanMingguan", authenticateToken, async (req, res) => {
      const { tanggal_pemasukan, nominal_pemasukan } = req.body;
      const { id: adminId, email: adminEmail } = req.admin;

      if (
        !tanggal_pemasukan ||
        typeof nominal_pemasukan === "undefined" ||
        nominal_pemasukan < 0
      ) {
        return res.status(400).json({
          error:
            "Tanggal pemasukan dan nominal pemasukan yang valid wajib diisi.",
        });
      }

      try {
        const nominal_bersih = nominal_pemasukan - nominal_pemasukan * 0.2; // Assuming 20% deduction

        const sql = `INSERT INTO PemasukanMingguan (tanggal_pemasukan, nominal_pemasukan, nominal_bersih) VALUES (?, ?, ?)`;
        const [result] = await dbPool.query(sql, [
          tanggal_pemasukan,
          nominal_pemasukan,
          nominal_bersih,
        ]);

        await createLogMessage(`email_admin telah menambah pemasukan sebesar Rp ${nominal_pemasukan.toLocaleString('id-ID')}`, adminId, adminEmail);
        emitDashboardUpdate('revenueSummary');

        res.status(201).json({
          message: "Pemasukan berhasil ditambahkan",
          id: result.insertId,
        });
      } catch (err) {
        console.error("Error adding pemasukan:", err);
        res
          .status(500)
          .json({ error: "Gagal menambahkan pemasukan: " + err.message });
      }
    });

    app.delete(
      "/api/pemasukanMingguan/:id",
      authenticateToken,
      async (req, res) => {
        const { id } = req.params;
        const { id: adminId, email: adminEmail } = req.admin;

        try {
          const [incomeData] = await dbPool.query(`SELECT nominal_pemasukan FROM PemasukanMingguan WHERE id = ?`, [id]);

          const sql = `DELETE FROM PemasukanMingguan WHERE id = ?`;
          const [result] = await dbPool.query(sql, [id]);

          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ error: "Data pemasukan tidak ditemukan." });
          }

          if (incomeData.length > 0) {
              await createLogMessage(`email_admin telah menghapus pemasukan sebesar Rp ${incomeData[0].nominal_pemasukan.toLocaleString('id-ID')}`, adminId, adminEmail);
          } else {
              await createLogMessage(`email_admin telah menghapus pemasukan (ID: ${id})`, adminId, adminEmail);
          }
          emitDashboardUpdate('revenueSummary');

          res.json({ message: "Data pemasukan berhasil dihapus." });
        } catch (err) {
          console.error("Error deleting pemasukan:", err);
          res
            .status(500)
            .json({ error: "Gagal menghapus pemasukan: " + err.message });
        }
      }
    );

    app.get(
      "/api/pemasukanMingguan/:id",
      authenticateToken,
      async (req, res) => {
        const { id } = req.params;

        try {
          const [results] = await dbPool.query(
            `SELECT id, tanggal_pemasukan, nominal_pemasukan, nominal_bersih FROM PemasukanMingguan WHERE id = ?`,
            [id]
          );

          if (results.length === 0) {
            return res
              .status(404)
              .json({ error: "Data pemasukan tidak ditemukan" });
          }

          res.json(results[0]);
        } catch (err) {
          console.error("Error fetching pemasukan by ID:", err);
          res
            .status(500)
            .json({ error: "Gagal mengambil data pemasukan: " + err.message });
        }
      }
    );

    app.put(
      "/api/pemasukanMingguan/:id",
      authenticateToken,
      async (req, res) => {
        const { id } = req.params;
        const { tanggal_pemasukan, nominal_pemasukan } = req.body;
        const { id: adminId, email: adminEmail } = req.admin;


        if (
          !tanggal_pemasukan ||
          nominal_pemasukan === undefined ||
          nominal_pemasukan < 0
        ) {
          return res
            .status(400)
            .json({ error: "Tanggal dan nominal pemasukan tidak valid." });
        }

        const nominal_bersih = nominal_pemasukan - nominal_pemasukan * 0.2;

        try {
          const [result] = await dbPool.query(
            `UPDATE PemasukanMingguan SET tanggal_pemasukan = ?, nominal_pemasukan = ?, nominal_bersih = ? WHERE id = ?`,
            [tanggal_pemasukan, nominal_pemasukan, nominal_bersih, id]
          );

          if (result.affectedRows === 0) {
            return res.status(404).json({
              error: "Data pemasukan tidak ditemukan atau tidak ada perubahan.",
            });
          }

          await createLogMessage(`email_admin telah mengubah pemasukan (ID: ${id}) menjadi Rp ${nominal_pemasukan.toLocaleString('id-ID')}`, adminId, adminEmail);
          emitDashboardUpdate('revenueSummary');


          res
            .status(200)
            .json({ message: "Data pemasukan berhasil diperbarui." });
        } catch (err) {
          console.error("Error updating pemasukan data:", err);
          res.status(500).json({
            error: "Gagal memperbarui data pemasukan: " + err.message,
          });
        }
      }
    );

    const getMonthNameForApi = (monthNumber) => { // Renamed to avoid conflict if already defined
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Ags",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      return months[monthNumber - 1];
    };

    app.get("/api/pemasukanBulanan", authenticateToken, async (req, res) => {
      try {
        const [results] = await dbPool.query(
          `SELECT
            MONTH(tanggal_pemasukan) AS month_number,
            SUM(nominal_pemasukan) AS total_revenue
         FROM PemasukanMingguan
         WHERE YEAR(tanggal_pemasukan) = YEAR(CURDATE())
         GROUP BY MONTH(tanggal_pemasukan)
         ORDER BY month_number ASC`
        );

        const formattedResults = results.map((row) => ({
          month_name: getMonthNameForApi(row.month_number),
          total_revenue: row.total_revenue,
        }));

        res.json(formattedResults);
      } catch (err) {
        console.error("Error fetching monthly revenue data:", err);
        res.status(500).json({
          error: "Gagal mengambil data pemasukan bulanan: " + err.message,
        });
      }
    });

    app.get("/api/pemasukanMingguan", authenticateToken, async (req, res) => {
      try {
        const [results] = await dbPool.query(
          `SELECT id, tanggal_pemasukan, nominal_pemasukan, nominal_bersih FROM PemasukanMingguan ORDER BY tanggal_pemasukan DESC`
        );
        res.json(results);
      } catch (err) {
        console.error("Error fetching all pemasukan:", err);
        res
          .status(500)
          .json({ error: "Gagal mengambil data pemasukan: " + err.message });
      }
    });

    app.get("/api/logMessages", authenticateToken, async (req, res) => {
        try {
            const [results] = await dbPool.query(`
                SELECT
                    lm.id,
                    lm.tanggal_pesan,
                    lm.isi_pesan,
                    a.email AS admin_email
                FROM LogMessages lm
                LEFT JOIN Admin a ON lm.id_admin = a.id
                ORDER BY lm.tanggal_pesan DESC
            `);
            res.json(results);
        }
        catch (err) {
            console.error("Error fetching log messages:", err);
            res.status(500).json({ error: "Gagal mengambil log pesan: " + err.message });
        }
    });

    app.post("/api/logMessages", authenticateToken, async (req, res) => {
        const { isi_pesan } = req.body;
        const { id: adminId, email: adminEmail } = req.admin;

        if (!isi_pesan) {
            return res.status(400).json({ error: "Isi pesan wajib diisi" });
        }

        try {
            await createLogMessage(isi_pesan, adminId, adminEmail);
            res.status(201).json({ message: "Pesan log berhasil ditambahkan" });
        } catch (err) {
            console.error("Error adding log message via API:", err);
            res.status(500).json({ error: "Gagal menambahkan pesan log: " + err.message });
        }
    });

    app.delete("/api/logMessages/:id", authenticateToken, async (req, res) => {
        const { id } = req.params;
        const { id: adminId, email: adminEmail } = req.admin;

        try {
            const [result] = await dbPool.query(`DELETE FROM LogMessages WHERE id = ?`, [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: "Pesan log tidak ditemukan" });
            }
            await createLogMessage(`email_admin telah menghapus pesan log (ID: ${id})`, adminId, adminEmail);

            res.json({ message: "Pesan log berhasil dihapus" });
        } catch (err) {
            console.error("Error deleting log message:", err);
            res.status(500).json({ error: "Gagal menghapus pesan log: " + err.message });
        }
    });

    // --- BACKUP DATABASE ENDPOINT ---
    app.post("/api/backup-database", authenticateToken, async (req, res) => {
      const { id: adminId, email: adminEmail } = req.admin;
      const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\./g, "_");
      const backupFileName = `${DB_NAME}_${timestamp}.sql`;
      const backupFilePath = path.join(backupsDir, backupFileName);

      const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > "${backupFilePath}"`;

      console.log(`Starting database backup to: ${backupFilePath}`);
      try {
        await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Backup failed: ${error.message}`);
              return reject(new Error(`Backup database gagal: ${error.message}`));
            }
            if (stderr) {
              console.warn(`Backup stderr: ${stderr}`);
            }
            console.log(`Backup stdout: ${stdout}`);
            console.log(`Database backup successful: ${backupFileName}`);
            resolve();
          });
        });

        // Log the backup in the database
        const logSql = `INSERT INTO Log_Backup (waktu_backup, id_admin) VALUES (NOW(), ?)`;
        await dbPool.query(logSql, [adminId]);
        
        await createLogMessage(`email_admin telah melakukan pencadangan database.`, adminId, adminEmail);

        res.status(200).json({
          message: "Pencadangan database berhasil!",
          file_name: backupFileName, // Still provide for immediate download on frontend
          download_url: `/backups/${backupFileName}`, // Still provide for immediate download on frontend
        });
      } catch (err) {
        console.error("Error during database backup:", err);
        res.status(500).json({ error: err.message });
      }
    });

    // --- RESTORE DATABASE ENDPOINT ---
    app.post("/api/restore-database", authenticateToken, uploadSql.single("sql_file"), async (req, res) => {
      const { id: adminId, email: adminEmail } = req.admin;

      if (!req.file) {
        return res.status(400).json({ error: "Tidak ada file SQL yang diunggah." });
      }

      const uploadedFilePath = req.file.path;
      const uploadedFileName = req.file.filename;

      console.log(`Starting database restore from: ${uploadedFilePath}`);
      const command = `mysql -h ${DB_HOST} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < "${uploadedFilePath}"`;

      try {
        await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Restore failed: ${error.message}`);
              if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath); // Delete on failure
              return reject(new Error(`Pemulihan database gagal: ${error.message}. Pastikan file SQL valid dan tidak korup.`));
            }
            if (stderr) {
              console.warn(`Restore stderr: ${stderr}`);
            }
            console.log(`Restore stdout: ${stdout}`);
            console.log(`Database restore successful from: ${uploadedFileName}`);
            resolve();
          });
        });

        // Log the restore in the database
        const logSql = `INSERT INTO LogPemulihan (waktu_pemulihan, id_admin) VALUES (NOW(), ?)`;
        await dbPool.query(logSql, [adminId]);

        await createLogMessage(`email_admin telah melakukan pemulihan database.`, adminId, adminEmail);

        // Delete the uploaded file after successful restore
        if (fs.existsSync(uploadedFilePath)) {
          fs.unlinkSync(uploadedFilePath);
          console.log(`Deleted uploaded SQL file: ${uploadedFileName}`);
        }

        res.status(200).json({
          message: "Pemulihan database berhasil!",
        });
      } catch (err) {
        console.error("Error during database restore:", err);
        res.status(500).json({ error: err.message });
      } finally {
        // Ensure file is deleted even if response fails for some reason
        if (fs.existsSync(uploadedFilePath)) {
          fs.unlinkSync(uploadedFilePath);
        }
      }
    });

    // --- GET BACKUP LOGS ---
    app.get("/api/backup-logs", authenticateToken, async (req, res) => {
      try {
        const [results] = await dbPool.query(`
          SELECT lb.id, lb.waktu_backup, a.email AS admin_email
          FROM Log_Backup lb
          LEFT JOIN Admin a ON lb.id_admin = a.id
          ORDER BY lb.waktu_backup DESC
        `);
        res.json(results);
      } catch (err) {
        console.error("Error fetching backup logs:", err);
        res.status(500).json({ error: "Gagal mengambil log backup: " + err.message });
      }
    });

    // --- GET RESTORE LOGS ---
    app.get("/api/restore-logs", authenticateToken, async (req, res) => {
      try {
        const [results] = await dbPool.query(`
          SELECT lpr.id, lpr.waktu_pemulihan, a.email AS admin_email
          FROM LogPemulihan lpr
          LEFT JOIN Admin a ON lpr.id_admin = a.id
          ORDER BY lpr.waktu_pemulihan DESC
        `);
        res.json(results);
      } catch (err) {
        console.error("Error fetching restore logs:", err);
        res.status(500).json({ error: "Gagal mengambil log pemulihan: " + err.message });
      }
    });


    app.get("/", (req, res) => {
      res.send("Server API Kendaraan Parkir aktif");
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Server API dan WebSocket berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Gagal memulai server:", error);
    process.exit(1);
  }
}

// Command-line argument handling for adding admin or generating JWT_SECRET
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

  mysql
    .createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_NAME,
    })
    .then(async (connection) => {
      console.log(
        `Connected to MySQL database ${DB_NAME} for admin creation.`
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
        await connection.end();
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error("❌ Gagal terhubung ke database:", err);
      process.exit(1);
    });
} else if (args[0] === "--generate-key") {
  const envFilePath = path.join(__dirname, ".env");
  const newSecret = crypto.randomBytes(32).toString("hex");

  try {
    let envContent = "";
    if (fs.existsSync(envFilePath)) {
      envContent = fs.readFileSync(envFilePath, "utf8");
    }

    const jwtSecretRegex = /^JWT_SECRET=.*$/m;
    if (envContent.match(jwtSecretRegex)) {
      envContent = envContent.replace(
        jwtSecretRegex,
        `JWT_SECRET=${newSecret}`
      );
      console.log("✅ JWT_SECRET updated in .env file.");
    } else {
      envContent += `\nJWT_SECRET=${newSecret}`;
      console.log("✅ JWT_SECRET added to .env file.");
    }

    fs.writeFileSync(envFilePath, envContent.trim() + "\n");
    console.log("Generated new JWT Secret and saved to .env.");
    console.log(`New JWT_SECRET: ${newSecret}`);
    console.log(
      "⚠️ Remember to restart your server for the changes to take effect."
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to generate or save JWT_SECRET:", err);
    process.exit(1);
  }
} else {
  const shouldRebuild = process.argv.includes("--rebuild");
  startServer(shouldRebuild);
}