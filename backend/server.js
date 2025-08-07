const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ✅ Connect to SQLite DB
const db = new sqlite3.Database("./contacts.db", (err) => {
  if (err) return console.error(err.message);
  console.log("✅ Connected to SQLite database.");

  //  Drop existing contacts table
  // db.run(`DROP TABLE IF EXISTS contacts`, (err) => {
  //   if (err)
  //     return console.error(" Failed to drop contacts table:", err.message);
  //   console.log(" Old 'contacts' table dropped.");

  // ✅ Create new contacts table with updated fields
  const createTableQuery = `
      CREATE TABLE IF NOT EXISTS contacts  (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT,
        last_name TEXT,
        middle_name TEXT,
        full_name TEXT,
        phone TEXT,
        gender TEXT,
        date_of_birth DATE,
        alternate_phone TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        country TEXT,
        contact_type TEXT,
        organization_name TEXT,
        job_title TEXT,
        department TEXT,
        website TEXT,
        linkedin TEXT,
        twitter TEXT,
        facebook TEXT,
        instagram TEXT,
        whatsapp TEXT,
        email TEXT NOT NULL,
        relationship TEXT,
        notes TEXT,
        is_favorite BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

  db.run(createTableQuery, (err) => {
    if (err)
      return console.error(" Failed to create contacts table:", err.message);
    console.log(" New 'contacts' table created.");
  });
});
// ✅ Create email_logs table
const createEmailLogsTable = `
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emails TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `;

db.run(createEmailLogsTable, (err) => {
  if (err)
    return console.error("❌ Failed to create email_logs table:", err.message);
  console.log("✅ 'email_logs' table ensured.");
});

// ✅ Add new contact
app.post("/api/contacts", (req, res) => {
  const data = req.body;

  const requiredFields = ["email"];
  for (const field of requiredFields) {
    if (!data[field] || data[field].trim() === "") {
      return res.status(400).json({ error: `${field} is required` });
    }
  }

  const fields = Object.keys(data);
  const values = Object.values(data);
  const placeholders = fields.map(() => "?").join(", ");
  const query = `INSERT INTO contacts (${fields.join(
    ", "
  )}) VALUES (${placeholders})`;

  db.run(query, values, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...data });
  });
});

//  Get all contacts
app.get("/api/contacts", (req, res) => {
  db.all(`SELECT * FROM contacts`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

//  Update contact
app.put("/api/contacts/:id", (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const fields = Object.keys(data);
  const values = Object.values(data);

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields provided for update" });
  }

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const query = `UPDATE contacts SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;

  db.run(query, [...values, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: "Contact not found" });
    res.json({ id, ...data });
  });
});

//  Delete contact
app.delete("/api/contacts/:id", (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM contacts WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0)
      return res.status(404).json({ error: "Contact not found" });
    res.json({ message: "Contact deleted successfully", id });
  });
});
// ✉️ POST - Send bulk emails
app.post("/api/send-bulk-email", async (req, res) => {
  const { subject, message, emails } = req.body;
  const recipients = emails;

  if (!subject || !message || !recipients || recipients.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // 🔐 Setup transporter
    let transporter = nodemailer.createTransport({
      service: "gmail", // or use SMTP server like 'smtp.mailgun.org'
      auth: {
        user: "aslamkhan1221@gmail.com", // 🔁 Replace with your Gmail
        pass: "eipx qhvf tzme siqk", // 🔁 Use your Gmail app password
      },
    });

    // 📧 Send emails one by one
    for (let email of recipients) {
      await transporter.sendMail({
        from: `"aslam khan" <aslamkhan1221@gmail.com>`,
        to: email,
        subject,
        html: message, // supports HTML
      });
    }

    const emailCSV = recipients.join(", ");
    const logQuery = `INSERT INTO email_logs (emails, subject, message) VALUES (?, ?, ?)`;

    db.run(logQuery, [emailCSV, subject, message], function (err) {
      if (err) console.error("❌ Failed to insert email log:", err.message);
    });

    res.json({ success: true, message: "Emails sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send emails" });
  }
});
// ✅ GET - Email history
app.get("/api/email-history", (req, res) => {
  const query = `SELECT * FROM email_logs ORDER BY sent_at DESC`;

  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    // Convert CSV string to array
    const logs = rows.map((row) => ({
      ...row,
      emails: row.emails.split(",").map((e) => e.trim()),
    }));

    res.json(logs);
  });
});

//  Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
