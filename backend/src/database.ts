import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

let db: Database | null = null;

const dbPath = path.join(__dirname, '..', 'data', 'echo2.db');
const noteColumns = 'id, user_id, content, summary, tags, images, created_at, updated_at, deleted_at';

export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const data = fs.readFileSync(dbPath);
    db = new SQL.Database(data);
  } else {
    db = new SQL.Database();
  }

  db!.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      avatar TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  db!.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      content TEXT NOT NULL,
      summary TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      images TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  ensureColumn('notes', 'user_id', 'TEXT');

  db!.run(`
    CREATE TABLE IF NOT EXISTS note_relations (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      weight REAL DEFAULT 0.5,
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_id) REFERENCES notes(id),
      FOREIGN KEY (target_id) REFERENCES notes(id),
      UNIQUE(source_id, target_id)
    )
  `);

  db!.run(`
    CREATE TABLE IF NOT EXISTS note_versions (
      id TEXT PRIMARY KEY,
      note_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      summary TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      images TEXT DEFAULT '[]',
      action TEXT DEFAULT 'edit',
      created_at TEXT NOT NULL,
      FOREIGN KEY (note_id) REFERENCES notes(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  saveDatabase();
}

function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dbPath, buffer);
}

function ensureColumn(table: string, column: string, definition: string): void {
  if (!db) return;
  const result = db.exec(`PRAGMA table_info(${table})`);
  const hasColumn = result.length > 0 && result[0].values.some((row) => row[1] === column);
  if (!hasColumn) {
    db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  bio: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export type PublicUser = Omit<User, 'password_hash'>;

function rowToUser(row: unknown[]): User {
  return {
    id: row[0] as string,
    username: row[1] as string,
    email: row[2] as string,
    password_hash: row[3] as string,
    display_name: row[4] as string,
    bio: row[5] as string,
    avatar: row[6] as string,
    created_at: row[7] as string,
    updated_at: row[8] as string,
  };
}

export function toPublicUser(user: User): PublicUser {
  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function createUser(user: Pick<User, 'id' | 'username' | 'email' | 'password_hash' | 'display_name'>): PublicUser {
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO users (id, username, email, password_hash, display_name, bio, avatar, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, '', '', ?, ?)`,
    [user.id, user.username, user.email, user.password_hash, user.display_name, now, now]
  );
  saveDatabase();
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    bio: '',
    avatar: '',
    created_at: now,
    updated_at: now,
  };
}

export function getUserById(id: string): User | undefined {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const user = rowToUser(stmt.get());
    stmt.free();
    return user;
  }
  stmt.free();
  return undefined;
}

export function getUserByUsernameOrEmail(identifier: string): User | undefined {
  if (!db) throw new Error('Database not initialized');
  const normalized = identifier.trim().toLowerCase();
  const stmt = db.prepare('SELECT * FROM users WHERE lower(username) = ? OR lower(email) = ?');
  stmt.bind([normalized, normalized]);
  if (stmt.step()) {
    const user = rowToUser(stmt.get());
    stmt.free();
    return user;
  }
  stmt.free();
  return undefined;
}

export function updateUserProfile(
  id: string,
  updates: Partial<Pick<User, 'display_name' | 'bio' | 'avatar' | 'email'>>
): PublicUser | undefined {
  if (!db) throw new Error('Database not initialized');
  const user = getUserById(id);
  if (!user) return undefined;
  const now = new Date().toISOString();
  const email = updates.email ?? user.email;
  const displayName = updates.display_name ?? user.display_name;
  const bio = updates.bio ?? user.bio;
  const avatar = updates.avatar ?? user.avatar;

  db.run(
    'UPDATE users SET email = ?, display_name = ?, bio = ?, avatar = ?, updated_at = ? WHERE id = ?',
    [email, displayName, bio, avatar, now, id]
  );
  saveDatabase();
  const updated = getUserById(id);
  return updated ? toPublicUser(updated) : undefined;
}

export interface Note {
  id: string;
  user_id: string | null;
  content: string;
  summary: string;
  tags: string;
  images: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NoteVersion {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  summary: string;
  tags: string;
  images: string;
  action: string;
  created_at: string;
}

function rowToNote(row: unknown[]): Note {
  return {
    id: row[0] as string,
    user_id: row[1] as string | null,
    content: row[2] as string,
    summary: row[3] as string,
    tags: row[4] as string,
    images: row[5] as string,
    created_at: row[6] as string,
    updated_at: row[7] as string,
    deleted_at: row[8] as string | null,
  };
}

function rowToNoteVersion(row: unknown[]): NoteVersion {
  return {
    id: row[0] as string,
    note_id: row[1] as string,
    user_id: row[2] as string,
    content: row[3] as string,
    summary: row[4] as string,
    tags: row[5] as string,
    images: row[6] as string,
    action: row[7] as string,
    created_at: row[8] as string,
  };
}

function createNoteVersion(note: Note, action: string = 'edit'): NoteVersion {
  if (!db) throw new Error('Database not initialized');
  if (!note.user_id) throw new Error('Cannot version note without user');
  const version: NoteVersion = {
    id: uuidv4(),
    note_id: note.id,
    user_id: note.user_id,
    content: note.content,
    summary: note.summary,
    tags: note.tags,
    images: note.images,
    action,
    created_at: new Date().toISOString(),
  };

  db.run(
    `INSERT INTO note_versions (id, note_id, user_id, content, summary, tags, images, action, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [version.id, version.note_id, version.user_id, version.content, version.summary, version.tags, version.images, version.action, version.created_at]
  );
  return version;
}

export function createNote(note: Omit<Note, 'created_at' | 'updated_at' | 'deleted_at'>): Note {
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  db.run(
    `INSERT INTO notes (id, user_id, content, summary, tags, images, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [note.id, note.user_id, note.content, note.summary, note.tags, note.images, now, now]
  );
  saveDatabase();
  return { ...note, created_at: now, updated_at: now, deleted_at: null };
}

export function getAllNotes(userId: string): Note[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(`SELECT ${noteColumns} FROM notes WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`);
  stmt.bind([userId]);
  const notes: Note[] = [];
  while (stmt.step()) {
    notes.push(rowToNote(stmt.get()));
  }
  stmt.free();
  return notes;
}

export function getNoteById(id: string, userId: string): Note | undefined {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(`SELECT ${noteColumns} FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL`);
  stmt.bind([id, userId]);
  if (stmt.step()) {
    const row = stmt.get();
    stmt.free();
    return rowToNote(row);
  }
  stmt.free();
  return undefined;
}

export function updateNote(id: string, userId: string, updates: Partial<Pick<Note, 'content' | 'summary' | 'tags' | 'images'>>): boolean {
  if (!db) throw new Error('Database not initialized');
  const note = getNoteById(id, userId);
  if (!note) return false;
  const now = new Date().toISOString();
  
  const content = updates.content ?? note.content;
  const summary = updates.summary ?? note.summary;
  const tags = updates.tags ?? note.tags;
  const images = updates.images ?? note.images;

  if (content !== note.content || summary !== note.summary || tags !== note.tags || images !== note.images) {
    createNoteVersion(note, 'edit');
  }
  
  db.run(
    `UPDATE notes SET content = ?, summary = ?, tags = ?, images = ?, updated_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [content, summary, tags, images, now, id, userId]
  );
  saveDatabase();
  return true;
}

export function getNoteVersions(noteId: string, userId: string): NoteVersion[] {
  if (!db) throw new Error('Database not initialized');
  if (!getNoteById(noteId, userId)) return [];
  const stmt = db.prepare(`
    SELECT id, note_id, user_id, content, summary, tags, images, action, created_at
    FROM note_versions
    WHERE note_id = ? AND user_id = ?
    ORDER BY created_at DESC
  `);
  stmt.bind([noteId, userId]);
  const versions: NoteVersion[] = [];
  while (stmt.step()) {
    versions.push(rowToNoteVersion(stmt.get()));
  }
  stmt.free();
  return versions;
}

export function rollbackNoteToVersion(noteId: string, userId: string, versionId: string): Note | undefined {
  if (!db) throw new Error('Database not initialized');
  const note = getNoteById(noteId, userId);
  if (!note) return undefined;

  const stmt = db.prepare(`
    SELECT id, note_id, user_id, content, summary, tags, images, action, created_at
    FROM note_versions
    WHERE id = ? AND note_id = ? AND user_id = ?
  `);
  stmt.bind([versionId, noteId, userId]);
  if (!stmt.step()) {
    stmt.free();
    return undefined;
  }
  const version = rowToNoteVersion(stmt.get());
  stmt.free();

  createNoteVersion(note, 'rollback');
  const now = new Date().toISOString();
  db.run(
    `UPDATE notes SET content = ?, summary = ?, tags = ?, images = ?, updated_at = ?
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [version.content, version.summary, version.tags, version.images, now, noteId, userId]
  );
  saveDatabase();
  return getNoteById(noteId, userId);
}

export function deleteNote(id: string, userId: string): boolean {
  if (!db) throw new Error('Database not initialized');
  const now = new Date().toISOString();
  db.run('UPDATE notes SET deleted_at = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL', [now, id, userId]);
  const changes = db.getRowsModified();
  saveDatabase();
  return changes > 0;
}

export function searchNotes(query: string, userId: string): Note[] {
  if (!db) throw new Error('Database not initialized');
  const pattern = `%${query}%`;
  const stmt = db.prepare(`
    SELECT ${noteColumns} FROM notes 
    WHERE user_id = ?
    AND deleted_at IS NULL 
    AND (content LIKE ? OR summary LIKE ? OR tags LIKE ?)
    ORDER BY created_at DESC
  `);
  stmt.bind([userId, pattern, pattern, pattern]);
  
  const notes: Note[] = [];
  while (stmt.step()) {
    notes.push(rowToNote(stmt.get()));
  }
  stmt.free();
  return notes;
}

export interface NoteRelation {
  id: string;
  source_id: string;
  target_id: string;
  weight: number;
  created_at: string;
}

function rowToRelation(row: unknown[]): NoteRelation {
  return {
    id: row[0] as string,
    source_id: row[1] as string,
    target_id: row[2] as string,
    weight: row[3] as number,
    created_at: row[4] as string,
  };
}

export function createRelation(userId: string, sourceId: string, targetId: string, weight: number = 0.5): NoteRelation | null {
  if (!db) throw new Error('Database not initialized');
  if (sourceId === targetId) return null;
  if (!getNoteById(sourceId, userId) || !getNoteById(targetId, userId)) return null;
  
  const existingStmt = db.prepare('SELECT * FROM note_relations WHERE (source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?)');
  existingStmt.bind([sourceId, targetId, targetId, sourceId]);
  if (existingStmt.step()) {
    existingStmt.free();
    return null;
  }
  existingStmt.free();

  const id = uuidv4();
  const now = new Date().toISOString();
  db.run('INSERT INTO note_relations (id, source_id, target_id, weight, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, sourceId, targetId, weight, now]);
  saveDatabase();
  return { id, source_id: sourceId, target_id: targetId, weight, created_at: now };
}

export function getRelationsForNote(noteId: string, userId: string): NoteRelation[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(`
    SELECT r.* FROM note_relations r
    JOIN notes s ON s.id = r.source_id
    JOIN notes t ON t.id = r.target_id
    WHERE (r.source_id = ? OR r.target_id = ?)
      AND s.user_id = ?
      AND t.user_id = ?
      AND s.deleted_at IS NULL
      AND t.deleted_at IS NULL
  `);
  stmt.bind([noteId, noteId, userId, userId]);
  
  const relations: NoteRelation[] = [];
  while (stmt.step()) {
    relations.push(rowToRelation(stmt.get()));
  }
  stmt.free();
  return relations;
}

export function getAllRelations(userId: string): NoteRelation[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(`
    SELECT r.* FROM note_relations r
    JOIN notes s ON s.id = r.source_id
    JOIN notes t ON t.id = r.target_id
    WHERE s.user_id = ?
      AND t.user_id = ?
      AND s.deleted_at IS NULL
      AND t.deleted_at IS NULL
  `);
  stmt.bind([userId, userId]);
  const relations: NoteRelation[] = [];
  while (stmt.step()) {
    relations.push(rowToRelation(stmt.get()));
  }
  stmt.free();
  return relations;
}

export function updateRelation(id: string, userId: string, weight: number): boolean {
  if (!db) throw new Error('Database not initialized');
  db.run(
    `UPDATE note_relations SET weight = ?
     WHERE id = ?
       AND source_id IN (SELECT id FROM notes WHERE user_id = ?)
       AND target_id IN (SELECT id FROM notes WHERE user_id = ?)`,
    [weight, id, userId, userId]
  );
  const changes = db.getRowsModified();
  saveDatabase();
  return changes > 0;
}

export function deleteRelation(id: string, userId: string): boolean {
  if (!db) throw new Error('Database not initialized');
  db.run(
    `DELETE FROM note_relations
     WHERE id = ?
       AND source_id IN (SELECT id FROM notes WHERE user_id = ?)
       AND target_id IN (SELECT id FROM notes WHERE user_id = ?)`,
    [id, userId, userId]
  );
  const changes = db.getRowsModified();
  saveDatabase();
  return changes > 0;
}

export async function autoLinkNotes(userId: string): Promise<NoteRelation[]> {
  if (!db) throw new Error('Database not initialized');
  const notes = getAllNotes(userId);
  const newRelations: NoteRelation[] = [];
  
  for (let i = 0; i < notes.length; i++) {
    for (let j = i + 1; j < notes.length; j++) {
      const note1 = notes[i];
      const note2 = notes[j];
      
      const sharedTags = JSON.parse(note1.tags).filter((t: string) => 
        JSON.parse(note2.tags).includes(t)
      );
      
      if (sharedTags.length > 0) {
        const existingStmt = db.prepare('SELECT * FROM note_relations WHERE (source_id = ? AND target_id = ?) OR (source_id = ? AND target_id = ?)');
        existingStmt.bind([note1.id, note2.id, note2.id, note1.id]);
        if (!existingStmt.step()) {
          existingStmt.free();
          const weight = Math.min(0.3 + sharedTags.length * 0.2, 1.0);
          const relation = createRelation(userId, note1.id, note2.id, weight);
          if (relation) newRelations.push(relation);
        } else {
          existingStmt.free();
        }
      }
    }
  }
  
  return newRelations;
}
