import jwt from 'jsonwebtoken';
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.error('JWT Middleware: Token bulunamadı. Header:', req.headers['authorization']);
        return res.status(401).json({ message: 'Token bulunamadı' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('JWT Middleware: Geçersiz token. Hata:', error, 'Token:', token);
        return res.status(403).json({ message: 'Geçersiz token' });
    }
};
