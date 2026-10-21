// server/src/lib/prisma.js
const { PrismaClient } = require('@prisma/client');

// FIX: one shared client for the whole app. Creating a PrismaClient per route
// file opens a separate connection pool each time, which wastes connections
// on Supabase/Neon free tiers.
const prisma = new PrismaClient();

module.exports = prisma;