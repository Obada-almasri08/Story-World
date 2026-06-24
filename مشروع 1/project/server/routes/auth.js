const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { teacher: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'البريد الإلكتروني غير صحيح' });
    }

    // Manager uses the 'teacher' role button on frontend, but backend knows them as 'manager'
    if (role === 'student' && user.role !== 'student') {
        return res.status(401).json({ error: 'البريد الإلكتروني غير صحيح كطالب' });
    }
    if (role === 'teacher' && user.role === 'student') {
        return res.status(401).json({ error: 'البريد الإلكتروني غير صحيح كمعلم' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      teacherEmail: user.teacher ? user.teacher.email : null,
      grade: user.grade
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: tokenPayload
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'حدث خطأ في السيرفر' });
  }
});

module.exports = router;
