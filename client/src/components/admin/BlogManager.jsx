import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../services/api.js';
import { categoryName } from '../../lib/clinic.js';
import { fmtDate } from '../../lib/format.js';
import { Empty, ErrorNotice, Spinner } from '../Notice.jsx';
import BlogEditor from './BlogEditor.jsx';

export default function BlogManager() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = list, null = new article, string = article id

  const load = useCallback(() => api.get('/admin/blogs').then((r) => setPosts(r.posts)).catch((e) => { setError(e.message); setPosts([]); }), []);
  useEffect(() => { load(); }, [load]);

  const act = async (fn) => { setError(''); try { await fn(); await load(); } catch (e) { setError(e.message); } };
  const remove = (p) => window.confirm(`Delete "${p.title}"? This cannot be undone.`) && act(() => api.delete(`/blogs/${p.id}`));

  if (editing !== undefined) return <BlogEditor id={editing} onClose={() => { setEditing(undefined); load(); }} />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Blog management</h2><button className="btn btn-sm" onClick={() => setEditing(null)}><Plus size={15} /> New article</button></div>
      <ErrorNotice>{error}</ErrorNotice>
      {posts === null ? <Spinner /> : posts.length === 0 ? <Empty>No articles yet. Create your first one.</Empty> : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Title</th><th className="p-3">Category</th><th className="p-3">Status</th><th className="p-3">Updated</th><th className="p-3 text-right">Actions</th></tr></thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-slate-50 last:border-0">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3 text-slate-600">{categoryName(p.category)}</td>
                  <td className="p-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{p.status === 'published' ? 'Published' : 'Draft'}</span></td>
                  <td className="p-3 text-slate-500">{fmtDate(p.updatedAt)}</td>
                  <td className="space-x-2 p-3 text-right">
                    <button className="btn-secondary btn-sm" onClick={() => setEditing(p.id)}>Edit</button>
                    {p.status === 'published'
                      ? <button className="btn-secondary btn-sm" onClick={() => act(() => api.patch(`/blogs/${p.id}/unpublish`))}>Unpublish</button>
                      : <button className="btn btn-sm" onClick={() => act(() => api.patch(`/blogs/${p.id}/publish`))}>Publish</button>}
                    <button className="btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
