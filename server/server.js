require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the frontend static files
app.use(express.static(path.join(__dirname, '../')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/progress', require('./routes/progress'));

// الصفحة الرئيسية الافتراضية للـ API لتجنب رسالة Cannot GET /
app.get('/', (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to Tawheed Reader API Server! The backend is running perfectly."
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});