require('dotenv').config();
const nodemailer = require('nodemailer');

const user = process.env.EMAIL_USER;
const pass = process.env.EMAIL_PASS;

console.log('Checking Environment Variables:');
console.log('EMAIL_USER:', user ? 'Set' : 'Not Set');
console.log('EMAIL_PASS:', pass ? 'Set' : 'Not Set');

if (!user || !pass) {
    console.error('ERROR: Missing EMAIL_USER or EMAIL_PASS in .env file.');
    console.error('Please ensure you have a .env file with these variables.');
    process.exit(1);
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: user,
        pass: pass
    }
});

console.log('Verifying SMTP Connection...');
transporter.verify(function (error, success) {
    if (error) {
        console.error('SMTP Connection Failed:');
        console.error(error);
    } else {
        console.log('SUCCESS: SMTP Connection Established. Email sending should work.');
    }
});
