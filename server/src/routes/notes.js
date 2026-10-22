
const express = require('express');
const prisma = require('../lib/prisma');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createNoteSchema, updateNoteSchema } = require('../validators/notes');

const router = express.Router();

// Protect every endpoint in this router with authentication.
router.use(authenticate);

// Validate note IDs before they reach database queries.
router.param('id', (req, res, next, value) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0 || id > 2147483647) {
    return res.status(400).json({ error: 'Invalid note ID' });
  }
  req.noteId = id;
  next();
});

// Verify that the note exists and belongs to the authenticated user.
async function getOwnedNote(req, res, action) {
  const note = await prisma.note.findUnique({ where: { id: req.noteId } });

  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return null;
  }

  if (note.userId !== req.user.userId) {
    res.status(403).json({ error: `You do not have permission to ${action} this note` });
    return null;
  }

  return note;
}

// GET /api/notes -- retrieve the user's notes with search, filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { search, category, sortBy = 'updatedAt', order = 'desc' } = req.query;

    // Scope all note results to the authenticated user.
    const where = { userId: req.user.userId };

    if (typeof category === 'string' && category.trim()) {
      where.category = category.trim();
    }

    if (typeof search === 'string' && search.trim()) {
      const term = search.trim().slice(0, 100);

      // Match the search term against either the title or content.
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Allow sorting only by approved fields.
    const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'updatedAt';

    const notes = await prisma.note.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' }, 
        { [sortField]: order === 'asc' ? 'asc' : 'desc' },
      ],
    });

    // Retrieve distinct categories belonging to the authenticated user.
    const categories = await prisma.note.findMany({
      where: { userId: req.user.userId },
      select: { category: true },
      distinct: ['category'],
    });

    res.json({
      notes,
      total: notes.length,
      categories: categories.map((c) => c.category),
    });
  } catch (error) {
    console.error('Fetch notes error:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST /api/notes -- create a note
router.post('/', validate(createNoteSchema), async (req, res) => {
  try {
    const { title, content, category, isPinned } = req.body;

    const note = await prisma.note.create({
      data: {
        title,
        content,
        category,
        isPinned,
        userId: req.user.userId, 
      },
    });

    res.status(201).json({ note });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// GET /api/notes/:id -- retrieve a specific note owned by the user
router.get('/:id', async (req, res) => {
  try {
    const note = await getOwnedNote(req, res, 'view');
    if (!note) return;

    res.json({ note });
  } catch (error) {
    console.error('Fetch note error:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// PUT /api/notes/:id -- update a note owned by the user
router.put('/:id', validate(updateNoteSchema), async (req, res) => {
  try {
    const note = await getOwnedNote(req, res, 'edit');
    if (!note) return;

    const updatedNote = await prisma.note.update({
      where: { id: req.noteId },
      data: req.body,
    });

    res.json({ note: updatedNote });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE /api/notes/:id -- delete a note owned by the user
router.delete('/:id', async (req, res) => {
  try {
    const note = await getOwnedNote(req, res, 'delete');
    if (!note) return;

    await prisma.note.delete({ where: { id: req.noteId } });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// PATCH /api/notes/:id/pin -- toggle the pin status of a note
router.patch('/:id/pin', async (req, res) => {
  try {
    const note = await getOwnedNote(req, res, 'pin');
    if (!note) return;

    const updatedNote = await prisma.note.update({
      where: { id: req.noteId },
      data: { isPinned: !note.isPinned },
    });

    res.json({ note: updatedNote });
  } catch (error) {
    console.error('Toggle pin error:', error);
    res.status(500).json({ error: 'Failed to toggle pin' });
  }
});

module.exports = router;
