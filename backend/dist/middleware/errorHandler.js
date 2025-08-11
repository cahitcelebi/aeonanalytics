export const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Doğrulama hatası',
            errors: err.message,
        });
    }
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            message: 'Yetkisiz erişim',
        });
    }
    res.status(500).json({
        message: 'Sunucu hatası',
    });
};
