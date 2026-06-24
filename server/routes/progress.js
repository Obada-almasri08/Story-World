const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all progress for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const progress = await prisma.progress.findMany({
      where: { userId: req.user.id }
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update progress
router.put('/:storyId', authenticateToken, async (req, res) => {
  const storyId = parseInt(req.params.storyId);
  const userId = req.user.id;
  const { percentage } = req.body;

  try {
    const progress = await prisma.progress.upsert({
      where: { userId_storyId: { userId, storyId } },
      update: { percentage: Math.max(percentage, 0) }, // Prevent lowering if needed, but for now just update
      create: { userId, storyId, percentage }
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
