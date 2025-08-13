const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

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
// ✅ Create email_jobs table for scheduled emails
const createEmailJobsTable = `
   CREATE TABLE IF NOT EXISTS email_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  emails TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  scheduled_at TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
  `;

db.run(createEmailJobsTable, (err) => {
  if (err)
    return console.error("❌ Failed to create email_jobs table:", err.message);
  console.log("✅ 'email_jobs' table ensured.");
});

// ✅ Create email_logs table for sent emails
const createEmailLogsTable = `
   CREATE TABLE IF NOT EXISTS email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  emails TEXT NOT NULL,
  subject TEXT,
  message TEXT,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
  `;

// ✅ Create email_delivery_logs table for tracking delivery status
const createEmailDeliveryLogsTable = `
   CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email_log_id INTEGER,
  recipient_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TEXT,
  delivered_at TEXT,
  failed_at TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_log_id) REFERENCES email_logs (id)
);
  `;

db.run(createEmailLogsTable, (err) => {
  if (err)
    return console.error("❌ Failed to create email_logs table:", err.message);
  console.log("✅ 'email_logs' table ensured.");
});

db.run(createEmailDeliveryLogsTable, (err) => {
  if (err)
    return console.error("❌ Failed to create email_delivery_logs table:", err.message);
  console.log("✅ 'email_delivery_logs' table ensured.");
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

// ✅ Bulk import contacts (expects JSON array from frontend Excel parse)
app.post("/api/contacts/import", (req, res) => {
  const { contacts } = req.body || {};

  if (!Array.isArray(contacts)) {
    return res.status(400).json({ success: false, message: "'contacts' must be an array" });
  }

  const allowedFields = [
    "first_name",
    "last_name",
    "middle_name",
    "full_name",
    "phone",
    "gender",
    "date_of_birth",
    "alternate_phone",
    "address",
    "city",
    "state",
    "postal_code",
    "country",
    "contact_type",
    "organization_name",
    "job_title",
    "department",
    "website",
    "linkedin",
    "twitter",
    "facebook",
    "instagram",
    "whatsapp",
    "email",
    "relationship",
    "notes",
    "is_favorite",
    "is_active",
    "created_at",
    "updated_at",
  ];

  function normalizeBoolean(value) {
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "number") return value ? 1 : 0;
    const str = String(value || "").trim().toLowerCase();
    return str === "true" || str === "yes" || str === "1" || str === "y" ? 1 : 0;
  }

  function normalizeDate(value) {
    if (value == null || value === "") return null;
    // Excel serial date number handling
    if (typeof value === "number") {
      const millisecondsSinceEpoch = (value - 25569) * 86400 * 1000;
      const date = new Date(millisecondsSinceEpoch);
      if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
      return null;
    }
    // ISO or other string date
    const date = new Date(value);
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    return null;
  }

  let inserted = 0;
  let failed = 0;
  const errors = [];

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    let index = 0;
    const insertNext = () => {
      if (index >= contacts.length) {
        return db.run("COMMIT", (commitErr) => {
          if (commitErr) {
            return res
              .status(500)
              .json({ success: false, message: "Failed to commit transaction", error: commitErr.message });
          }
          return res.json({ success: true, inserted, failed, errors });
        });
      }

      const original = contacts[index] || {};

      // Build normalized contact object limited to allowed fields
      const normalized = {};
      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(original, key)) {
          normalized[key] = original[key];
        }
      }

      // Require email
      if (!normalized.email || String(normalized.email).trim() === "") {
        failed += 1;
        errors.push({ index, error: "Email is required" });
        index += 1;
        return insertNext();
      }

      // Normalize booleans
      if (normalized.is_favorite !== undefined) {
        normalized.is_favorite = normalizeBoolean(normalized.is_favorite);
      }
      if (normalized.is_active !== undefined) {
        normalized.is_active = normalizeBoolean(normalized.is_active);
      }

      // Normalize date
      if (normalized.date_of_birth !== undefined) {
        normalized.date_of_birth = normalizeDate(normalized.date_of_birth);
      }

      // Timestamps
      const nowIso = new Date().toISOString();
      if (!normalized.created_at) normalized.created_at = nowIso;
      if (!normalized.updated_at) normalized.updated_at = nowIso;

      const fields = Object.keys(normalized);
      const values = Object.values(normalized);
      const placeholders = fields.map(() => "?").join(", ");
      const query = `INSERT INTO contacts (${fields.join(", ")}) VALUES (${placeholders})`;

      db.run(query, values, function (err) {
        if (err) {
          failed += 1;
          errors.push({ index, email: normalized.email, error: err.message });
        } else {
          inserted += 1;
        }
        index += 1;
        insertNext();
      });
    };

    insertNext();
  });
});

const multer = require("multer");
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit
// ✉️ POST - Send bulk emails (with scheduling support)
app.post(
  "/api/send-bulk-email",
  upload.array("attachments", 3),
  async (req, res) => {
    const { subject, message, emails, scheduledTime, createCron } = req.body;
    const recipients = emails.split(",").map((e) => e.trim());

    if (!subject || !message || recipients.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      // If scheduledTime is provided, save to email_jobs table for later execution
      if (scheduledTime) {
        const emailCSV = recipients.join(", ");
        const attachmentsData = req.files ? JSON.stringify(req.files.map(file => ({
          filename: file.originalname,
          content: file.buffer.toString('base64')
        }))) : null;

        db.run(
          `INSERT INTO email_jobs (emails, subject, message, scheduled_at, status) VALUES (?, ?, ?, ?, ?)`,
          [emailCSV, subject, message, scheduledTime, 'scheduled'],
          function(err) {
            if (err) {
              console.error("❌ Failed to schedule email:", err.message);
              return res.status(500).json({ error: "Failed to schedule email: " + err.message });
            }
            
            console.log(`✅ Email scheduled for ${scheduledTime} with job ID: ${this.lastID}`);
            res.json({ 
              success: true, 
              message: `Email scheduled for ${new Date(scheduledTime).toLocaleString()}`,
              jobId: this.lastID
            });
          }
        );
        return;
      }

      // 🔐 Setup transporter for immediate sending
      let transporter = nodemailer.createTransport({
        service: "gmail", // or use SMTP server like 'smtp.mailgun.org'
        auth: {
          user: "aslamkhan1221@gmail.com", // 🔁 Replace with your Gmail
          pass: "eipx qhvf tzme siqk", // 🔁 Use your Gmail app password
        },
      });

      const emailCSV = recipients.join(", ");

      // 1) Create an email_log record first
      db.run(
        `INSERT INTO email_logs (emails, subject, message) VALUES (?, ?, ?)`,
        [emailCSV, subject, message],
        function (err) {
          if (err) {
            console.error("❌ Failed to insert email log:", err.message);
            return res.status(500).json({ error: "Failed to save email log" });
          }

          const emailLogId = this.lastID;

          // 2) Create delivery logs in 'pending' for each recipient and capture their IDs
          const deliveryRecords = [];
          const createLogPromises = recipients.map((recipientEmail, index) => {
            return new Promise((resolve) => {
              db.run(
                `INSERT INTO email_delivery_logs (email_log_id, recipient_email, status) VALUES (?, ?, ?)`,
                [emailLogId, recipientEmail, 'pending'],
                function (insErr) {
                  if (insErr) {
                    console.error("❌ Failed to insert delivery log:", insErr.message);
                    return resolve();
                  }
                  deliveryRecords[index] = { id: this.lastID, email: recipientEmail };
                  resolve();
                }
              );
            });
          });

          Promise.all(createLogPromises).then(async () => {
            // 3) Send emails and update each delivery log accordingly
            let sentCount = 0;
            let failedCount = 0;
            const transparentPixel = `<img src=\"http://localhost:${PORT}/api/track/REPLACE_ID\" width=\"1\" height=\"1\" style=\"display:none\" />`;

            for (const record of deliveryRecords) {
              if (!record) continue;
              const logId = record.id;
              const to = record.email;
              const htmlWithPixel = `${message}${transparentPixel.replace('REPLACE_ID', String(logId))}`;
              try {
                await transporter.sendMail({
                  from: `"aslam khan" <aslamkhan1221@gmail.com>`,
                  to,
                  subject,
                  html: htmlWithPixel,
                  attachments:
                    req.files?.map((file) => ({
                      filename: file.originalname,
                      content: file.buffer,
                    })) || [],
                });

                // Mark as sent
                db.run(
                  `UPDATE email_delivery_logs SET status = 'sent', sent_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                  [logId]
                );
                sentCount += 1;
              } catch (sendErr) {
                console.error("❌ Failed to send to", to, sendErr.message);
                db.run(
                  `UPDATE email_delivery_logs SET status = 'failed', failed_at = CURRENT_TIMESTAMP, error_message = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                  [sendErr.message, logId]
                );
                failedCount += 1;
              }
            }

            res.json({
              success: true,
              message: `Emails processed. Sent: ${sentCount}, Failed: ${failedCount}`,
              emailLogId,
              sent: sentCount,
              failed: failedCount,
            });
          });
        }
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to send emails" });
    }
  }
);
// ✅ GET - Email history (sent emails)
app.get("/api/email-history", (req, res) => {
  const query = `SELECT * FROM email_logs ORDER BY sent_at DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching email history:", err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Found ${rows.length} sent emails`);

    // Convert CSV string to array
    const logs = rows.map((row) => ({
      ...row,
      emails: row.emails ? row.emails.split(",").map((e) => e.trim()) : [],
      cc: row.cc ? row.cc.split(",").map((c) => c.trim()) : [],
    }));

    res.json(logs);
  });
});

// ✅ GET - Scheduled emails
app.get("/api/scheduled-emails", (req, res) => {
  const query = `SELECT * FROM email_jobs WHERE status = 'scheduled' ORDER BY scheduled_at ASC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching scheduled emails:", err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Found ${rows.length} scheduled emails`);

    // Convert CSV string to array
    const logs = rows.map((row) => ({
      ...row,
      emails: row.emails ? row.emails.split(",").map((e) => e.trim()) : [],
    }));

    res.json(logs);
  });
});

// ✅ Test endpoint to check database connection
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Backend is running", 
    timestamp: new Date().toISOString(),
    database: "Connected"
  });
});

// ✅ GET - Email delivery status for a specific email log
app.get("/api/email-delivery-status/:emailLogId", (req, res) => {
  const { emailLogId } = req.params;
  
  const query = `
    SELECT 
      edl.*,
      el.subject,
      el.message
    FROM email_delivery_logs edl
    LEFT JOIN email_logs el ON edl.email_log_id = el.id
    WHERE edl.email_log_id = ?
    ORDER BY edl.created_at DESC
  `;

  db.all(query, [emailLogId], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching delivery status:", err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Found ${rows.length} delivery logs for email log ${emailLogId}`);
    res.json(rows);
  });
});

// ✅ Tracking pixel to mark delivered when email is opened
app.get('/api/track/:deliveryLogId', (req, res) => {
  const { deliveryLogId } = req.params;
  db.run(
    `UPDATE email_delivery_logs SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status != 'failed'`,
    [deliveryLogId],
    (err) => {
      if (err) {
        console.error('❌ Failed to update delivered status:', err.message);
      }
      // Return a 1x1 transparent GIF
      const img = Buffer.from(
        'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
        'base64'
      );
      res.writeHead(200, {
        'Content-Type': 'image/gif',
        'Content-Length': img.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      });
      res.end(img);
    }
  );
});

// ✅ GET - Email delivery statistics
app.get("/api/email-delivery-stats", (req, res) => {
  const query = `
    SELECT 
      status,
      COUNT(*) as count
    FROM email_delivery_logs
    GROUP BY status
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching delivery stats:", err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ Found delivery stats:`, rows);
    res.json(rows);
  });
});

// ✅ PUT - Update delivery status (for manual status updates)
app.put("/api/email-delivery-status/:id", (req, res) => {
  const { id } = req.params;
  const { status, error_message } = req.body;
  
  const updateFields = [];
  const values = [];
  
  if (status) {
    updateFields.push('status = ?');
    values.push(status);
  }
  
  if (error_message !== undefined) {
    updateFields.push('error_message = ?');
    values.push(error_message);
  }
  
  if (status === 'delivered') {
    updateFields.push('delivered_at = ?');
    values.push(new Date().toISOString());
  } else if (status === 'failed') {
    updateFields.push('failed_at = ?');
    values.push(new Date().toISOString());
  }
  
  updateFields.push('updated_at = ?');
  values.push(new Date().toISOString());
  
  values.push(id);
  
  const query = `UPDATE email_delivery_logs SET ${updateFields.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    
    if (this.changes === 0) {
      return res.status(404).json({ error: "Delivery log not found" });
    }
    
    res.json({ success: true, message: "Delivery status updated successfully" });
  });
});

// ✅ DELETE - Cancel scheduled email
app.delete("/api/scheduled-emails/:id", (req, res) => {
  const { id } = req.params;
  
  db.run(
    `UPDATE email_jobs SET status = 'cancelled' WHERE id = ?`,
    [id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      if (this.changes === 0) {
        return res.status(404).json({ error: "Scheduled email not found" });
      }
      
      res.json({ success: true, message: "Scheduled email cancelled successfully" });
    }
  );
});

//  Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
