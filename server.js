/**
 * =========================================================
 *  VALENCIRÉ® Backend Server
 *  Luxury Commerce Email Engine
 * =========================================================
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

/* =========================================================
   APP SETUP
========================================================= */
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

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

function getWelcomeEmailHTML(firstName) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Welcome to VALENCIRÉ®</title>
<style>
body {
  margin:0;
  background:#0a0a0a;
  font-family:"Helvetica Neue", Arial, sans-serif;
  color:#f5f5f5;
}
.container {
  max-width:600px;
  margin:40px auto;
  padding:50px;
  background:linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.95));
  border-radius:24px;
  border:1px solid rgba(255,255,255,0.12);
}
h1 {
  text-align:center;
  font-weight:300;
  letter-spacing:6px;
}
p {
  opacity:.85;
  line-height:1.8;
}
.cta {
  display:block;
  margin:40px auto;
  padding:16px 40px;
  background:#7f5cff;
  color:#fff;
  text-decoration:none;
  border-radius:999px;
  letter-spacing:2px;
  font-weight:600;
  text-align:center;
}
.footer {
  margin-top:40px;
  padding-top:30px;
  border-top:1px solid rgba(255,255,255,0.1);
  text-align:center;
  font-size:12px;
  opacity:.5;
}
</style>
</head>
<body>
  <div class="container">
    <h1>WELCOME TO VALENCIRÉ®</h1>
    <h1>${firstName.toUpperCase()}</h1>

    <p>
      You are now part of an exclusive community built on precision,
      craftsmanship, and unapologetic luxury.
    </p>

    <p>As a member, you receive:</p>
    <ul>
      <li>Early access to collections</li>
      <li>Exclusive member pricing</li>
      <li>Priority support</li>
      <li>Private releases</li>
    </ul>

    <a href="https://valencire.com/shop" class="cta">START SHOPPING</a>

    <div class="footer">
      <p>VALENCIRÉ® — AIN'T FOR AVERAGE</p>
      <p>© 2025 All Rights Reserved</p>
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
<title>Order Confirmed</title>
<style>
body {
  margin:0;
  background:#0a0a0a;
  font-family:"Helvetica Neue", Arial, sans-serif;
  color:#f5f5f5;
}
.container {
  max-width:700px;
  margin:40px auto;
  padding:50px;
  background:linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.95));
  border-radius:24px;
  border:1px solid rgba(255,255,255,0.12);
}
h1 {
  text-align:center;
  font-weight:300;
  letter-spacing:6px;
}
.order-number {
  text-align:center;
  margin:30px 0;
  letter-spacing:3px;
  opacity:.8;
}
table {
  width:100%;
  border-collapse:collapse;
}
.summary {
  margin-top:30px;
  padding-top:20px;
  border-top:1px solid rgba(255,255,255,0.1);
}
.footer {
  margin-top:40px;
  padding-top:30px;
  border-top:1px solid rgba(255,255,255,0.1);
  text-align:center;
  font-size:12px;
  opacity:.5;
}
</style>
</head>
<body>
  <div class="container">
    <h1>ORDER CONFIRMED</h1>
    <div class="order-number">Order #${order.orderNumber}</div>

    <p>Thank you, ${order.customerName}. Your order is being prepared.</p>

    <table>${itemsHTML}</table>

    <div class="summary">
      <p>Subtotal: ₹${order.subtotal.toLocaleString()}</p>
      <p>Shipping: ${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</p>
      <h3>Total: ₹${order.total.toLocaleString()}</h3>
    </div>

    <div class="footer">
      <p>Questions? valencireshopping@gmail.com</p>
      <p>© 2025 VALENCIRÉ®</p>
    </div>
  </div>
</body>
</html>`;
}

/* =========================================================
   API ROUTES
========================================================= */

app.post('/api/account/create', async (req, res) => {
  try {
    const { firstName, email } = req.body;

    await transporter.sendMail({
      from: `"VALENCIRÉ®" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to VALENCIRÉ®',
      html: getWelcomeEmailHTML(firstName),
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post('/api/order/create', async (req, res) => {
  try {
    const order = req.body;
    order.orderNumber = `VLC${Date.now()}`;

    await transporter.sendMail({
      from: `"VALENCIRÉ®" <${process.env.EMAIL_USER}>`,
      to: order.email,
      subject: `Order Confirmation #${order.orderNumber}`,
      html: getOrderEmailHTML(order),
      headers: { 'Content-Type': 'text/html; charset=UTF-8' }
    });

    res.json({ success: true, orderNumber: order.orderNumber });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', brand: 'VALENCIRÉ®' });
});

/* =========================================================
   START SERVER
========================================================= */
app.listen(PORT, () => {
  console.log(`🚀 VALENCIRÉ® Backend running on port ${PORT}`);
});

