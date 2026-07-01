require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes (تأكد أن الـ APIs دائماً في البداية)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/submissions', require('./routes/submissions'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/progress', require('./routes/progress'));

// مسار المجلد الثابت للفرونت إند داخل السيرفر
const distPath = path.join(__dirname, 'dist');

// تشغيل ملفات الفرونت إند الثابتة في حال وجودها
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// توجيه أي مسار آخر غير الـ API لخدمة الفرونت إند
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ status: "error", message: "API endpoint not found" });
  }
  
  // إذا كان ملف index.html موجوداً أرسله، وإلا أرسل الرسالة الاحتياطية بدون كراش
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({
      status: "success",
      message: "Server is live! Please ensure frontend files are completely uploaded inside 'server/dist'."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
