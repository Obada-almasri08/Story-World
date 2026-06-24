const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all stories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const stories = await prisma.story.findMany();
    res.json(stories);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add a story (Manager only)
router.post('/', authenticateToken, requireRole(['manager']), upload.single('image'), async (req, res) => {
  const { title, category, text, quizText } = req.body;
  const imagePath = req.file ? `/uploads/images/${req.file.filename}` : null;

  try {
    const story = await prisma.story.create({
      data: { title, category, text, imagePath, quizText }
    });
    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a story (Manager only)
router.delete('/:id', authenticateToken, requireRole(['manager']), async (req, res) => {
  try {
    await prisma.story.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a story (Manager only)
router.put('/:id', authenticateToken, requireRole(['manager']), upload.single('image'), async (req, res) => {
  const { title, category, text, quizText } = req.body;
  const storyId = parseInt(req.params.id);
  const updateData = { title, category, text, quizText };

  if (req.file) {
    updateData.imagePath = `/uploads/images/${req.file.filename}`;
  }

  try {
    const story = await prisma.story.update({
      where: { id: storyId },
      data: updateData
    });
    res.json(story);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
