import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import crypto from 'crypto';

import { initDatabase, createNote, getAllNotes, getNoteById, updateNote, deleteNote, searchNotes, 
  createRelation, getRelationsForNote, getAllRelations, updateRelation, deleteRelation, autoLinkNotes, Note,
  createUser, getUserById, getUserByUsernameOrEmail, toPublicUser, updateUserProfile, PublicUser,
  getNoteVersions, rollbackNoteToVersion } from './database';
import { summarizeContent, aiSearch, summarizeUrl } from './deepseek';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

const authSecret = process.env.AUTH_SECRET || 'echo2-development-secret-change-me';

interface AuthenticatedRequest extends express.Request {
  user?: PublicUser;
}

function signToken(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ userId, iat: Date.now() }), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token: string): string | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', authSecret).update(payload).digest('base64url');
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { userId?: string };
    return data.userId || null;
  } catch {
    return null;
  }
}

function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return Promise.resolve(false);

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      const expected = Buffer.from(hash, 'hex');
      resolve(expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey));
    });
  });
}

function requireAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
  const userId = token ? verifyToken(token) : null;
  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Invalid user' });
  }
  req.user = toPublicUser(user);
  next();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;
    const cleanUsername = String(username || '').trim();
    const cleanEmail = normalizeEmail(String(email || ''));
    const cleanPassword = String(password || '');

    if (cleanUsername.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (cleanPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    if (getUserByUsernameOrEmail(cleanUsername) || getUserByUsernameOrEmail(cleanEmail)) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const user = createUser({
      id: uuidv4(),
      username: cleanUsername,
      email: cleanEmail,
      password_hash: await hashPassword(cleanPassword),
      display_name: String(displayName || cleanUsername).trim(),
    });
    res.json({ token: signToken(user.id), user });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = getUserByUsernameOrEmail(String(identifier || ''));
    if (!user || !(await verifyPassword(String(password || ''), user.password_hash))) {
      return res.status(401).json({ error: 'Invalid username/email or password' });
    }
    res.json({ token: signToken(user.id), user: toPublicUser(user) });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(req.user);
});

app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const email = req.body.email !== undefined ? normalizeEmail(String(req.body.email)) : undefined;
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (email) {
      const existingUser = getUserByUsernameOrEmail(email);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    const updatedUser = updateUserProfile(req.user!.id, {
      email,
      display_name: req.body.display_name !== undefined ? String(req.body.display_name).trim() : undefined,
      bio: req.body.bio !== undefined ? String(req.body.bio).trim() : undefined,
      avatar: req.body.avatar !== undefined ? String(req.body.avatar).trim() : undefined,
    });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ filename: req.file.filename, path: `/uploads/${req.file.filename}` });
});

app.get('/uploads/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

app.post('/api/notes', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, images = [] } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const aiResult = await summarizeContent(content);
    const note = createNote({
      id: uuidv4(),
      user_id: req.user!.id,
      content,
      summary: aiResult.summary,
      tags: JSON.stringify(aiResult.tags),
      images: JSON.stringify(images),
    });

    res.json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.post('/api/notes/from-url', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const aiResult = await summarizeUrl(url);
    const note = createNote({
      id: uuidv4(),
      user_id: req.user!.id,
      content: aiResult.content,
      summary: aiResult.summary,
      tags: JSON.stringify(aiResult.tags),
      images: JSON.stringify([]),
    });

    res.json({
      ...note,
      title: aiResult.title,
      url,
    });
  } catch (error) {
    console.error('Error creating note from URL:', error);
    res.status(500).json({ error: 'Failed to fetch and summarize URL' });
  }
});

app.get('/api/notes', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const notes = getAllNotes(req.user!.id);
    const parsedNotes = notes.map((note) => ({
      ...note,
      tags: JSON.parse(note.tags),
      images: JSON.parse(note.images),
    }));
    res.json(parsedNotes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.get('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const note = getNoteById(req.params.id, req.user!.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({
      ...note,
      tags: JSON.parse(note.tags),
      images: JSON.parse(note.images),
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

app.put('/api/notes/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { content, summary, tags, images } = req.body;
    const updates: Partial<Pick<Note, 'content' | 'summary' | 'tags' | 'images'>> = {};

    if (content !== undefined) updates.content = content;
    if (summary !== undefined) updates.summary = summary;
    if (tags !== undefined) updates.tags = JSON.stringify(tags);
    if (images !== undefined) updates.images = JSON.stringify(images);

    const success = updateNote(req.params.id, req.user!.id, updates);
    if (!success) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const note = getNoteById(req.params.id, req.user!.id);
    res.json({
      ...note,
      tags: JSON.parse(note!.tags),
      images: JSON.parse(note!.images),
    });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

app.get('/api/notes/:id/versions', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const note = getNoteById(req.params.id, req.user!.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    const versions = getNoteVersions(req.params.id, req.user!.id).map((version) => ({
      ...version,
      tags: JSON.parse(version.tags),
      images: JSON.parse(version.images),
    }));
    res.json(versions);
  } catch (error) {
    console.error('Error fetching note versions:', error);
    res.status(500).json({ error: 'Failed to fetch note versions' });
  }
});

app.post('/api/notes/:id/versions/:versionId/rollback', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const note = rollbackNoteToVersion(req.params.id, req.user!.id, req.params.versionId);
    if (!note) {
      return res.status(404).json({ error: 'Version not found' });
    }
    res.json({
      ...note,
      tags: JSON.parse(note.tags),
      images: JSON.parse(note.images),
    });
  } catch (error) {
    console.error('Error rolling back note:', error);
    res.status(500).json({ error: 'Failed to roll back note' });
  }
});

app.delete('/api/notes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const success = deleteNote(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.post('/api/notes/:id/summarize', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const note = getNoteById(req.params.id, req.user!.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const aiResult = await summarizeContent(note.content);
    updateNote(req.params.id, req.user!.id, {
      summary: aiResult.summary,
      tags: JSON.stringify(aiResult.tags),
    });

    res.json(aiResult);
  } catch (error) {
    console.error('Error summarizing note:', error);
    res.status(500).json({ error: 'Failed to summarize note' });
  }
});

app.post('/api/notes/search', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { query, useAI = false } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (useAI) {
      const notes = getAllNotes(req.user!.id);
      const results = await aiSearch(query, notes);
      const noteMap = new Map(notes.map((n) => [n.id, n]));
      const sortedNotes = results
        .filter((r) => noteMap.has(r.note))
        .map((r) => {
          const note = noteMap.get(r.note)!;
          return {
            ...note,
            tags: JSON.parse(note.tags),
            images: JSON.parse(note.images),
            relevance: r.relevance,
          };
        });
      res.json(sortedNotes);
    } else {
      const notes = searchNotes(query, req.user!.id);
      res.json(
        notes.map((note) => ({
          ...note,
          tags: JSON.parse(note.tags),
          images: JSON.parse(note.images),
        }))
      );
    }
  } catch (error) {
    console.error('Error searching notes:', error);
    res.status(500).json({ error: 'Failed to search notes' });
  }
});

app.post('/api/relations', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { sourceId, targetId, weight = 0.5 } = req.body;
    if (!sourceId || !targetId) {
      return res.status(400).json({ error: 'sourceId and targetId are required' });
    }
    const relation = createRelation(req.user!.id, sourceId, targetId, weight);
    if (!relation) {
      return res.status(400).json({ error: 'Relation already exists' });
    }
    res.json(relation);
  } catch (error) {
    console.error('Error creating relation:', error);
    res.status(500).json({ error: 'Failed to create relation' });
  }
});

app.get('/api/relations', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const relations = getAllRelations(req.user!.id);
    res.json(relations);
  } catch (error) {
    console.error('Error fetching relations:', error);
    res.status(500).json({ error: 'Failed to fetch relations' });
  }
});

app.get('/api/relations/:noteId', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const relations = getRelationsForNote(req.params.noteId, req.user!.id);
    res.json(relations);
  } catch (error) {
    console.error('Error fetching relations:', error);
    res.status(500).json({ error: 'Failed to fetch relations' });
  }
});

app.put('/api/relations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { weight } = req.body;
    if (weight === undefined) {
      return res.status(400).json({ error: 'weight is required' });
    }
    const success = updateRelation(req.params.id, req.user!.id, weight);
    if (!success) {
      return res.status(404).json({ error: 'Relation not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating relation:', error);
    res.status(500).json({ error: 'Failed to update relation' });
  }
});

app.delete('/api/relations/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const success = deleteRelation(req.params.id, req.user!.id);
    if (!success) {
      return res.status(404).json({ error: 'Relation not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting relation:', error);
    res.status(500).json({ error: 'Failed to delete relation' });
  }
});

app.post('/api/relations/auto-link', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const newRelations = await autoLinkNotes(req.user!.id);
    res.json({ count: newRelations.length, relations: newRelations });
  } catch (error) {
    console.error('Error auto-linking notes:', error);
    res.status(500).json({ error: 'Failed to auto-link notes' });
  }
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
