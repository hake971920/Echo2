import { useEffect, useState } from 'react';
import {
  Note,
  User,
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  uploadImage,
  createNoteFromUrl,
  getCurrentUser,
  loginUser,
  registerUser,
  updateProfile,
  NoteVersion,
  getNoteVersions,
  rollbackNoteToVersion,
} from './api';
import { KnowledgeGraph } from './KnowledgeGraph';

type ViewMode = 'list' | 'graph';
type AuthMode = 'login' | 'register';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(true);

  const [notes, setNotes] = useState<Note[]>([]);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [useAISearch, setUseAISearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'text' | 'url'>('text');
  const [urlInput, setUrlInput] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({ display_name: '', email: '', bio: '', avatar: '' });
  const [profileMessage, setProfileMessage] = useState('');
  const [editingSelectedNote, setEditingSelectedNote] = useState(false);
  const [selectedNoteContent, setSelectedNoteContent] = useState('');
  const [noteVersions, setNoteVersions] = useState<NoteVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (user) {
      loadNotes();
      setProfileForm({
        display_name: user.display_name,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
      });
    }
  }, [user]);

  useEffect(() => {
    if (selectedNote) {
      setSelectedNoteContent(selectedNote.content);
      setEditingSelectedNote(false);
      loadNoteVersions(selectedNote.id);
    } else {
      setNoteVersions([]);
    }
  }, [selectedNote]);

  const restoreSession = async () => {
    const token = localStorage.getItem('echo2_token');
    if (!token) {
      setAuthLoading(false);
      return;
    }

    try {
      setUser(await getCurrentUser());
    } catch (error) {
      console.error('Failed to restore session:', error);
      localStorage.removeItem('echo2_token');
    } finally {
      setAuthLoading(false);
    }
  };

  const loadNotes = async () => {
    setLoading(true);
    try {
      setNotes(await getNotes());
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNoteVersions = async (noteId: string) => {
    setVersionsLoading(true);
    try {
      setNoteVersions(await getNoteVersions(noteId));
    } catch (error) {
      console.error('Failed to load note versions:', error);
      setNoteVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const result =
        authMode === 'login'
          ? await loginUser(authIdentifier, authPassword)
          : await registerUser({ username: authUsername, email: authEmail, password: authPassword });

      localStorage.setItem('echo2_token', result.token);
      setUser(result.user);
      setAuthPassword('');
    } catch (error) {
      console.error('Authentication failed:', error);
      setAuthError(authMode === 'login' ? '用户名/邮箱或密码不正确' : '注册失败，请检查信息是否已被使用');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('echo2_token');
    setUser(null);
    setNotes([]);
    setSelectedNote(null);
    setProfileOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await createNote(content, images);
      setContent('');
      setImages([]);
      setEditorOpen(false);
      await loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setLoading(true);
    try {
      await createNoteFromUrl(urlInput);
      setUrlInput('');
      setEditorOpen(false);
      setEditorMode('text');
      await loadNotes();
    } catch (error) {
      console.error('Failed to fetch URL:', error);
      alert('无法获取该网页内容，请检查 URL 是否正确');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条笔记吗？')) return;
    try {
      await deleteNote(id);
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleSaveSelectedNote = async () => {
    if (!selectedNote || !selectedNoteContent.trim()) return;
    try {
      const updated = await updateNote(selectedNote.id, { content: selectedNoteContent });
      setSelectedNote(updated);
      setNotes(notes.map((note) => (note.id === updated.id ? updated : note)));
      setEditingSelectedNote(false);
      await loadNoteVersions(updated.id);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleRollbackVersion = async (version: NoteVersion) => {
    if (!selectedNote) return;
    if (!confirm('确定要回滚到这个历史版本吗？当前内容会先保存为一个历史版本。')) return;
    try {
      const restored = await rollbackNoteToVersion(selectedNote.id, version.id);
      setSelectedNote(restored);
      setSelectedNoteContent(restored.content);
      setNotes(notes.map((note) => (note.id === restored.id ? restored : note)));
      setEditingSelectedNote(false);
      await loadNoteVersions(restored.id);
    } catch (error) {
      console.error('Failed to roll back note:', error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      await loadNotes();
      return;
    }

    setSearching(true);
    try {
      setNotes(await searchNotes(searchQuery, useAISearch));
    } catch (error) {
      console.error('Failed to search notes:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImage(file);
      setImages([...images, result.path]);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');
    try {
      const updated = await updateProfile(profileForm);
      setUser(updated);
      setProfileMessage('个人信息已保存');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setProfileMessage('保存失败，请稍后再试');
    }
  };

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setViewMode('list');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const resetEditor = () => {
    setEditorOpen(false);
    setEditorMode('text');
    setContent('');
    setImages([]);
    setUrlInput('');
  };

  if (authLoading && !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">正在加载...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Echo2</h1>
            <p className="text-sm text-gray-500 mt-1">登录后继续管理你的智能笔记</p>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg mb-5">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`py-2 text-sm rounded-md ${authMode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`py-2 text-sm rounded-md ${authMode === 'register' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' ? (
              <>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  placeholder="用户名"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                />
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="邮箱"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </>
            ) : (
              <input
                type="text"
                value={authIdentifier}
                onChange={(e) => setAuthIdentifier(e.target.value)}
                placeholder="用户名或邮箱"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            )}
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              placeholder="密码"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
            {authError && <div className="text-sm text-red-600">{authError}</div>}
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {authLoading ? '处理中...' : authMode === 'login' ? '登录' : '注册并登录'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-800">Echo2</h1>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow text-gray-800' : 'text-gray-600'
                }`}
              >
                笔记列表
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === 'graph' ? 'bg-white shadow text-gray-800' : 'text-gray-600'
                }`}
              >
                知识图谱
              </button>
            </div>

            <button
              onClick={() => setEditorOpen(true)}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              新建笔记
            </button>
            <button
              onClick={() => setProfileOpen(true)}
              className="px-3 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50"
            >
              {user.display_name || user.username}
            </button>
            <button onClick={handleLogout} className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900">
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4">
        {viewMode === 'graph' ? (
          <div className="h-[calc(100vh-120px)]">
            <KnowledgeGraph onSelectNote={handleNoteSelect} />
          </div>
        ) : (
          <>
            <form onSubmit={handleSearch} className="mb-6 flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索笔记内容..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={useAISearch}
                  onChange={(e) => setUseAISearch(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">AI 搜索</span>
              </label>
              <button
                type="submit"
                disabled={searching}
                className="px-5 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                {searching ? '搜索中...' : '搜索'}
              </button>
            </form>

            {notes.length === 0 && !loading ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">还没有笔记</p>
                <p className="text-sm mt-2">点击“新建笔记”开始记录</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className="note-card bg-white rounded-lg border border-gray-200 p-4 cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs text-gray-400">{formatDate(note.created_at)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="删除笔记"
                      >
                        删除
                      </button>
                    </div>

                    <p className="text-gray-800 text-sm whitespace-pre-wrap line-clamp-3 mb-2">
                      {note.content}
                    </p>

                    {note.images.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {note.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded" />
                        ))}
                      </div>
                    )}

                    {note.summary && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-2">
                        {note.summary}
                      </div>
                    )}

                    {note.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {note.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {editorOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">新建笔记</h2>
                <button onClick={resetEditor} className="text-gray-500 hover:text-gray-700">
                  关闭
                </button>
              </div>

              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setEditorMode('text')}
                  className={`flex-1 py-2 text-sm rounded-lg ${
                    editorMode === 'text' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  文本输入
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('url')}
                  className={`flex-1 py-2 text-sm rounded-lg ${
                    editorMode === 'url' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  网页链接
                </button>
              </div>

              {editorMode === 'url' ? (
                <form onSubmit={handleUrlSubmit}>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="输入网页链接，如 https://example.com/article"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">AI 将自动获取网页内容并生成笔记</p>
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={resetEditor} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !urlInput.trim()}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? '获取中...' : '获取'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit}>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="在此记录你的学习内容..."
                    className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />

                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-2">添加图片</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    {images.length > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {images.map((img, i) => (
                          <div key={i} className="relative">
                            <img src={img} alt="" className="w-16 h-16 object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setImages(images.filter((_, j) => j !== i))}
                              className="absolute -top-2 -right-2 min-w-5 h-5 px-1 bg-red-500 text-white rounded-full text-xs"
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={resetEditor} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !content.trim()}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? '保存中...' : '保存'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProfileOpen(false)}>
          <form onSubmit={handleProfileSubmit} className="bg-white rounded-lg max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">个人信息</h2>
              <button type="button" onClick={() => setProfileOpen(false)} className="text-gray-500 hover:text-gray-700">
                关闭
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={profileForm.display_name}
                onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                placeholder="显示名称"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                placeholder="邮箱"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                value={profileForm.avatar}
                onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                placeholder="头像 URL"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                placeholder="个人简介"
                className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            {profileMessage && <div className="text-sm text-gray-600 mt-3">{profileMessage}</div>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setProfileOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                保存
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedNote && !editorOpen && viewMode === 'list' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedNote(null)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold">笔记详情</h2>
                  <div className="text-sm text-gray-500 mt-1">
                    创建：{formatDate(selectedNote.created_at)} · 修改：{formatDate(selectedNote.updated_at)}
                  </div>
                </div>
                <div className="flex gap-2">
                  {editingSelectedNote ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedNoteContent(selectedNote.content);
                          setEditingSelectedNote(false);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSaveSelectedNote}
                        disabled={!selectedNoteContent.trim()}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        保存
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setEditingSelectedNote(true)}
                      className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      编辑
                    </button>
                  )}
                  <button onClick={() => setSelectedNote(null)} className="text-gray-500 hover:text-gray-700">
                    关闭
                  </button>
                </div>
              </div>

              {editingSelectedNote ? (
                <textarea
                  value={selectedNoteContent}
                  onChange={(e) => setSelectedNoteContent(e.target.value)}
                  className="w-full h-56 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                />
              ) : (
                <div className="prose max-w-none mb-4">
                  <p className="whitespace-pre-wrap">{selectedNote.content}</p>
                </div>
              )}

              {selectedNote.images.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {selectedNote.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="max-w-full max-h-60 object-contain rounded-lg" />
                  ))}
                </div>
              )}

              {selectedNote.summary && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm font-medium mb-1">摘要</div>
                  <p className="text-sm text-gray-600">{selectedNote.summary}</p>
                </div>
              )}

              {selectedNote.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-5">
                  {selectedNote.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="border-t border-gray-200 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">修改时间轴</h3>
                  <button
                    onClick={() => loadNoteVersions(selectedNote.id)}
                    className="text-sm text-gray-500 hover:text-gray-800"
                  >
                    刷新
                  </button>
                </div>
                {versionsLoading ? (
                  <div className="text-sm text-gray-500">加载历史中...</div>
                ) : noteVersions.length === 0 ? (
                  <div className="text-sm text-gray-500">还没有历史版本。编辑并保存后会自动生成。</div>
                ) : (
                  <div className="space-y-3">
                    {noteVersions.map((version) => (
                      <div key={version.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div>
                            <div className="text-sm font-medium text-gray-800">{formatDate(version.created_at)}</div>
                            <div className="text-xs text-gray-500">
                              {version.action === 'rollback' ? '回滚前保存的版本' : '编辑前保存的版本'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRollbackVersion(version)}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-100"
                          >
                            回滚到此版本
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{version.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
