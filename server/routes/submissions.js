const express = require('express');
const router = express.Router();
const prisma = require('../prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for audio uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/audio');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get submissions (Teachers see their students', students see their own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};
    if (req.user.role === 'teacher') {
      whereClause = { student: { teacherId: req.user.id } };
    } else if (req.user.role === 'student') {
      whereClause = { studentId: req.user.id };
    }

    const submissions = await prisma.submission.findMany({
      where: whereClause,
      include: {
        student: { select: { name: true, grade: true } },
        story: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit a recording (Student only)
router.post('/', authenticateToken, requireRole(['student']), upload.single('audio'), async (req, res) => {
  const { storyId } = req.body;
  if (!req.file) return res.status(400).json({ error: 'ملف الصوت مطلوب' });

  const parsedStoryId = parseInt(storyId);
  const audioPath = `/uploads/audio/${req.file.filename}`;

  try {
    // Check if the student submitted a recording for this story in the last 5 minutes
    const lastSubmission = await prisma.submission.findFirst({
      where: {
        studentId: req.user.id,
        storyId: parsedStoryId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (lastSubmission) {
      const now = new Date();
      const lastTime = new Date(lastSubmission.createdAt);
      const diffMs = now - lastTime;
      const diffMins = diffMs / 1000 / 60;

      if (diffMins < 5) {
        const remainingSecs = Math.ceil(5 * 60 - (diffMs / 1000));
        const mins = Math.floor(remainingSecs / 60);
        const secs = remainingSecs % 60;

        // Delete the uploaded file since we're rejecting the request
        const filePath = path.join(__dirname, '../..', audioPath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        return res.status(400).json({ 
          error: `لقد أرسلت تسجيلاً لهذه القصة مؤخراً. يرجى الانتظار ${mins} دقيقة و ${secs} ثانية قبل الإرسال مجدداً.` 
        });
      }
    }

    const submission = await prisma.submission.create({
      data: {
        studentId: req.user.id,
        storyId: parsedStoryId,
        audioPath
      }
    });
    res.status(201).json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Review a submission (Teacher only)
router.put('/:id/review', authenticateToken, requireRole(['teacher']), async (req, res) => {
  const { rating, note } = req.body;
  
  try {
    const submission = await prisma.submission.update({
      where: { id: parseInt(req.params.id) },
      data: {
        rating,
        note,
        status: 'تم التقييم',
        isRead: false
      }
    });
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark submission as read (Student only)
router.put('/:id/read', authenticateToken, requireRole(['student']), async (req, res) => {
  try {
    await prisma.submission.update({
      where: { id: parseInt(req.params.id) },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a submission (Teacher, Student owner, or Manager)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const submissionId = parseInt(req.params.id);
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { student: true }
    });

    if (!submission) {
      return res.status(404).json({ error: 'التسجيل غير موجود' });
    }

    const isAuthorized = 
      req.user.role === 'manager' ||
      (req.user.role === 'teacher' && submission.student.teacherId === req.user.id) ||
      (req.user.role === 'student' && submission.studentId === req.user.id);

    if (!isAuthorized) {
      return res.status(403).json({ error: 'غير مصرح لك بحذف هذا التسجيل' });
    }

    const filePath = path.join(__dirname, '../..', submission.audioPath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.submission.delete({ where: { id: submissionId } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
