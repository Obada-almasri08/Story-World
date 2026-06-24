const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get favorites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: { story: true }
    });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle favorite
router.post('/:storyId', authenticateToken, async (req, res) => {
  const storyId = parseInt(req.params.storyId);
  const userId = req.user.id;

  try {
    const existing = await prisma.favorite.findUnique({
      where: { userId_storyId: { userId, storyId } }
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id }
      });
      res.json({ status: 'removed' });
    } else {
      await prisma.favorite.create({
        data: { userId, storyId }
      });
      res.json({ status: 'added' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
