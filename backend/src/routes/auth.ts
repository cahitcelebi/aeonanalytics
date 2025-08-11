import express from 'express';
import jwt from 'jsonwebtoken';
import Developer from '../models/Developer.js';
import sequelize from '../config/database.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const router = express.Router();

// Veritabanı bağlantı testi
router.get('/test-db', async (req, res) => {
  try {
    await sequelize.authenticate();
    const developers = await Developer.findAll();
    res.json({ message: 'Veritabanı bağlantısı başarılı', developerCount: developers.length });
  } catch (error: any) {
    console.error('Database connection error:', error);
    res.status(500).json({ message: 'Veritabanı bağlantı hatası', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'DEBUG-ENGLISH: Email and password are required' 
      });
    }

    // Geliştiriciyi bul
    const developer = await Developer.findOne({ where: { email } });
    console.log('Developer found:', developer ? 'Yes' : 'No');
    
    if (!developer) {
      console.log('Developer not found:', email);
      return res.status(401).json({ 
        success: false,
        message: 'DEBUG-ENGLISH: Invalid email or password' 
      });
    }

    // Şifreyi kontrol et
    console.log('Comparing passwords...');
    const isMatch = await developer.comparePassword(password);
    console.log('Password comparison result:', isMatch);
    
    if (!isMatch) {
      console.log('Invalid password for developer:', email);
      return res.status(401).json({ 
        success: false,
        message: 'DEBUG-ENGLISH: Invalid email or password' 
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        developerId: developer.id,
        email: developer.email,
        username: developer.username
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for developer:', email);
    res.json({ 
      success: true,
      token,
      developer: {
        id: developer.id,
        email: developer.email,
        username: developer.username,
        companyName: developer.companyName
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Sunucu hatası',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, companyName } = req.body;
    // Check if developer already exists
    const existingDeveloper = await Developer.findOne({
      where: {
        [Op.or]: [
          { username },
          { email }
        ]
      }
    });
    if (existingDeveloper) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }
    // Create developer (password will be hashed by model hook)
    await Developer.create({
      username,
      email,
      password,
      companyName
    });
    res.status(201).json({
      success: true,
      message: 'Developer created successfully'
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during signup'
    });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    const developer = await Developer.findByPk(decoded.developerId);
    if (!developer) {
      return res.status(404).json({ success: false, message: 'Developer not found' });
    }
    const isMatch = await developer.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    developer.password = newPassword;
    await developer.save();
    
    // Invalidate all existing tokens for this user
    const invalidToken = jwt.sign(
      { developerId: developer.id, invalidated: true },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1s' }
    );
    
    res.json({ 
      success: true, 
      message: 'Password changed successfully. Please login again.',
      invalidatedToken: invalidToken
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
});

export default router; 