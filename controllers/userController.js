import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import db from './../config/db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (user, req) => {
  const token = crypto.randomBytes(32).toString('hex');
  
  await db.execute('UPDATE users SET verification_token = ? WHERE email = ?', [token, user.email]);
  
  const verifyLink = `${req.protocol}://${req.get('host')}/api/user/verify/${token}`;
  await transporter.sendMail({
    to: user.email,
    subject: 'Verify Your Email',
    html: `<h3>Please verify your email by clicking the link below:</h3><a href="${verifyLink}">Verify Email</a>`,
  });
};

export const registerCustomer = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, 'customer']
    );

    const user = { email };
    await sendVerificationEmail(user, req);

    res.status(201).send('Customer registered. Please verify your email.');
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const registerAdmin = async (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (first_name, last_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, email, hashedPassword, 'admin']
    );

    const user = { email };
    await sendVerificationEmail(user, req);

    res.status(201).send('Admin registered. Please verify your email.');
  } catch (error) {
    res.status(400).send(error.message);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE verification_token = ?', [req.params.token]);
    const user = rows[0];

    if (!user.is_verified) {
      await db.execute('UPDATE users SET is_verified = 1');
    }

    res.send({message:"Verification Sucessfull" });
  } catch (error) {
    res.status(500).send('Server error');
  }
};

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || user.role !== 'admin') {
      return res.status(403).send('You are not allowed to login from here.');
    }

    if (!user.is_verified) {
      return res.status(403).send('Please verify your email first.');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).send('Invalid credentianls.');
    }

    res.send({ message:"Login Successfull" });
  } catch (error) {
    res.status(500).send('Server error');
  }
};