
const { z } = require('zod');

// always comes from the verified JWT, never from the request body.
const createNoteSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
  category: z.string().trim().max(50).optional().default('General'),
  isPinned: z.boolean().optional().default(false),
});

// Every field is optional on update, so a client can change just one thing
const updateNoteSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  category: z.string().trim().max(50).optional(),
  isPinned: z.boolean().optional(),
});

module.exports = { createNoteSchema, updateNoteSchema };