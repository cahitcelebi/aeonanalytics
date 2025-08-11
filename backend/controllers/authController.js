const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
console.log("dotenv configured in authController");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Kullanıcı kaydı
exports.signup = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, company } = req.body;

    // Email kontrol et
    const existingUser = await pool.query(
      'SELECT * FROM developers WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // Şifreyi hash'le
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kullanıcıyı oluştur
    const result = await pool.query(
      `INSERT INTO developers 
        (username, email, password, first_name, last_name, company) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, username, email, first_name, last_name, company`,
      [username, email, hashedPassword, firstName, lastName, company]
    );

    const user = result.rows[0];

    // JWT oluştur
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error });
  }
};

// Kullanıcı girişi
exports.login = async (req, res) => {
  try {
    console.log('Login attempt with:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Kullanıcıyı bul
    const result = await pool.query(
      'SELECT * FROM developers WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      console.log(`Login failed: User not found for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    console.log(`User found for email ${email}, ID: ${user.id}`);

    // Şifreyi kontrol et
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Login failed: Invalid password for email ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // JWT oluştur
    const token = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '30d'
    });

    console.log(`Login successful for user ID: ${user.id}, email: ${email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company
      },
      token
    });
  } catch (error) {
    console.error('Login error details:', error);
    console.error(error.stack);
    res.status(500).json({ 
      message: 'Server error during login', 
      error: error.message 
    });
  }
};

// Kullanıcı bilgilerini al
exports.getUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT id, username, email, first_name, last_name, company FROM developers WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error });
  }
}; 