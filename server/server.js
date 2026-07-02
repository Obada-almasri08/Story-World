require('dotenv').config();
process.env.UV_THREADPOOL_SIZE = '1';
process.env.TOKIO_WORKER_THREADS = '1';
const express = require('express');
const cors = require('cors');
const path = require('path');
const { execSync } = require('child_process');

// Database schema push moved to local deployment workflow to prevent production startup crash


const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/progress', require('./routes/progress'));

// 1. تشغيل الملفات الثابتة من مجلد dist الجديد
app.use(express.static(path.join(__dirname, 'dist')));

// 2. توجيه الصفحة الرئيسية لتعرض ملف home.html مباشرة
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'home.html'));
});

// توجيه أي مسار آخر غير معروف للفرونت إند
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ status: "error", message: "API endpoint not found" });
  }
  res.sendFile(path.join(__dirname, 'dist', 'home.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
