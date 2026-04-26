import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('echo2_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Note {
  id: string;
  user_id?: string | null;
  content: string;
  summary: string;
  tags: string[];
  images: string[];
  created_at: string;
  updated_at: string;
  relevance?: number;
}

export interface NoteRelation {
  id: string;
  source_id: string;
  target_id: string;
  weight: number;
  created_at: string;
}

export interface NoteVersion {
  id: string;
  note_id: string;
  user_id: string;
  content: string;
  summary: string;
  tags: string[];
  images: string[];
  action: string;
  created_at: string;
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}): Promise<AuthResponse> {
  const response = await api.post('/auth/register', data);
  return response.data;
}

export async function loginUser(identifier: string, password: string): Promise<AuthResponse> {
  const response = await api.post('/auth/login', { identifier, password });
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function updateProfile(data: Partial<Pick<User, 'email' | 'display_name' | 'bio' | 'avatar'>>): Promise<User> {
  const response = await api.put('/profile', data);
  return response.data;
}

export async function createNote(content: string, images: string[] = []): Promise<Note> {
  const response = await api.post('/notes', { content, images });
  return response.data;
}

export async function getNotes(): Promise<Note[]> {
  const response = await api.get('/notes');
  return response.data;
}

export async function getNote(id: string): Promise<Note> {
  const response = await api.get(`/notes/${id}`);
  return response.data;
}

export async function updateNote(id: string, data: Partial<Note>): Promise<Note> {
  const response = await api.put(`/notes/${id}`, data);
  return response.data;
}

export async function getNoteVersions(id: string): Promise<NoteVersion[]> {
  const response = await api.get(`/notes/${id}/versions`);
  return response.data;
}

export async function rollbackNoteToVersion(id: string, versionId: string): Promise<Note> {
  const response = await api.post(`/notes/${id}/versions/${versionId}/rollback`);
  return response.data;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}

export async function summarizeNote(id: string): Promise<{ summary: string; tags: string[] }> {
  const response = await api.post(`/notes/${id}/summarize`);
  return response.data;
}

export async function searchNotes(query: string, useAI: boolean = false): Promise<Note[]> {
  const response = await api.post('/notes/search', { query, useAI });
  return response.data;
}

export async function uploadImage(file: File): Promise<{ filename: string; path: string }> {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function createRelation(sourceId: string, targetId: string, weight: number = 0.5): Promise<NoteRelation> {
  const response = await api.post('/relations', { sourceId, targetId, weight });
  return response.data;
}

export async function getRelations(): Promise<NoteRelation[]> {
  const response = await api.get('/relations');
  return response.data;
}

export async function getRelationsForNote(noteId: string): Promise<NoteRelation[]> {
  const response = await api.get(`/relations/${noteId}`);
  return response.data;
}

export async function updateRelation(id: string, weight: number): Promise<void> {
  await api.put(`/relations/${id}`, { weight });
}

export async function deleteRelation(id: string): Promise<void> {
  await api.delete(`/relations/${id}`);
}

export async function autoLinkNotes(): Promise<{ count: number; relations: NoteRelation[] }> {
  const response = await api.post('/relations/auto-link');
  return response.data;
}

export async function createNoteFromUrl(url: string): Promise<Note & { title: string }> {
  const response = await api.post('/notes/from-url', { url });
  return response.data;
}
