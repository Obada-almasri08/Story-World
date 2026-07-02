const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Get all teachers (Manager only)
router.get('/teachers', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      select: { id: true, name: true, email: true, phone: true, passwordPlain: true, createdAt: true }
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a teacher (Manager only)
router.post('/teachers', authenticateToken, requireRole(['manager']), async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = await prisma.user.create({
      data: { name, email, password: hashedPassword, passwordPlain: password, phone, role: 'teacher' }
    });
    res.status(201).json({ id: teacher.id, name: teacher.name, email: teacher.email, phone: teacher.phone, passwordPlain: teacher.passwordPlain });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a teacher (Manager only)
router.delete('/teachers/:id', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get students of a specific teacher
router.get('/students', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'student', teacherId: req.user.id },
      select: { id: true, name: true, email: true, grade: true, passwordPlain: true, createdAt: true }
    });
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a student (Teacher only)
router.post('/students', authenticateToken, requireRole(['teacher']), async (req, res) => {
  const { name, email, password, grade } = req.body;
  
  if (!name || !email || !password || !grade) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
  }

  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ error: 'يجب أن ينتهي البريد الإلكتروني بـ @gmail.com' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const student = await prisma.user.create({
      data: { 
        name, 
        email, 
        password: hashedPassword, 
        passwordPlain: password,
        role: 'student', 
        grade: parseInt(grade),
        teacherId: req.user.id
      }
    });
    res.status(201).json({ id: student.id, name: student.name, email: student.email, grade: student.grade, passwordPlain: student.passwordPlain });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a student (Teacher only)
router.delete('/students/:id', authenticateToken, requireRole(['teacher']), async (req, res) => {
  try {
    // Only delete if the student belongs to this teacher
    await prisma.user.deleteMany({ 
      where: { id: parseInt(req.params.id), teacherId: req.user.id } 
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
