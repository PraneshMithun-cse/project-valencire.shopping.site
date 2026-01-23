/**
 * =========================================================
 *  VALENCIRÉ® Backend Server
 *  Luxury Commerce Email Engine & Authentication System
 * =========================================================
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

/* =========================================================
   APP SETUP
========================================================= */
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'valencire_secret_key_change_me';
const CLIENT_URL = 'http://localhost:3000';

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'dist'))); // Serve built files
app.use(express.static(path.join(__dirname))); // Fallback for other assets if needed (e.g. pages/cart.html still used?)

// HTML Route to serve the frontend
// Serve index.html for all routes to support SPA client-side routing
// HTML Route to serve the frontend
// We will handle SPA routing at the end of the file


/* =========================================================
   DATABASE SETUP (SQLite)
========================================================= */
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database ' + err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create table with new columns if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT,
            lastName TEXT,
            email TEXT UNIQUE,
            password TEXT,
            createdAt TEXT,
            isAdmin INTEGER DEFAULT 0,
            resetToken TEXT,
            resetTokenExpiry INTEGER
        )`, (err) => {
      if (err) {
        console.error('Error creating table ' + err.message);
      } else {
        // Determine if we need to add columns to existing table
        // Ideally use PRAGMA, but for simplicity in this script we assume either fresh DB or manual migration.
        // We will try to add columns and ignore error if they exist.
        db.run("ALTER TABLE users ADD COLUMN resetToken TEXT", () => { });
        db.run("ALTER TABLE users ADD COLUMN resetTokenExpiry INTEGER", () => { });
      }
    });

    // Create Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            customerName TEXT,
            email TEXT,
            items TEXT,
            subtotal REAL,
            discount REAL,
            shipping REAL,
            total REAL,
            status TEXT DEFAULT 'Placed',
            shippingAddress TEXT,
            orderNumber TEXT UNIQUE,
            createdAt TEXT,
            FOREIGN KEY(userId) REFERENCES users(id)
        )`, (err) => {
      if (err) console.error('Error creating orders table ' + err.message);
      else {
        // Create admin user if it doesn't exist
        createAdminUser();
      }
    });
  }
});

// Function to create admin user
async function createAdminUser() {
  const adminEmail = 'valencireshopping@gmail.com';
  const adminPassword = 'valencire2024';

  db.get('SELECT * FROM users WHERE email = ?', [adminEmail], async (err, user) => {
    if (err) {
      console.error('Error checking for admin user:', err);
      return;
    }

    if (!user) {
      // Admin doesn't exist, create it
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const createdAt = new Date().toISOString();

      db.run(
        'INSERT INTO users (firstName, lastName, email, password, isAdmin, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        ['Admin', 'User', adminEmail, hashedPassword, 1, createdAt],
        (err) => {
          if (err) {
            console.error('Error creating admin user:', err);
          } else {
            console.log('✅ Admin user created: valencireshopping@gmail.com');
          }
        }
      );
    } else if (user.isAdmin !== 1) {
      // User exists but is not admin, update them
      db.run('UPDATE users SET isAdmin = 1 WHERE email = ?', [adminEmail], (err) => {
        if (err) {
          console.error('Error updating admin status:', err);
        } else {
          console.log('✅ Admin status granted to valencireshopping@gmail.com');
        }
      });
    } else {
      console.log('✅ Admin user already exists');
    }
  });
}


/* =========================================================
   MAIL TRANSPORT (GMAIL)
========================================================= */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =========================================================
   EMAIL TEMPLATES
========================================================= */

const emailStyles = `
body { margin:0; background:#0a0a0a; font-family:"Helvetica Neue", Arial, sans-serif; color:#f5f5f5; }
.container { max-width:600px; margin:40px auto; padding:50px; background:linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.95)); border-radius:24px; border:1px solid rgba(255,255,255,0.12); }
h1 { text-align:center; font-weight:300; letter-spacing:6px; }
p { opacity:.85; line-height:1.8; }
.cta { display:block; margin:40px auto; padding:16px 40px; background:#f5f5f5; color:#0a0a0a; text-decoration:none; border-radius:999px; letter-spacing:2px; font-weight:600; text-align:center; }
.footer { margin-top:40px; padding-top:30px; border-top:1px solid rgba(255,255,255,0.1); text-align:center; font-size:12px; opacity:.5; }
`;

function getWelcomeEmailHTML(firstName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <h1>WELCOME TO VALENCIRÉ®</h1>
    <h1>${firstName.toUpperCase()}</h1>
    <p>You are now part of an exclusive community built on precision, craftsmanship, and unapologetic luxury.</p>
    <a href="${CLIENT_URL}/#shop" class="cta">START SHOPPING</a>
    <div class="footer">
      <p>VALENCIRÉ® — AIN'T FOR AVERAGE</p>
    </div>
  </div>
</body>
</html>`;
}

function getResetPasswordEmailHTML(link) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>${emailStyles}</style>
</head>
<body>
  <div class="container">
    <h1>RESET PASSWORD</h1>
    <p>A request was received to reset the password for your VALENCIRÉ® account.</p>
    <p>Click the button below to set a new password. This link expires in 1 hour.</p>
    <a href="${link}" class="cta">RESET PASSWORD</a>
    <div class="footer">
      <p>If you did not request this, please ignore this email.</p>
      <p>© 2025 VALENCIRÉ®</p>
    </div>
  </div>
</body>
</html>`;
}

function getOrderEmailHTML(order) {
  const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding:16px 0;">
        <strong>${item.name}</strong><br>
        <span style="opacity:.6">Size: ${item.size} × ${item.quantity}</span>
      </td>
      <td align="right">₹${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>${emailStyles}
table { width:100%; border-collapse:collapse; }
.summary { margin-top:30px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1); }
</style>
</head>
<body>
  <div class="container">
    <h1>ORDER CONFIRMED</h1>
    <div style="text-align:center; margin:30px 0; letter-spacing:3px; opacity:.8">Order #${order.orderNumber}</div>
    <p>Thank you, ${order.customerName}. Your order is being prepared.</p>
    <table>${itemsHTML}</table>
    <div class="summary">
      <p>Subtotal: ₹${order.subtotal.toLocaleString()}</p>
      <p>Shipping: ${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</p>
      <h3>Total: ₹${order.total.toLocaleString()}</h3>
    </div>
    <div class="footer">
      <p>© 2025 VALENCIRÉ®</p>
    </div>
  </div>
</body>
</html>`;
}

/* =========================================================
   MIDDLEWARE
========================================================= */

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Admin middleware - verify user is admin
const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    // Check if user is admin
    db.get('SELECT isAdmin FROM users WHERE id = ?', [user.id], (err, row) => {
      if (err || !row || row.isAdmin !== 1) {
        return res.status(403).json({ success: false, message: 'Admin access required' });
      }
      req.user = user;
      next();
    });
  });
};

/* =========================================================
   API ROUTES
========================================================= */

// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password || !firstName) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createdAt = new Date().toISOString();

    db.run(`INSERT INTO users (firstName, lastName, email, password, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email, hashedPassword, createdAt],
      async function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
          }
          console.error(err);
          return res.status(500).json({ success: false, message: 'Database error.' });
        }

        // Send Welcome Email
        try {
          await transporter.sendMail({
            from: `"VALENCIRÉ®" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Welcome to VALENCIRÉ®',
            html: getWelcomeEmailHTML(firstName),
            headers: { 'Content-Type': 'text/html; charset=UTF-8' }
          });
        } catch (emailErr) {
          console.error('Email sending failed:', emailErr);
          // Decide if you want to fail signup if email fails, or just log it. 
          // Proceeding but logging error.
        }

        const token = jwt.sign({ id: this.lastID, email: email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
          success: true,
          token,
          user: {
            id: this.lastID,
            firstName,
            lastName,
            email
          }
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// LOGIN
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Database error.' });
    }

    if (!row) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    const match = await bcrypt.compare(password, row.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = jwt.sign({
      id: row.id,
      email: row.email,
      isAdmin: row.isAdmin || 0
    }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      token,
      user: {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        isAdmin: row.isAdmin || 0
      }
    });
  });
});

// FORGOT PASSWORD
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (err || !user) {
      // Always return success to prevent email enumeration
      return res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    db.run(`UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE email = ?`,
      [resetToken, resetTokenExpiry, email],
      async (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }

        const resetLink = `${CLIENT_URL}/?resetToken=${resetToken}`;

        try {
          await transporter.sendMail({
            from: `"VALENCIRÉ®" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Reset Your Password',
            html: getResetPasswordEmailHTML(resetLink),
            headers: { 'Content-Type': 'text/html; charset=UTF-8' }
          });
          console.log(`Reset email sent to ${email}`);
        } catch (emailErr) {
          console.error('Reset email failed:', emailErr);
        }

        res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
      }
    );
  });
});

// RESET PASSWORD
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  db.get(`SELECT * FROM users WHERE resetToken = ? AND resetTokenExpiry > ?`,
    [token, Date.now()],
    async (err, user) => {
      if (err || !user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired token.' });
      }

      try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        db.run(`UPDATE users SET password = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?`,
          [hashedPassword, user.id],
          (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Database Update failed' });
            res.json({ success: true, message: 'Password has been reset successfully.' });
          }
        );
      } catch (hashErr) {
        res.status(500).json({ success: false, message: 'Server error' });
      }
    }
  );
});


// GET CURRENT USER (Session Check)
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get(`SELECT id, firstName, lastName, email, createdAt FROM users WHERE id = ?`, [req.user.id], (err, row) => {
    if (err || !row) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user: row });
  });
});

// CHANGE PASSWORD
app.post('/api/users/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  db.get(`SELECT * FROM users WHERE id = ?`, [req.user.id], async (err, user) => {
    if (err || !user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ success: false, message: 'Incorrect current password.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, user.id], (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Failed to update password.' });
        res.json({ success: true, message: 'Password updated successfully.' });
      });
    } catch (hashErr) {
      res.status(500).json({ success: false, message: 'Server error.' });
    }
  });
});



// CREATE ORDER (Authenticated)
app.post('/api/order/create', authenticateToken, async (req, res) => {
  try {
    const order = req.body;

    // Validate required fields
    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    const orderNumber = `VLC${Date.now()}`;
    const createdAt = new Date().toISOString();
    const status = 'Placed';
    const email = req.user.email; // Use email from token to be secure
    const userId = req.user.id;

    // Insert into DB
    db.run(`INSERT INTO orders (userId, customerName, email, items, subtotal, discount, shipping, total, status, shippingAddress, orderNumber, createdAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        order.customerName,
        email,
        JSON.stringify(order.items), // Store items as JSON string
        order.subtotal,
        order.discount,
        order.shipping,
        order.total,
        status,
        JSON.stringify(order.shippingAddress),
        orderNumber,
        createdAt
      ],
      async function (err) {
        if (err) {
          console.error('Order DB Error:', err);
          return res.status(500).json({ success: false, message: 'Failed to save order' });
        }

        const orderId = this.lastID;

        // Send Email
        try {
          // Reconstruct order object for email template including generated fields
          const emailOrder = { ...order, orderNumber, email };

          await transporter.sendMail({
            from: `"VALENCIRÉ®" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Order Confirmation #${orderNumber}`,
            html: getOrderEmailHTML(emailOrder),
            headers: { 'Content-Type': 'text/html; charset=UTF-8' }
          });
        } catch (emailErr) {
          console.error('Order Email Failed:', emailErr);
          // We don't fail the request if email fails, as order is already saved.
        }

        res.json({ success: true, orderNumber, orderId });
      }
    );

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// GET USER ORDERS
app.get('/api/orders', authenticateToken, (req, res) => {
  db.all(`SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC`, [req.user.id], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    // Parse JSON fields
    const orders = rows.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]'),
      shippingAddress: JSON.parse(order.shippingAddress || '{}')
    }));
    res.json({ success: true, orders });
  });
});

/* =========================================================
   ADMIN API ROUTES (Protected by authenticateAdmin middleware)
========================================================= */

// GET ALL USERS (Admin only)
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
  db.all(`SELECT id, firstName, lastName, email, createdAt, isAdmin FROM users ORDER BY createdAt DESC`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    // Get order count for each user
    const userPromises = rows.map(user => {
      return new Promise((resolve) => {
        db.get(`SELECT COUNT(*) as orderCount FROM orders WHERE userId = ?`, [user.id], (err, result) => {
          resolve({
            ...user,
            orderCount: result ? result.orderCount : 0
          });
        });
      });
    });

    Promise.all(userPromises).then(users => {
      res.json({ success: true, users });
    });
  });
});

// GET ALL ORDERS (Admin only)
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
  db.all(`SELECT * FROM orders ORDER BY createdAt DESC`, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }

    const orders = rows.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]'),
      shippingAddress: JSON.parse(order.shippingAddress || '{}')
    }));

    res.json({ success: true, orders });
  });
});

// DELETE USER (Admin only)
app.delete('/api/admin/users/:id', authenticateAdmin, (req, res) => {
  const userId = req.params.id;

  // Prevent admin from deleting themselves
  if (parseInt(userId) === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
  }

  // Delete user's orders first
  db.run(`DELETE FROM orders WHERE userId = ?`, [userId], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Error deleting user orders' });
    }

    // Then delete the user
    db.run(`DELETE FROM users WHERE id = ?`, [userId], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Error deleting user' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({ success: true, message: 'User deleted successfully' });
    });
  });
});

// GET ADMIN STATS (Admin only)
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
  const stats = {};

  // Get total users
  db.get(`SELECT COUNT(*) as count FROM users`, [], (err, result) => {
    stats.totalUsers = result ? result.count : 0;

    // Get total orders
    db.get(`SELECT COUNT(*) as count FROM orders`, [], (err, result) => {
      stats.totalOrders = result ? result.count : 0;

      // Get total revenue
      db.get(`SELECT SUM(total) as revenue FROM orders`, [], (err, result) => {
        stats.totalRevenue = result && result.revenue ? result.revenue : 0;

        // Get recent orders (last 10)
        db.all(`SELECT * FROM orders ORDER BY createdAt DESC LIMIT 10`, [], (err, rows) => {
          stats.recentOrders = rows ? rows.map(order => ({
            ...order,
            items: JSON.parse(order.items || '[]')
          })) : [];

          // Get recent users (last 10)
          db.all(`SELECT id, firstName, lastName, email, createdAt FROM users ORDER BY createdAt DESC LIMIT 10`, [], (err, rows) => {
            stats.recentUsers = rows || [];

            // Get top products (most ordered)
            db.all(`SELECT items FROM orders`, [], (err, rows) => {
              const productCounts = {};

              if (rows) {
                rows.forEach(order => {
                  const items = JSON.parse(order.items || '[]');
                  items.forEach(item => {
                    if (!productCounts[item.name]) {
                      productCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
                    }
                    productCounts[item.name].count += item.quantity;
                    productCounts[item.name].revenue += item.price * item.quantity;
                  });
                });
              }

              stats.topProducts = Object.values(productCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

              res.json({ success: true, stats });
            });
          });
        });
      });
    });
  });
});


app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', brand: 'VALENCIRÉ®' });
});

// Root route: Serve index.old.html as the main landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.old.html'));
});

// SPA Fallback: Serve React app (dist/index.html) for /dashboard and other non-API routes
// Using Regex to assume catch-all if we reach here
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

/* =========================================================
   START SERVER
========================================================= */
app.listen(PORT, () => {
  console.log(`🚀 VALENCIRÉ® Backend running on port ${PORT}`);
});

