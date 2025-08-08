// server.js (Ini adalah versi LENGKAP dari server.js dengan semua perbaikan terbaru)

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
import nodemailer from "nodemailer"; // Import nodemailer
import cron from "node-cron"; // Import node-cron

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
  GMAIL_USER, // NEW: Gmail user for SMTP
  GMAIL_APP_PASSWORD, // NEW: Gmail App Password
  EMAIL_SENDER_NAME, // NEW: Sender name for emails
  GMAIL_IMAGE_BRANDING,
  RECAPTCHA_SECRET_KEY, // NEW: ReCAPTCHA Secret Key
  ADMIN_AUTO_BACKUP_RECIPIENT_EMAIL, // NEW: Default admin email for auto backup
} = process.env;

const mail_image_logo = VITE_DOMAIN_SERVER + GMAIL_IMAGE_BRANDING;

// Log environment variables for debugging purposes (especially during deployment)
console.log("=== ENVIRONMENT VARIABLES ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS (present):", !!process.env.DB_PASS); // Mask password
console.log("DB_NAME:", process.env.DB_NAME);
console.log("JWT_SECRET (present):", !!process.env.JWT_SECRET);
console.log("VITE_DOMAIN_SERVER:", process.env.VITE_DOMAIN_SERVER);
console.log("TIME_ZONE (from .env):", process.env.TIME_ZONE);
console.log("GMAIL_USER:", process.env.GMAIL_USER); // Log new Gmail user
console.log("GMAIL_APP_PASSWORD (present):", !!process.env.GMAIL_APP_PASSWORD); // Log presence of App Password
console.log("EMAIL_SENDER_NAME:", process.env.EMAIL_SENDER_NAME); // Log sender name
console.log(
  "RECAPTCHA_SECRET_KEY (present):",
  !!process.env.RECAPTCHA_SECRET_KEY
); // Log presence of ReCAPTCHA key
console.log(
  "ADMIN_AUTO_BACKUP_RECIPIENT_EMAIL:",
  process.env.ADMIN_AUTO_BACKUP_RECIPIENT_EMAIL
); // Log default auto backup email
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
    if (ext.toLowerCase() !== ".sql") {
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
    if (ext === ".sql" || file.mimetype === "application/x-sql") {
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

// Critical check for JWT_SECRET and Gmail config
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined in .env file.");
  process.exit(1);
}
if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !EMAIL_SENDER_NAME) {
  console.error(
    "FATAL ERROR: Gmail SMTP credentials (GMAIL_USER, GMAIL_APP_PASSWORD, EMAIL_SENDER_NAME) are not defined in .env file."
  );
  process.exit(1);
}
if (!RECAPTCHA_SECRET_KEY) {
  console.error(
    "WARNING: RECAPTCHA_SECRET_KEY is not defined in .env file. ReCAPTCHA verification will not work."
  );
  // process.exit(1); // Decide if this should be a fatal error
}

// Nodemailer transporter setup
// This transporter will be used to send emails via Gmail SMTP
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs, useful for development but not recommended for production
    // rejectUnauthorized: false
  },
});

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
    const formattedMessage = message.replace(
      "email_admin",
      adminEmail || "Unknown Admin"
    );
    await dbPool.query(sql, [formattedMessage, adminId || null]);
    console.log(`LogMessages recorded: ${formattedMessage}`);

    // Emit WebSocket update for log messages
    emitDashboardUpdate("logMessages");
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
      case "parkingLogs":
        const [logs] = await dbPool.query(
          `SELECT
            lp.id,
            k.plat_nomor,
            t.nomor_tiket,
            -- Ambil langsung waktu karena DB sekarang akan menyimpan dalam WIB
            lp.waktu_masuk,
            lp.waktu_keluar,
            CONCAT('${VITE_DOMAIN_SERVER}/backend/uploads/', lp.foto_masuk) AS foto_masuk,
            CASE WHEN lp.waktu_keluar IS NULL THEN 'active' ELSE 'completed' END as status
          FROM Log_Parkir lp
          JOIN Kendaraan k ON lp.id_kendaraan = k.id
          JOIN Tiket t ON lp.id_tiket = t.id
          ORDER BY lp.waktu_masuk DESC
          LIMIT 20`
        );
        data = logs;
        break;
      case "availableTickets":
        const [availableTickets] = await dbPool.query(
          `SELECT id, nomor_tiket FROM Tiket WHERE tersedia = TRUE ORDER BY nomor_tiket`
        );
        data = availableTickets;
        break;
      case "totalAvailableTickets":
        const [totalAvailable] = await dbPool.query(
          `SELECT COUNT(*) AS count FROM Tiket WHERE tersedia = TRUE`
        );
        data = totalAvailable[0].count;
        break;
      case "totalActiveVehicles":
        const [activeVehicles] = await dbPool.query(
          `SELECT COUNT(*) AS count FROM Log_Parkir WHERE waktu_keluar IS NULL`
        );
        data = activeVehicles[0].count;
        break;
      case "revenueSummary":
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
        data = monthlyRevenue.map((row) => ({
          month_name: getMonthName(row.month_number),
          total_revenue: row.total_revenue,
        }));
        break;
      case "logMessages":
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
      case "weeklyParkingTrend":
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

        const allWeeksLabels = [
          "Minggu 1",
          "Minggu 2",
          "Minggu 3",
          "Minggu 4",
          "Minggu 5",
        ];
        const formattedWeeklyData = allWeeksLabels.map((label, index) => ({
          week_of_month: label,
          total_vehicles: 0,
        }));

        weeklyParkingDataRaw.forEach((row) => {
          const weekIndex = row.week_in_month - 1;
          if (weekIndex >= 0 && weekIndex < formattedWeeklyData.length) {
            formattedWeeklyData[weekIndex].total_vehicles = row.total_vehicles;
          }
        });

        // Limit to 4 weeks, as typically a month has 4 full weeks. Adjust if needed.
        data = formattedWeeklyData.slice(0, 4);
        break;
      default:
        console.warn("Unknown dashboard update type:", type);
        return;
    }
    // Emit the data to all connected clients
    io.emit(type + "Update", data);
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

      -- NEW TABLE: For storing pending admin registrations
      CREATE TABLE IF NOT EXISTS PendingAdmins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(50) NOT NULL UNIQUE,
        verification_code VARCHAR(10) NOT NULL,
        hashed_password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- NEW TABLE: For storing password reset tokens
      CREATE TABLE IF NOT EXISTS PasswordResetTokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        admin_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES Admin(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS Log_Backup (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waktu_backup DATETIME NOT NULL,
        id_admin INT,
        FOREIGN KEY (id_admin) REFERENCES Admin(id) ON DELETE CASCADE
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
        FOREIGN KEY (id_admin) REFERENCES Admin(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS LogPemulihan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        waktu_pemulihan DATETIME NOT NULL,
        id_admin INT,
        FOREIGN KEY (id_admin) REFERENCES Admin(id) ON DELETE CASCADE
      );

      -- MODIFIED TABLE: For admin-specific settings like auto backup (formerly SystemSettings)
      CREATE TABLE IF NOT EXISTS AdminSettings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_admin INT NOT NULL, -- Each admin has one settings row
        setting_name VARCHAR(100) NOT NULL,
        setting_value TEXT,
        FOREIGN KEY (id_admin) REFERENCES Admin(id) ON DELETE CASCADE,
        UNIQUE (id_admin, setting_name) -- Ensure unique setting per admin
      );
    `
    );
    console.log("All tables created or confirmed exist.");
  } catch (err) {
    console.error("Error creating tables:", err);
    throw err;
  }
}

// Function to add default AdminSettings for a new admin
// MODIFIED: Now accepts 'db' parameter
async function addDefaultAdminSettings(db, adminId, adminEmail) {
  try {
    console.log(
      `Adding default settings for new admin ${adminEmail} (ID: ${adminId}).`
    );
    // Default: auto_backup_enabled = FALSE, auto_backup_email = NULL
    const settings = [
      { name: "auto_backup_enabled", value: "false" }, // Stored as string 'true'/'false'
      { name: "auto_backup_email", value: "" }, // Stored as string, empty means null/not set
      { name: "last_auto_backup_timestamp", value: "" }, // To track last auto backup time
    ];

    for (const setting of settings) {
      await db.query(
        // Use the passed 'db' object here
        `INSERT INTO AdminSettings (id_admin, setting_name, setting_value) VALUES (?, ?, ?)`,
        [adminId, setting.name, setting.value]
      );
    }
    console.log(`Default settings added for admin ${adminId}.`);
  } catch (error) {
    console.error(`Error adding default settings for admin ${adminId}:`, error);
    // It's crucial not to block admin creation if settings fail, but log the error
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
      timezone: "local",
      init: async (connection) => {
        try {
          await connection.query("SET time_zone = '+07:00'");
          console.log("Session timezone set to +07:00 for new connection.");
        } catch (err) {
          console.error(
            "Failed to set session timezone for connection pool:",
            err
          );
        }
      },
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
            DROP TABLE IF EXISTS AdminSettings; -- Drop AdminSettings first
            DROP TABLE IF EXISTS Admin;
            DROP TABLE IF EXISTS Kendaraan;
            DROP TABLE IF EXISTS LogMessages;
            DROP TABLE IF EXISTS LogPemulihan;
            DROP TABLE IF EXISTS PendingAdmins;
            DROP TABLE IF EXISTS PasswordResetTokens;
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
    io.on("connection", (socket) => {
      console.log("A client connected via WebSocket:", socket.id);

      // Emit initial data to the newly connected client
      emitDashboardUpdate("parkingLogs");
      emitDashboardUpdate("availableTickets");
      emitDashboardUpdate("totalAvailableTickets");
      emitDashboardUpdate("totalActiveVehicles");
      emitDashboardUpdate("revenueSummary");
      emitDashboardUpdate("logMessages");
      emitDashboardUpdate("weeklyParkingTrend");

      socket.on("disconnect", () => {
        console.log("Client disconnected from WebSocket:", socket.id);
      });
    });

    // === API ENDPOINTS ===

    app.post("/api/tiket", authenticateToken, async (req, res) => {
      const { nomor_tiket } = req.body;
      const { id: adminId, email: adminEmail } = req.admin;

      if (!nomor_tiket) {
        return res.status(400).json({ error: "nomor_tiket is required" });
      }

      try {
        const sql = `INSERT INTO Tiket (nomor_tiket, tersedia) VALUES (?, TRUE)`;
        const [result] = await dbPool.query(sql, [nomor_tiket]);

        await createLogMessage(
          `email_admin telah menambah tiket nomor ${nomor_tiket}`,
          adminId,
          adminEmail
        );
        emitDashboardUpdate("availableTickets");
        emitDashboardUpdate("totalAvailableTickets");

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
        const [ticketData] = await dbPool.query(
          `SELECT nomor_tiket FROM Tiket WHERE id = ?`,
          [id]
        );
        if (ticketData.length === 0) {
          return res.status(404).json({ error: "Tiket tidak ditemukan" });
        }
        const nomor_tiket = ticketData[0].nomor_tiket;

        const sql = `UPDATE Tiket SET tersedia = ? WHERE id = ?`;
        const [result] = await dbPool.query(sql, [tersedia, id]);
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Tiket tidak ditemukan" });
        }

        await createLogMessage(
          `email_admin telah ${
            tersedia ? "mengaktifkan" : "menonaktifkan"
          } tiket nomor ${nomor_tiket}`,
          adminId,
          adminEmail
        );
        emitDashboardUpdate("availableTickets");
        emitDashboardUpdate("totalAvailableTickets");

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

    // A new backend endpoint to get single parking log details by ticket number
    app.get(
      "/api/parkirKeluarCheck/:nomor_tiket",
      authenticateToken,
      async (req, res) => {
        const { nomor_tiket } = req.params;
        try {
          const [results] = await dbPool.query(
            `
      SELECT
          lp.id,
          k.plat_nomor,
          t.nomor_tiket,
          CONCAT('${VITE_DOMAIN_SERVER}/backend/uploads/', lp.foto_masuk) AS foto_masuk,
          lp.waktu_masuk,
          lp.waktu_keluar
      FROM Log_Parkir lp
      JOIN Kendaraan k ON lp.id_kendaraan = k.id
      JOIN Tiket t ON lp.id_tiket = t.id
      WHERE t.nomor_tiket = ? AND lp.waktu_keluar IS NULL
      LIMIT 1
      `,
            [nomor_tiket]
          );

          if (results.length === 0) {
            return res
              .status(404)
              .json({
                error: "Nomor tiket tidak ditemukan atau sudah keluar.",
              });
          }

          res.json(results[0]);
        } catch (err) {
          console.error("Error fetching parking log by ticket:", err);
          return res
            .status(500)
            .json({ error: "Failed to fetch parking log: " + err.message });
        }
      }
    );

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

        const { plat_nomor, nomor_tiket, foto_base64 } = req.body;
        const { id: adminId, email: adminEmail } = req.admin;

        if (!plat_nomor || !nomor_tiket) {
          return res.status(400).json({
            error: "Missing required fields: plat_nomor, nomor_tiket",
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
              `INSERT INTO Log_Parkir (id_kendaraan, id_tiket, waktu_masuk, foto_masuk) VALUES (?, ?, NOW(), ?)`,
              [id_kendaraan, id_tiket, foto_filename]
            );

            await connection.commit();
            console.log(
              "Parking entry recorded successfully and ticket updated."
            );

            await createLogMessage(
              `email_admin telah memakai No. Tiket ${nomor_tiket}`,
              adminId,
              adminEmail
            );
            emitDashboardUpdate("parkingLogs");
            emitDashboardUpdate("availableTickets");
            emitDashboardUpdate("totalAvailableTickets");
            emitDashboardUpdate("totalActiveVehicles");
            emitDashboardUpdate("weeklyParkingTrend");

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

        await createLogMessage(
          `email_admin telah mengembalikan No. Tiket ${nomor_tiket}`,
          adminId,
          adminEmail
        );
        emitDashboardUpdate("parkingLogs");
        emitDashboardUpdate("availableTickets");
        emitDashboardUpdate("totalAvailableTickets");
        emitDashboardUpdate("totalActiveVehicles");
        emitDashboardUpdate("weeklyParkingTrend");

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

    // --- ENDPOINT UNTUK MEMULAI PENDAFTARAN ADMIN (MENGIRIM KODE VERIFIKASI) ---
    app.post("/api/admin/register", async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email dan password harus diisi" });
      }

      const VERIFICATION_EXPIRATION_MS = 5 * 60 * 1000; // 5 menit

      try {
        // Cek apakah email sudah terdaftar di tabel Admin (sudah diverifikasi)
        const [existingAdmin] = await dbPool.query(
          `SELECT id FROM Admin WHERE email = ?`,
          [email]
        );
        if (existingAdmin.length > 0) {
          return res.status(400).json({
            error: "Email ini sudah terdaftar sebagai admin yang aktif.",
          });
        }

        // Cek apakah email sudah ada di tabel PendingAdmins (sedang menunggu verifikasi)
        const [existingPendingAdminRows] = await dbPool.query(
          `SELECT * FROM PendingAdmins WHERE email = ?`,
          [email]
        );
        const existingPendingAdmin = existingPendingAdminRows[0];

        if (existingPendingAdmin) {
          const createdAtTimestamp = new Date(
            existingPendingAdmin.created_at
          ).getTime();
          // Jika ada entri pending dan belum kedaluwarsa, kembalikan pesan bahwa sudah ada
          if (Date.now() - createdAtTimestamp < VERIFICATION_EXPIRATION_MS) {
            return res.status(400).json({
              message:
                "Email ini sudah memiliki permintaan verifikasi yang tertunda. Silakan cek email Anda atau coba lagi nanti.",
              email: email,
              redirectUrl: `${VITE_DOMAIN_SERVER}/verifikasi-admin?email=${encodeURIComponent(
                email
              )}`,
            });
          } else {
            // Jika sudah kedaluwarsa, hapus entri lama
            await dbPool.query(`DELETE FROM PendingAdmins WHERE email = ?`, [
              email,
            ]);
            console.log(`Expired pending admin entry for ${email} deleted.`);
            // Lanjutkan untuk membuat entri baru di bawah
          }
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Generate a 6-digit numeric code
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();

        // --- SIMPAN KE TABEL PENDINGADMINS ---
        const [insertPendingResult] = await dbPool.query(
          `INSERT INTO PendingAdmins (email, verification_code, hashed_password, created_at) VALUES (?, ?, ?, NOW())`,
          [email, verificationCode, hashedPassword]
        );
        console.log(
          `Pendaftaran pending untuk ${email} disimpan di DB dengan ID: ${insertPendingResult.insertId}`
        );

        // Buat link verifikasi menggunakan VITE_DOMAIN_SERVER
        // Link ini sekarang membawa email dan kode verifikasi
        const verificationLink = `${VITE_DOMAIN_SERVER}/verifikasi-admin?email=${encodeURIComponent(
          email
        )}&code=${verificationCode}`;
        const expirationTimeMinutes = 5; // Kode berlaku 5 menit

        // --- HTML Email Template ---
        const htmlEmailContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Verifikasi Akun Anda</title>
    <style type="text/css">
        /* Basic Resets & Compatibility */
        body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        p { display: block; margin: 0; padding: 0; }
        a { text-decoration: none; }
        /* Outlook-specific styles */
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }

        /* General Styles for Desktop */
        .email-body { background-color: #f4f4f4; padding: 20px 0 30px 0; }
        .main-table { border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
        .content-area { padding: 40px; text-align: center; }
        .logo { display: block; margin: 0 auto 20px auto; }
        .heading { font-family: Arial, sans-serif; font-size: 28px; color: #333333; margin: 0 0 20px 0; }
        .paragraph { font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #555555; margin: 0 0 25px 0; }
        .code-box-table { margin: 30px auto; width: 100%; max-width: 300px; } /* Added max-width here */
        .code-box-cell { background-color: #e8f5e9; padding: 20px; border-radius: 8px; }
        .code-text { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: bold; color: #2e7d32; letter-spacing: 5px; /* Reduced letter spacing for better fit */ margin: 0; word-break: break-all; /* Helps if placeholder text is long */ }
        .button-table { margin: 0 auto; }
        .button-cell { border-radius: 5px; }
        .button-link { font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #3498db; display: inline-block; background-color: #3498db; }
        .footer-area { padding: 30px 40px; background-color: #f0f0f0; text-align: center; }
        .footer-text { font-family: Arial, sans-serif; font-size: 12px; color: #777777; margin: 0; }

        /* Media Queries for Responsive Design (Mobile) */
        @media screen and (max-width: 600px) {
            .email-body { padding: 10px 0 20px 0 !important; }
            .main-table { width: 100% !important; border-radius: 0 !important; } /* Full width on mobile */
            .content-area { padding: 20px !important; }
            .heading { font-size: 24px !important; }
            .paragraph { font-size: 15px !important; line-height: 22px !important; }
            .code-box-table { width: 90% !important; max-width: 90% !important; }
            .code-text { font-size: 28px !important; letter-spacing: 3px !important; } /* Adjust for smaller screens */
            .button-table { width: 100% !important; }
            .button-cell { width: 100% !important; text-align: center !important; }
            .button-link { width: calc(100% - 50px) !important; padding: 12px 0 !important; }
            .footer-area { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-body">
        <tr>
            <td align="center">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" class="main-table">
                    <tr>
                        <td class="content-area">
                            <img src="${mail_image_logo}" alt="Logo SIPATUH HMTB" width="230" height="auto" class="logo"/>
                            <h1 class="heading">Verifikasi Akun Anda</h1>
                            <p class="paragraph">
                                Halo ${email.split("@")[0]},
                            </p>
                            <p class="paragraph">
                                Terima kasih telah mendaftar di <b>SIPATUH</b>. Untuk menyelesaikan pendaftaran Anda, mohon masukkan kode verifikasi 6 digit di bawah ini ke website kami:
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" class="code-box-table">
                                <tr>
                                    <td align="center" class="code-box-cell">
                                        <p class="code-text">
                                            ${verificationCode}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <p class="paragraph">
                                Kode ini berlaku selama <b>${expirationTimeMinutes} menit</b>. Jika Anda tidak meminta kode ini, mohon abaikan email ini.
                            </p>

                            <table border="0" cellpadding="0" cellspacing="0" class="button-table">
                                <tr>
                                    <td align="center" class="button-cell">
                                        <a href="${verificationLink}" target="_blank" class="button-link">
                                            Buka Halaman Verifikasi
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p class="paragraph" style="margin-top: 30px; font-size: 14px; line-height: 20px; color: #999999;">
                                Jika Anda mengalami masalah, silakan hubungi tim dukungan kami.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td class="footer-area">
                            <p class="footer-text">
                                &copy; ${new Date().getFullYear()} SIPATUH. Semua hak dilindungi.
                            </p>
                        </td>
                    </tr>
                </table>
                </td>
        </tr>
    </table>
</body>
</html>
        `;

        // Kirim email verifikasi menggunakan Nodemailer
        const mailOptions = {
          from: `"${EMAIL_SENDER_NAME}" <${GMAIL_USER}>`,
          to: email,
          subject: "Verifikasi Akun Admin SIPATUH HMTB Anda",
          html: htmlEmailContent,
        };

        await transporter.sendMail(mailOptions);

        await createLogMessage(
          `Permintaan pendaftaran admin baru untuk email: ${email}. Email verifikasi dikirim.`,
          null, // adminId null karena belum terdaftar
          email
        );

        res.json({
          message:
            "Email verifikasi telah dikirim. Silakan cek kotak masuk Anda untuk menyelesaikan pendaftaran.",
          email: email, // Kirim email kembali agar frontend bisa menggunakannya
          redirectUrl: `${VITE_DOMAIN_SERVER}/verifikasi-admin?email=${encodeURIComponent(
            email
          )}`, // URL redirect
        });
      } catch (err) {
        console.error("Error during admin registration initiation:", err);
        // Tangani error spesifik dari Nodemailer atau SMTP
        let errorMessage =
          "Gagal memulai pendaftaran admin. Terjadi masalah saat mengirim email verifikasi.";
        if (err.responseCode && err.response) {
          errorMessage += ` (SMTP Error: ${err.responseCode} - ${err.response})`;
        } else if (err.message) {
          errorMessage = err.message;
        }
        res.status(500).json({ error: errorMessage });
      }
    });

    // --- ENDPOINT UNTUK VERIFIKASI AKUN ADMIN VIA LINK (GET) ---
    // URL format: /api/admin/verify?email=[email_admin]&code=[6digitkode]
    app.get("/api/admin/verify", async (req, res) => {
      const { email, code } = req.query;

      if (!email || !code) {
        return res.status(400).send(`
          <html>
          <head>
              <title>Verifikasi Gagal</title>
              <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; color: #333; }
                  .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: inline-block; }
                  h1 { color: #dc3545; }
              </style>
          </head>
          <body>
              <div class="container">
                  <h1>Verifikasi Gagal!</h1>
                  <p>Email atau kode verifikasi tidak ditemukan dalam tautan.</p>
                  <p>Silakan coba proses pendaftaran lagi atau hubungi administrator.</p>
              </div>
          </body>
          </html>
        `);
      }

      const VERIFICATION_EXPIRATION_MS = 5 * 60 * 1000; // 5 menit

      let pendingAdminData;
      try {
        const [rows] = await dbPool.query(
          `SELECT * FROM PendingAdmins WHERE email = ?`,
          [email]
        );
        pendingAdminData = rows[0]; // Ambil baris pertama jika ada
      } catch (dbErr) {
        console.error("Error fetching pending admin from DB:", dbErr);
        return res.status(500).send(`
          <html>
          <head>
              <title>Verifikasi Gagal</title>
              <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; color: #333; }
                  .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: inline-block; }
                  h1 { color: #dc3545; }
              </style>
          </head>
          <body>
              <div class="container">
                  <h1>Verifikasi Gagal!</h1>
                  <p>Terjadi kesalahan saat mencari data verifikasi Anda. Silakan coba lagi.</p>
                  <p>Detail Error: ${dbErr.message}</p>
              </div>
          </body>
          </html>
        `);
      }

      // Konversi created_at dari objek Date ke timestamp milidetik untuk perbandingan
      const createdAtTimestamp = pendingAdminData
        ? new Date(pendingAdminData.created_at).getTime()
        : 0;

      if (
        !pendingAdminData ||
        pendingAdminData.verification_code !== code ||
        Date.now() - createdAtTimestamp > VERIFICATION_EXPIRATION_MS
      ) {
        let errorMessage =
          "Kode verifikasi tidak valid atau telah kedaluwarsa.";
        if (pendingAdminData && pendingAdminData.verification_code !== code) {
          errorMessage = "Kode verifikasi tidak cocok.";
        } else if (
          pendingAdminData &&
          Date.now() - createdAtTimestamp > VERIFICATION_EXPIRATION_MS
        ) {
          errorMessage =
            "Kode verifikasi telah kedaluwarsa (lebih dari 5 menit). Silakan minta kirim ulang.";
        } else if (!pendingAdminData) {
          errorMessage =
            "Tidak ada permintaan verifikasi yang tertunda untuk email ini.";
        }

        return res.status(400).send(`
          <html>
          <head>
              <title>Verifikasi Gagal</title>
              <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; color: #333; }
                  .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: inline-block; }
                  h1 { color: #dc3545; }
              </style>
          </head>
          <body>
              <div class="container">
                  <h1>Verifikasi Gagal!</h1>
                  <p>${errorMessage}</p>
                  <p>Silakan coba proses pendaftaran lagi atau hubungi administrator.</p>
              </div>
          </body>
          </html>
        `);
      }

      try {
        const { hashed_password } = pendingAdminData;

        // Cek lagi apakah email sudah ada di tabel Admin, untuk mencegah duplikasi jika verifikasi link sudah dilakukan
        const [existingAdmin] = await dbPool.query(
          `SELECT id FROM Admin WHERE email = ?`,
          [email]
        );
        if (existingAdmin.length > 0) {
          // Hapus dari pending jika sudah ada di Admin (mungkin verifikasi ganda)
          await dbPool.query(`DELETE FROM PendingAdmins WHERE email = ?`, [
            email,
          ]);
          return res.status(400).send(`
                <html>
                <head>
                    <title>Verifikasi Gagal</title>
                    <style>
                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; color: #333; }
                        .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: inline-block; }
                        h1 { color: #dc3545; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Verifikasi Gagal!</h1>
                        <p>Email ini sudah terdaftar sebagai admin yang aktif. Verifikasi tidak diperlukan.</p>
                        <p>Anda sekarang dapat login.</p>
                    </div>
                </body>
                </html>
            `);
        }

        const sql = `INSERT INTO Admin (email, password) VALUES (?, ?)`;
        const [result] = await dbPool.query(sql, [email, hashed_password]);

        // **NEW: Add default settings for the newly created admin**
        // MODIFIED: Pass dbPool as the first argument
        await addDefaultAdminSettings(dbPool, result.insertId, email);

        // Hapus data dari tabel PendingAdmins setelah berhasil disimpan ke Admin
        await dbPool.query(`DELETE FROM PendingAdmins WHERE email = ?`, [
          email,
        ]);
        console.log(
          `Akun admin untuk ${email} berhasil diverifikasi dan dibuat.`
        );

        await createLogMessage(
          `Akun admin baru dengan email: ${email} berhasil diverifikasi.`,
          result.insertId,
          email
        );

        res.status(200).send(`
          <html>
          <head>
              <title>Verifikasi Berhasil</title>
              <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; color: #333; }
                  .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: inline-block; }
                  h1 { color: #28a745; }
              </style>
          </head>
          <body>
              <div class="container">
                  <h1>Verifikasi Berhasil!</h1>
                  <p>Akun admin untuk <strong>${email}</strong> telah berhasil diverifikasi dan dibuat.</p>
                  <p>Anda sekarang dapat login.</p>
              </div>
          </body>
          </html>
        `);
      } catch (err) {
        console.error("Error during admin verification:", err);
        let errorMessage =
          "Terjadi kesalahan saat memproses verifikasi akun Anda.";
        if (err.code === "ER_DUP_ENTRY") {
          errorMessage =
            "Email ini sudah terdaftar sebagai admin yang aktif. Verifikasi tidak diperlukan.";
          // Coba hapus dari pending jika memang sudah ada di Admin
          await dbPool.query(`DELETE FROM PendingAdmins WHERE email = ?`, [
            email,
          ]);
        }
        res.status(500).send(`
          <html>
          <head>
              <title>Verifikasi Gagal</title>
              <style>
                  body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f4f4f4; color: #333; }
                  .container { background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: inline-block; }
                  h1 { color: #dc3545; }
              </style>
          </head>
          <body>
              <div class="container">
                  <h1>Verifikasi Gagal!</h1>
                  <p>${errorMessage}</p>
                  <p>Silakan coba proses pendaftaran lagi atau hubungi administrator.</p>
              </div>
          </body>
          </html>
        `);
      }
    });

    // --- ENDPOINT UNTUK VERIFIKASI AKUN ADMIN VIA FORM (POST) ---
    app.post("/api/admin/verify_code", async (req, res) => {
      const { email, code } = req.body;

      if (!email || !code) {
        return res
          .status(400)
          .json({ error: "Email dan kode verifikasi wajib diisi." });
      }

      const VERIFICATION_EXPIRATION_MS = 5 * 60 * 1000; // 5 menit

      let pendingAdminData;
      try {
        const [rows] = await dbPool.query(
          `SELECT * FROM PendingAdmins WHERE email = ?`,
          [email]
        );
        pendingAdminData = rows[0];
      } catch (dbErr) {
        console.error("Error fetching pending admin from DB:", dbErr);
        return res.status(500).json({
          error: "Terjadi kesalahan saat mencari data verifikasi Anda.",
        });
      }

      const createdAtTimestamp = pendingAdminData
        ? new Date(pendingAdminData.created_at).getTime()
        : 0;

      if (
        !pendingAdminData ||
        pendingAdminData.verification_code !== code ||
        Date.now() - createdAtTimestamp > VERIFICATION_EXPIRATION_MS
      ) {
        let errorMessage =
          "Kode verifikasi tidak valid atau telah kedaluwarsa.";
        if (pendingAdminData && pendingAdminData.verification_code !== code) {
          errorMessage = "Kode verifikasi tidak cocok.";
        } else if (
          pendingAdminData &&
          Date.now() - createdAtTimestamp > VERIFICATION_EXPIRATION_MS
        ) {
          errorMessage =
            "Kode verifikasi telah kedaluwarsa (lebih dari 5 menit). Silakan minta kirim ulang.";
        } else if (!pendingAdminData) {
          errorMessage =
            "Tidak ada permintaan verifikasi yang tertunda untuk email ini. Silakan daftar ulang.";
        }
        return res.status(400).json({ error: errorMessage });
      }

      try {
        const { hashed_password } = pendingAdminData;

        // Cek lagi apakah email sudah ada di tabel Admin, untuk mencegah duplikasi jika verifikasi link sudah dilakukan
        const [existingAdmin] = await dbPool.query(
          `SELECT id FROM Admin WHERE email = ?`,
          [email]
        );
        if (existingAdmin.length > 0) {
          await dbPool.query(`DELETE FROM PendingAdmins WHERE email = ?`, [
            email,
          ]);
          return res.status(400).json({
            error:
              "Email ini sudah terdaftar sebagai admin yang aktif. Verifikasi tidak diperlukan.",
          });
        }

        const sql = `INSERT INTO Admin (email, password) VALUES (?, ?)`;
        const [result] = await dbPool.query(sql, [email, hashed_password]);

        // **NEW: Add default settings for the newly created admin**
        // MODIFIED: Pass dbPool as the first argument
        await addDefaultAdminSettings(dbPool, result.insertId, email);

        // Hapus data dari tabel PendingAdmins setelah berhasil disimpan ke Admin
        await dbPool.query(`DELETE FROM PendingAdmins WHERE email = ?`, [
          email,
        ]);
        console.log(
          `Akun admin untuk ${email} berhasil diverifikasi dan dibuat melalui form.`
        );

        await createLogMessage(
          `Akun admin baru dengan email: ${email} berhasil diverifikasi.`,
          result.insertId,
          email
        );

        res.status(200).json({
          message: "Verifikasi berhasil! Akun admin Anda telah dibuat.",
        });
      } catch (err) {
        console.error("Error during admin verification via code:", err);
        let errorMessage =
          "Terjadi kesalahan saat memproses verifikasi akun Anda.";
        if (err.code === "ER_DUP_ENTRY") {
          errorMessage =
            "Email ini sudah terdaftar sebagai admin yang aktif. Verifikasi tidak diperlukan.";
          await dbPool.query(`DELETE FROM PendingAdmins WHERE email = ?`, [
            email,
          ]);
        }
        res.status(500).json({ error: errorMessage });
      }
    });

    // NEW ENDPOINT: Get pending admin status for countdown
    app.get("/api/admin/pending-status", async (req, res) => {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({ error: "Email is required." });
      }

      try {
        const [rows] = await dbPool.query(
          `SELECT created_at FROM PendingAdmins WHERE email = ?`,
          [email]
        );

        if (rows.length === 0) {
          return res
            .status(404)
            .json({ error: "No pending verification found for this email." });
        }

        const pendingEntry = rows[0];
        const VERIFICATION_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

        // Convert created_at from DB (which is a Date object) to a timestamp
        const createdAtTimestamp = new Date(pendingEntry.created_at).getTime();

        const remainingTimeMs =
          VERIFICATION_EXPIRATION_MS - (Date.now() - createdAtTimestamp);
        const remainingSeconds = Math.max(0, Math.ceil(remainingTimeMs / 1000)); // Ensure non-negative and round up

        res.json({
          email: email,
          createdAt: createdAtTimestamp,
          remainingSeconds: remainingSeconds,
          isExpired: remainingSeconds <= 0,
        });
      } catch (error) {
        console.error("Error fetching pending admin status:", error);
        res.status(500).json({ error: "Failed to fetch pending status." });
      }
    });

    // NEW ENDPOINT: Change Admin Password (requires current password)
    app.put(
      "/api/admin/change-password",
      authenticateToken,
      async (req, res) => {
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        const { id: adminId, email: adminEmail } = req.admin; // Authenticated admin's ID and email

        // Log the adminId being used for debugging
        console.log(
          `Attempting to change password for adminId: ${adminId}, email: ${adminEmail}`
        );

        if (!currentPassword || !newPassword || !confirmNewPassword) {
          return res
            .status(400)
            .json({ error: "Semua kolom password harus diisi." });
        }
        if (newPassword !== confirmNewPassword) {
          return res.status(400).json({
            error: "Password baru dan konfirmasi password tidak cocok.",
          });
        }
        if (newPassword.length < 6) {
          return res
            .status(400)
            .json({ error: "Password baru minimal 6 karakter." });
        }

        try {
          const [adminRows] = await dbPool.query(
            `SELECT password FROM Admin WHERE id = ?`,
            [adminId]
          );

          if (adminRows.length === 0) {
            // Log a more specific error if admin is not found despite authentication
            console.error(
              `Admin with ID ${adminId} not found in DB during password change. Token might be stale.`
            );
            return res.status(404).json({
              error:
                "Admin tidak ditemukan. Sesi Anda mungkin sudah tidak valid. Silakan login ulang.",
            });
          }

          const admin = adminRows[0];
          const match = await bcrypt.compare(currentPassword, admin.password);

          if (!match) {
            return res.status(401).json({ error: "Password saat ini salah." });
          }

          const hashedNewPassword = await bcrypt.hash(newPassword, 10);
          await dbPool.query(`UPDATE Admin SET password = ? WHERE id = ?`, [
            hashedNewPassword,
            adminId,
          ]);

          await createLogMessage(
            `email_admin telah mengubah password akunnya.`,
            adminId,
            adminEmail
          );

          res.json({ message: "Password berhasil diubah." });
        } catch (err) {
          console.error("Error changing admin password:", err);
          res.status(500).json({ error: "Gagal mengubah password." });
        }
      }
    );

    // NEW ENDPOINT: Request Password Reset (sends email with token)
    app.post("/api/admin/request-password-reset", async (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email wajib diisi." });
      }

      try {
        const [adminRows] = await dbPool.query(
          `SELECT id FROM Admin WHERE email = ?`,
          [email]
        );

        if (adminRows.length === 0) {
          // Send a generic success message even if email not found to prevent enumeration attacks
          console.log(
            `Password reset requested for non-existent email: ${email}`
          );
          return res.json({
            message:
              "Jika email terdaftar, tautan reset password akan dikirimkan.",
          });
        }

        const adminId = adminRows[0].id;
        const resetToken = crypto.randomBytes(32).toString("hex"); // Generate a random token
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // Token valid for 1 hour

        // Invalidate any old tokens for this admin
        await dbPool.query(
          `DELETE FROM PasswordResetTokens WHERE admin_id = ?`,
          [adminId]
        );

        // Store new token in DB
        await dbPool.query(
          `INSERT INTO PasswordResetTokens (admin_id, token, expires_at) VALUES (?, ?, ?)`,
          [adminId, resetToken, expiresAt]
        );

        const resetLink = `${VITE_DOMAIN_SERVER}/reset-password?token=${resetToken}`; // Frontend route for reset

        // --- HTML Email Template for Password Reset ---
        const resetEmailContent = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Reset Password Anda</title>
    <style type="text/css">
        /* Basic Resets & Compatibility */
        body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
        p { display: block; margin: 0; padding: 0; }
        a { text-decoration: none; }
        /* Outlook-specific styles */
        .ExternalClass { width: 100%; }
        .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }

        /* General Styles for Desktop */
        .email-body { background-color: #f4f4f4; padding: 20px 0 30px 0; }
        .main-table { border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
        .content-area { padding: 40px; text-align: center; }
        .logo { display: block; margin: 0 auto 20px auto; }
        .heading { font-family: Arial, sans-serif; font-size: 28px; color: #333333; margin: 0 0 20px 0; }
        .paragraph { font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #555555; margin: 0 0 25px 0; }
        .button-table { margin: 30px auto; }
        .button-cell { border-radius: 5px; }
        .button-link { font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #3498db; display: inline-block; background-color: #3498db; }
        .footer-area { padding: 30px 40px; background-color: #f0f0f0; text-align: center; }
        .footer-text { font-family: Arial, sans-serif; font-size: 12px; color: #777777; margin: 0; }

        /* Media Queries for Responsive Design (Mobile) */
        @media screen and (max-width: 600px) {
            .email-body { padding: 10px 0 20px 0 !important; }
            .main-table { width: 100% !important; border-radius: 0 !important; } /* Full width on mobile */
            .content-area { padding: 20px !important; }
            .heading { font-size: 24px !important; }
            .paragraph { font-size: 15px !important; line-height: 22px !important; }
            .button-table { width: 100% !important; }
            .button-cell { width: 100% !important; text-align: center !important; }
            .button-link { width: calc(100% - 50px) !important; padding: 12px 0 !important; }
            .footer-area { padding: 20px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-body">
        <tr>
            <td align="center">
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" class="main-table">
                    <tr>
                        <td class="content-area">
                            <img src="${mail_image_logo}" alt="Logo SIPATUH HMTB" width="230" height="auto" class="logo"/>
                            <h1 class="heading">Reset Password Akun Anda</h1>
                            <p class="paragraph">
                                Halo ${email.split("@")[0]},
                            </p>
                            <p class="paragraph">
                                Kami menerima permintaan untuk mereset password akun SIPATUH Anda.
                                Silakan klik tautan di bawah ini untuk mengatur password baru:
                            </p>
                            <table border="0" cellpadding="0" cellspacing="0" class="button-table">
                                <tr>
                                    <td align="center" class="button-cell">
                                        <a href="${resetLink}" target="_blank" class="button-link">
                                            Reset Password Saya
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p class="paragraph">
                                Tautan ini akan kedaluwarsa dalam 1 jam.
                                Jika Anda tidak meminta reset password ini, Anda bisa mengabaikan email ini.
                            </p>
                            <p class="paragraph" style="margin-top: 30px; font-size: 14px; line-height: 20px; color: #999999;">
                                Jika Anda mengalami masalah, silakan hubungi tim dukungan kami.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td class="footer-area">
                            <p class="footer-text">
                                &copy; ${new Date().getFullYear()} SIPATUH. Semua hak dilindungi.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        const mailOptions = {
          from: `"${EMAIL_SENDER_NAME}" <${GMAIL_USER}>`,
          to: email,
          subject: "Permintaan Reset Password Akun SIPATUH HMTB Anda",
          html: resetEmailContent,
        };

        await transporter.sendMail(mailOptions);

        await createLogMessage(
          `Permintaan reset password untuk email: ${email}. Email reset dikirim.`,
          adminId, // adminId bisa null jika dari halaman login
          email
        );

        res.json({
          message:
            "Jika email terdaftar, tautan reset password akan dikirimkan.",
        });
      } catch (err) {
        console.error("Error during password reset request:", err);
        let errorMessage =
          "Gagal memproses permintaan reset password. Terjadi masalah saat mengirim email.";
        if (err.responseCode && err.response) {
          errorMessage += ` (SMTP Error: ${err.responseCode} - ${err.response})`;
        } else if (err.message) {
          errorMessage = err.message;
        }
        res.status(500).json({ error: errorMessage });
      }
    });

    // NEW ENDPOINT: Perform Password Reset (using token)
    app.post("/api/admin/reset-password", async (req, res) => {
      const { token, newPassword, confirmNewPassword } = req.body;

      if (!token || !newPassword || !confirmNewPassword) {
        return res.status(400).json({
          error: "Token, password baru, dan konfirmasi password wajib diisi.",
        });
      }
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          error: "Password baru dan konfirmasi password tidak cocok.",
        });
      }
      if (newPassword.length < 6) {
        return res
          .status(400)
          .json({ error: "Password baru minimal 6 karakter." });
      }

      const connection = await dbPool.getConnection();
      try {
        await connection.beginTransaction();

        const [tokenRows] = await connection.query(
          `SELECT admin_id, expires_at FROM PasswordResetTokens WHERE token = ?`,
          [token]
        );

        if (tokenRows.length === 0) {
          await connection.rollback();
          return res.status(400).json({
            error: "Token reset password tidak valid atau sudah digunakan.",
          });
        }

        const resetTokenData = tokenRows[0];
        if (new Date() > new Date(resetTokenData.expires_at)) {
          await connection.rollback();
          return res
            .status(400)
            .json({ error: "Token reset password telah kedaluwarsa." });
        }

        const adminId = resetTokenData.admin_id;
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await connection.query(`UPDATE Admin SET password = ? WHERE id = ?`, [
          hashedNewPassword,
          adminId,
        ]);

        // Invalidate/delete the used token
        await connection.query(
          `DELETE FROM PasswordResetTokens WHERE token = ?`,
          [token]
        );

        await connection.commit();

        // Fetch admin email for logging
        const [adminEmailRow] = await dbPool.query(
          `SELECT email FROM Admin WHERE id = ?`,
          [adminId]
        );
        const adminEmail =
          adminEmailRow.length > 0 ? adminEmailRow[0].email : "Unknown Admin";

        await createLogMessage(
          `Password admin untuk email: ${adminEmail} telah berhasil direset.`,
          adminId,
          adminEmail
        );

        res.json({
          message: "Password berhasil direset. Anda dapat login sekarang.",
        });
      } catch (err) {
        await connection.rollback();
        console.error("Error during password reset:", err);
        res.status(500).json({ error: "Gagal mereset password." });
      } finally {
        connection.release();
      }
    });

    // NEW ENDPOINT: Delete current admin account
    app.delete(
      "/api/admin/delete-my-account",
      authenticateToken,
      async (req, res) => {
        const { id: adminId, email: adminEmail } = req.admin; // Authenticated admin's ID and email

        try {
          // Delete the admin account. ON DELETE CASCADE will handle related records.
          const [result] = await dbPool.query(
            `DELETE FROM Admin WHERE id = ?`,
            [adminId]
          );

          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ error: "Akun admin tidak ditemukan." }); // Should not happen if authenticated
          }

          // Clear the token cookie as the account is deleted
          res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 0,
            sameSite: "Lax",
          });

          await createLogMessage(
            `Akun admin dengan email: ${adminEmail} telah dihapus.`,
            adminId,
            adminEmail
          );

          res.json({ message: "Akun admin berhasil dihapus." });
        } catch (err) {
          console.error("Error deleting admin account:", err);
          res.status(500).json({ error: "Gagal menghapus akun admin." });
        }
      }
    );

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

        await createLogMessage(
          `email_admin telah berhasil login`,
          admin.id,
          admin.email
        );

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

        await createLogMessage(
          `email_admin telah menambah pemasukan sebesar Rp ${nominal_pemasukan.toLocaleString(
            "id-ID"
          )}`,
          adminId,
          adminEmail
        );
        emitDashboardUpdate("revenueSummary");

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
          const [incomeData] = await dbPool.query(
            `SELECT nominal_pemasukan FROM PemasukanMingguan WHERE id = ?`,
            [id]
          );

          const sql = `DELETE FROM PemasukanMingguan WHERE id = ?`;
          const [result] = await dbPool.query(sql, [id]);

          if (result.affectedRows === 0) {
            return res
              .status(404)
              .json({ error: "Data pemasukan tidak ditemukan." });
          }

          if (incomeData.length > 0) {
            await createLogMessage(
              `email_admin telah menghapus pemasukan sebesar Rp ${incomeData[0].nominal_pemasukan.toLocaleString(
                "id-ID"
              )}`,
              adminId,
              adminEmail
            );
          } else {
            await createLogMessage(
              `email_admin telah menghapus pemasukan (ID: ${id})`,
              adminId,
              adminEmail
            );
          }
          emitDashboardUpdate("revenueSummary");

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

          await createLogMessage(
            `email_admin telah mengubah pemasukan (ID: ${id}) menjadi Rp ${nominal_pemasukan.toLocaleString(
              "id-ID"
            )}`,
            adminId,
            adminEmail
          );
          emitDashboardUpdate("revenueSummary");

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

    const getMonthNameForApi = (monthNumber) => {
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
      } catch (err) {
        console.error("Error fetching log messages:", err);
        res
          .status(500)
          .json({ error: "Gagal mengambil log pesan: " + err.message });
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
        res
          .status(500)
          .json({ error: "Gagal menambahkan pesan log: " + err.message });
      }
    });

    app.delete("/api/logMessages/:id", authenticateToken, async (req, res) => {
      const { id } = req.params;
      const { id: adminId, email: adminEmail } = req.admin;

      try {
        const [result] = await dbPool.query(
          `DELETE FROM LogMessages WHERE id = ?`,
          [id]
        );
        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Pesan log tidak ditemukan" });
        }
        await createLogMessage(
          `email_admin telah menghapus pesan log (ID: ${id})`,
          adminId,
          adminEmail
        );

        res.json({ message: "Pesan log berhasil dihapus" });
      } catch (err) {
        console.error("Error deleting log message:", err);
        res
          .status(500)
          .json({ error: "Gagal menghapus pesan log: " + err.message });
      }
    });

    // --- BACKUP DATABASE ENDPOINT ---
    app.post("/api/backup-database", authenticateToken, async (req, res) => {
      const { id: adminId, email: adminEmail } = req.admin;
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, "-")
        .replace(/\./g, "_");
      const backupFileName = `${DB_NAME}_${timestamp}.sql`;
      const backupFilePath = path.join(backupsDir, backupFileName);

      const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > "${backupFilePath}"`;

      console.log(`Starting database backup to: ${backupFilePath}`);
      try {
        await new Promise((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              console.error(`Backup failed: ${error.message}`);
              return reject(
                new Error(`Backup database gagal: ${error.message}`)
              );
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

        await createLogMessage(
          `email_admin telah melakukan pencadangan database.`,
          adminId,
          adminEmail
        );

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
    app.post(
      "/api/restore-database",
      authenticateToken,
      uploadSql.single("sql_file"),
      async (req, res) => {
        const { id: adminId, email: adminEmail } = req.admin;

        if (!req.file) {
          return res
            .status(400)
            .json({ error: "Tidak ada file SQL yang diunggah." });
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
                if (fs.existsSync(uploadedFilePath))
                  fs.unlinkSync(uploadedFilePath); // Delete on failure
                return reject(
                  new Error(
                    `Pemulihan database gagal: ${error.message}. Pastikan file SQL valid dan tidak korup.`
                  )
                );
              }
              if (stderr) {
                console.warn(`Restore stderr: ${stderr}`);
              }
              console.log(`Restore stdout: ${stdout}`);
              console.log(
                `Database restore successful from: ${uploadedFileName}`
              );
              resolve();
            });
          });

          // Log the restore in the database
          const logSql = `INSERT INTO LogPemulihan (waktu_pemulihan, id_admin) VALUES (NOW(), ?)`;
          await dbPool.query(logSql, [adminId]);

          await createLogMessage(
            `email_admin telah melakukan pemulihan database.`,
            adminId,
            adminEmail
          );

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
      }
    );

    // --- NEW: Helper function to send backup via email ---
    const sendBackupEmail = async (
      backupFilePath,
      backupFileName,
      targetEmail
    ) => {
      try {
        const mailOptions = {
          from: `"${EMAIL_SENDER_NAME}" <${GMAIL_USER}>`,
          to: targetEmail,
          subject: `[SIPATUH] Pencadangan Database Otomatis - ${new Date().toLocaleDateString(
            "id-ID"
          )}`,
          html: `
            <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
            <html xmlns="http://www.w3.org/1999/xhtml">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <title>Pencadangan Database Otomatis</title>
                <style type="text/css">
                    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
                    p { display: block; margin: 0; padding: 0; }
                    a { text-decoration: none; }
                    .ExternalClass { width: 100%; }
                    .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div { line-height: 100%; }
                    .email-body { background-color: #f4f4f4; padding: 20px 0 30px 0; }
                    .main-table { border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.05); }
                    .content-area { padding: 40px; text-align: center; }
                    .logo { display: block; margin: 0 auto 20px auto; }
                    .heading { font-family: Arial, sans-serif; font-size: 28px; color: #333333; margin: 0 0 20px 0; }
                    .paragraph { font-family: Arial, sans-serif; font-size: 16px; line-height: 24px; color: #555555; margin: 0 0 25px 0; }
                    .button-table { margin: 30px auto; }
                    .button-cell { border-radius: 5px; }
                    .button-link { font-size: 16px; font-family: Arial, sans-serif; color: #ffffff; text-decoration: none; border-radius: 5px; padding: 12px 25px; border: 1px solid #28a745; display: inline-block; background-color: #28a745; }
                    .footer-area { padding: 30px 40px; background-color: #f0f0f0; text-align: center; }
                    .footer-text { font-family: Arial, sans-serif; font-size: 12px; color: #777777; margin: 0; }
                    @media screen and (max-width: 600px) {
                        .email-body { padding: 10px 0 20px 0 !important; }
                        .main-table { width: 100% !important; border-radius: 0 !important; }
                        .content-area { padding: 20px !important; }
                        .heading { font-size: 24px !important; }
                        .paragraph { font-size: 15px !important; line-height: 22px !important; }
                        .button-table { width: 100% !important; }
                        .button-cell { width: 100% !important; text-align: center !important; }
                        .button-link { width: calc(100% - 50px) !important; padding: 12px 0 !important; }
                        .footer-area { padding: 20px !important; }
                    }
                </style>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-body">
                    <tr>
                        <td align="center">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" class="main-table">
                                <tr>
                                    <td class="content-area">
                                        <img src="${mail_image_logo}" alt="Logo SIPATUH HMTB" width="230" height="auto" class="logo"/>
                                        <h1 class="heading">Pencadangan Database Otomatis</h1>
                                        <p class="paragraph">
                                            Halo Admin,
                                        </p>
                                        <p class="paragraph">
                                            Terlampir adalah file cadangan database otomatis Anda dari sistem SIPATUH.
                                            Anda juga bisa mengunduh file ini langsung melalui tautan di bawah.
                                        </p>
                                        <p class="paragraph">
                                            <strong>Nama File:</strong> ${backupFileName}<br/>
                                            <strong>Waktu Cadangan:</strong> ${new Date().toLocaleDateString(
                                              "id-ID"
                                            )} pukul ${new Date().toLocaleTimeString(
            "id-ID"
          )}
                                        </p>
                                        <table border="0" cellpadding="0" cellspacing="0" class="button-table">
                                            <tr>
                                                <td align="center" class="button-cell">
                                                    <a href="${VITE_DOMAIN_SERVER}/backups/${backupFileName}" target="_blank" class="button-link">
                                                        Unduh File Backup
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        <p class="paragraph">
                                            Harap simpan file ini di tempat yang aman.
                                        </p>
                                        <p class="paragraph" style="margin-top: 30px; font-size: 14px; line-height: 20px; color: #999999;">
                                            Jika Anda tidak mengharapkan email ini, mohon hubungi administrator.
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="footer-area">
                                        <p class="footer-text">
                                            &copy; ${new Date().getFullYear()} SIPATUH. Semua hak dilindungi.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
          `,
          attachments: [
            {
              filename: backupFileName,
              path: backupFilePath,
              contentType: "application/sql",
            },
          ],
        };
        await transporter.sendMail(mailOptions);
        console.log(
          `Backup email sent to ${targetEmail} with attachment ${backupFileName}`
        );
        return true;
      } catch (error) {
        console.error(`Error sending backup email to ${targetEmail}:`, error);
        return false;
      }
    };

    // --- NEW: Endpoint to get admin-specific settings (formerly SystemSettings) ---
    app.get("/api/admin-settings", authenticateToken, async (req, res) => {
      const { id: adminId } = req.admin;
      try {
        const [rows] = await dbPool.query(
          `SELECT setting_name, setting_value FROM AdminSettings WHERE id_admin = ?`,
          [adminId]
        );
        const settings = {};
        rows.forEach((row) => {
          settings[row.setting_name] = row.setting_value;
        });
        // Convert boolean-like strings to actual booleans
        if (settings.auto_backup_enabled !== undefined) {
          settings.auto_backup_enabled =
            settings.auto_backup_enabled === "true";
        }
        res.json(settings);
      } catch (err) {
        console.error("Error fetching admin settings:", err);
        res.status(500).json({ error: "Failed to fetch admin settings." });
      }
    }); // NEW: Endpoint to update admin-specific settings ---

    // --- NEW: Endpoint to update admin-specific settings ---
    app.put("/api/admin-settings", authenticateToken, async (req, res) => {
      const { setting_name, setting_value, recaptchaToken } = req.body;
      const { id: adminId, email: adminEmail } = req.admin;

      if (!setting_name || setting_value === undefined) {
        return res
          .status(400)
          .json({ error: "setting_name and setting_value are required." });
      } // Special handling for auto_backup_enabled with reCAPTCHA

      if (setting_name === "auto_backup_enabled" && setting_value === "true") {
        if (!recaptchaToken) {
          return res.status(400).json({
            error:
              "Token reCAPTCHA wajib diisi untuk mengaktifkan auto backup.",
          });
        }

        try {
          const captchaVerificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`;
          const captchaResponse = await fetch(captchaVerificationUrl, {
            method: "POST",
          });
          const captchaJson = await captchaResponse.json(); // --- PERUBAHAN UNTUK reCAPTCHA v2 INVISIBLE --- // reCAPTCHA v2 hanya mengembalikan 'success' (boolean)
          if (!captchaJson.success) {
            // reCAPTCHA v2 hanya mengembalikan 'success' (boolean)
            console.warn("Verifikasi reCAPTCHA gagal:", captchaJson);
            let errorMessage = "Verifikasi reCAPTCHA gagal. Silakan coba lagi.";
            if (
              captchaJson["error-codes"] &&
              captchaJson["error-codes"].length > 0
            ) {
              errorMessage += ` Kode error: ${captchaJson["error-codes"].join(
                ", "
              )}.`;
            }
            return res.status(400).json({ error: errorMessage });
          }
          console.log(`Verifikasi reCAPTCHA berhasil.`); // Hapus pesan skor
        } catch (error) {
          console.error("Error selama verifikasi reCAPTCHA:", error);
          return res.status(500).json({
            error:
              "Terjadi kesalahan saat memverifikasi reCAPTCHA. Coba lagi nanti.",
          });
        }
      }

      try {
        // Convert boolean to string for storage in TEXT column
        const valueToStore =
          typeof setting_value === "boolean"
            ? String(setting_value)
            : setting_value;

        const [result] = await dbPool.query(
          `INSERT INTO AdminSettings (id_admin, setting_name, setting_value) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [adminId, setting_name, valueToStore, valueToStore]
        );

        await createLogMessage(
          `email_admin telah memperbarui pengaturan '${setting_name}' menjadi '${valueToStore}'.`,
          adminId,
          adminEmail
        );
        res.json({ message: "Setting updated successfully." });
      } catch (err) {
        console.error("Error updating admin setting:", err);
        res.status(500).json({ error: "Failed to update setting." });
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
        res
          .status(500)
          .json({ error: "Gagal mengambil log backup: " + err.message });
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
        res
          .status(500)
          .json({ error: "Gagal mengambil log pemulihan: " + err.message });
      }
    });

    app.get("/", (req, res) => {
      res.send("Server API Kendaraan Parkir aktif");
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(
        `Server API dan WebSocket berjalan di http://localhost:${PORT}`
      );
      console.log("Starting scheduled tasks...");
    }); // --- AUTOMATED BACKUP CRON JOB --- // Runs every 5 minutes. // --- AUTOMATED BACKUP CRON JOB --- // Runs every 5 minutes.
    cron.schedule(
      "0 6 * * 1",
      async () => {
        console.log("Running automated backup check...");
        try {
          // Fetch all admins who have auto_backup_enabled = 'true' and a valid email
          const [adminsToBackup] = await dbPool.query(
            `
                SELECT
                    a.id AS admin_id,
                    a.email AS admin_email,
                    COALESCE(TRIM(backup_email_setting.setting_value), '') AS backup_email, -- Ambil nilai email backup, COALESCE untuk NULL jadi string kosong
                    last_backup_timestamp_setting.setting_value AS last_backup_time
                FROM Admin a
                JOIN AdminSettings enabled_setting ON a.id = enabled_setting.id_admin
                    AND enabled_setting.setting_name = 'auto_backup_enabled'
                    AND enabled_setting.setting_value = 'true'
                LEFT JOIN AdminSettings backup_email_setting ON a.id = backup_email_setting.id_admin
                    AND backup_email_setting.setting_name = 'auto_backup_email'
                LEFT JOIN AdminSettings last_backup_timestamp_setting ON a.id = last_backup_timestamp_setting.id_admin
                    AND last_backup_timestamp_setting.setting_name = 'last_auto_backup_timestamp'
                WHERE COALESCE(TRIM(backup_email_setting.setting_value), '') != '' -- Pastikan email backup tidak kosong setelah di-trim
                GROUP BY a.id, a.email
            `.trim()
          ); // Tetap gunakan .trim() untuk seluruh query string

          // --- TAMBAHKAN LOG INI SEMENTARA UNTUK DEBUGGING ---
          console.log("--- DEBUGGING ADMINS TO BACKUP ---");
          console.log(
            "ADMIN_AUTO_BACKUP_RECIPIENT_EMAIL (dari .env):",
            ADMIN_AUTO_BACKUP_RECIPIENT_EMAIL
          );
          adminsToBackup.forEach((admin) => {
            console.log(`Admin ${admin.admin_email}:`);
            console.log(
              `  - backup_email dari DB: '${
                admin.backup_email
              }' (Type: ${typeof admin.backup_email})`
            );
            const resolvedTargetEmail =
              admin.backup_email || ADMIN_AUTO_BACKUP_RECIPIENT_EMAIL;
            console.log(
              `  - targetEmail setelah fallback: '${resolvedTargetEmail}'`
            );
            console.log(`  - is targetEmail falsy? ${!resolvedTargetEmail}`);
          });
          console.log("--- END DEBUGGING ---");
          // --- AKHIR LOG DEBUGGING ---

          for (const admin of adminsToBackup) {
            const targetEmail =
              admin.backup_email || ADMIN_AUTO_BACKUP_RECIPIENT_EMAIL; // Fallback to global if admin's is empty

            // Only proceed if a target email is found
            if (!targetEmail) {
              // Ini seharusnya tidak lagi terpicu jika query di atas sudah benar
              console.warn(
                `Skipping auto backup for admin ${admin.admin_email}: No valid backup email configured.`
              );
              await createLogMessage(
                `Gagal melakukan auto backup untuk email: ${admin.admin_email} - Tidak ada email penerima backup yang dikonfigurasi.`,
                admin.admin_id,
                admin.admin_email
              );
              continue;
            }

            // Check if last backup was less than a week ago (for weekly logic)
            // For *testing every minute*, this check needs to be adjusted or temporarily removed.
            // For actual weekly backup, uncomment the logic below:
            /*
                const lastBackupDate = admin.last_backup_time ? new Date(admin.last_backup_time) : null;
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Subtract 7 days

                if (lastBackupDate && lastBackupDate > oneWeekAgo) {
                    console.log(`Skipping auto backup for admin ${admin.admin_email}: Backup already performed recently.`);
                    continue; // Skip if backup was done within the last week
                }
                */
            // For testing every minute, you might want to remove the above check or set it to check for 'last minute'

            const timestamp = new Date()
              .toISOString()
              .replace(/:/g, "-")
              .replace(/\./g, "_");
            const backupFileName = `${DB_NAME}_${timestamp}.sql`;
            const backupFilePath = path.join(backupsDir, backupFileName);

            const command = `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASS} ${DB_NAME} > "${backupFilePath}"`;

            console.log(
              `Performing automated backup for ${admin.admin_email} to: ${backupFilePath}`
            );
            try {
              await new Promise((resolve, reject) => {
                exec(command, (error, stdout, stderr) => {
                  if (error) {
                    console.error(
                      `Automated backup failed for ${admin.admin_email}: ${error.message}`
                    );
                    return reject(
                      new Error(`Auto backup gagal: ${error.message}`)
                    );
                  }
                  if (stderr) {
                    console.warn(
                      `Automated backup stderr for ${admin.admin_email}: ${stderr}`
                    );
                  }
                  console.log(
                    `Automated backup stdout for ${admin.admin_email}: ${stdout}`
                  );
                  console.log(
                    `Automated database backup successful for ${admin.admin_email}: ${backupFileName}`
                  );
                  resolve();
                });
              });

              // Send email
              const emailSent = await sendBackupEmail(
                backupFilePath,
                backupFileName,
                targetEmail
              );

              // Log in Log_Backup table
              const logSql = `INSERT INTO Log_Backup (waktu_backup, id_admin) VALUES (NOW(), ?)`;
              await dbPool.query(logSql, [admin.admin_id]);

              // Update last_auto_backup_timestamp in AdminSettings
              await dbPool.query(
                `INSERT INTO AdminSettings (id_admin, setting_name, setting_value) VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE setting_value = ?`,
                [
                  admin.admin_id,
                  "last_auto_backup_timestamp",
                  new Date().toISOString(),
                  new Date().toISOString(),
                ]
              );

              await createLogMessage(
                `Auto backup database berhasil dikirim ke ${targetEmail} untuk email: ${admin.admin_email}.`,
                admin.admin_id,
                admin.admin_email
              );

              // Delete the file after sending email (optional, but good practice for temporary backups)
              fs.unlink(backupFilePath, (err) => {
                if (err)
                  console.error(
                    `Error deleting backup file ${backupFilePath}:`,
                    err
                  );
                else
                  console.log(
                    `Deleted automated backup file: ${backupFilePath}`
                  );
              });
            } catch (err) {
              console.error(
                `Failed to complete automated backup process for ${admin.admin_email}:`,
                err
              );
              await createLogMessage(
                `Gagal melakukan auto backup database untuk email: ${admin.admin_email} - ${err.message}.`,
                admin.admin_id,
                admin.admin_email
              );
              // Ensure file is deleted even if email fails
              if (fs.existsSync(backupFilePath)) {
                fs.unlink(backupFilePath, (deleteErr) => {
                  if (deleteErr)
                    console.error(
                      `Error deleting failed backup file ${backupFilePath}:`,
                      deleteErr
                    );
                });
              }
            }
          }
        } catch (error) {
          console.error(
            "Error fetching admins for auto backup or during general cron job:",
            error
          );
        }
      },
      {
        timezone: "Asia/Jakarta", // Ensure the cron job runs in the correct timezone
      }
    );
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
      console.log(`Connected to MySQL database ${DB_NAME} for admin creation.`);

      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO Admin (email, password) VALUES (?, ?)";
        const [result] = await connection.query(sql, [email, hashedPassword]);

        // **NEW: Add default settings for the newly created admin via CLI**
        // MODIFIED: Pass the 'connection' object to addDefaultAdminSettings
        await addDefaultAdminSettings(connection, result.insertId, email);

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
