import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Bold, Heading2, Heading3, Italic, Link2, List, Upload } from 'lucide-react';
import { api } from '../../services/api.js';
import { CATEGORIES, categoryName } from '../../lib/clinic.js';
import { fmtDate } from '../../lib/format.js';
import { renderMarkdown } from '../../lib/markdown.js';
import { ErrorNotice, Spinner, SuccessNotice } from '../Notice.jsx';

const blank = { title: '', excerpt: '', content: '', coverImage: '', category: '', tags: '', seoTitle: '', seoDescription: '' };
const MAX_IMAGE = 2 * 1024 * 1024;

export default function BlogEditor({ id, onClose }) {
  const [f, setF] = useState(blank);
  const [postId, setPostId] = useState(id);
  const [status, setStatus] = useState('draft');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(Boolean(id));
  const [view, setView] = useState('write');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ error: '', ok: '' });
  const ta = useRef(null);
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/blogs/${id}`)
      .then(({ post }) => { setF({ ...blank, ...post, tags: (post.tags || []).join(', ') }); setStatus(post.status); setSlug(post.slug); })
      .catch((e) => setMsg({ error: e.message, ok: '' }))
      .finally(() => setLoading(false));
  }, [id]);

  const wrap = (before, after = '', placeholder = 'text') => {
  const el = ta.current;
  if (!el) return;

  const { selectionStart: s, selectionEnd: e } = el;
  const sel = f.content.slice(s, e) || placeholder;

  setF((prev) => ({
    ...prev,
    content:
      prev.content.slice(0, s) +
      before +
      sel +
      after +
      prev.content.slice(e),
  }));

  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(
      s + before.length,
      s + before.length + sel.length
    );
  });
};

  const payload = () => ({ ...f, tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean) });
  const save = async ({ publish = false } = {}) => {
    setBusy(true); setMsg({ error: '', ok: '' });
    try {
      let { post } = postId ? await api.patch(`/blogs/${postId}`, payload()) : await api.post('/blogs', payload());
      setPostId(post.id); setSlug(post.slug);
      if (publish) ({ post } = await api.patch(`/blogs/${post.id}/publish`));
      setStatus(post.status);
      setMsg({ error: '', ok: publish ? 'Published. The article is now public.' : 'Saved.' });
    } catch (e) { setMsg({ error: e.message, ok: '' }); } finally { setBusy(false); }
  };
  const unpublish = async () => {
    setBusy(true); setMsg({ error: '', ok: '' });
    try { const { post } = await api.patch(`/blogs/${postId}/unpublish`); setStatus(post.status); setMsg({ error: '', ok: 'Unpublished. The article is now a private draft.' }); }
    catch (e) { setMsg({ error: e.message, ok: '' }); } finally { setBusy(false); }
  };

  const upload = async (file) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setMsg({ error: 'Use a JPG, PNG or WebP image.', ok: '' });
    if (file.size > MAX_IMAGE) return setMsg({ error: 'Images must be under 2 MB.', ok: '' });
    setUploading(true); setMsg({ error: '', ok: '' });
    try {
      const sig = await api.post('/uploads/blog-image/sign'); // 503 with a clear message if Cloudinary is not configured
      const fd = new FormData();
      fd.append('file', file);
      ['api_key:apiKey', 'timestamp:timestamp', 'signature:signature', 'folder:folder', 'allowed_formats:allowed_formats'].forEach((p) => { const [k, v] = p.split(':'); fd.append(k, sig[v]); });
      const res = await fetch(sig.uploadUrl, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
      setF((x) => ({ ...x, coverImage: data.secure_url }));
    } catch (e) { setMsg({ error: e.message, ok: '' }); } finally { setUploading(false); }
  };

  const { html } = renderMarkdown(f.content);
  if (loading) return <Spinner />;
  const tool = (Icon, label, fn) => <button type="button" className="btn-secondary btn-sm" aria-label={label} title={label} onClick={fn}><Icon size={15} /></button>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className="btn-secondary btn-sm" onClick={onClose}><ArrowLeft size={14} /> All articles</button>
        <div className="flex items-center gap-2 text-sm">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{status === 'published' ? 'Published' : 'Draft'}</span>
          {slug && status === 'published' && <a className="font-semibold text-brand-700 hover:underline" href={`/blogs/${slug}`} target="_blank" rel="noopener noreferrer">View live</a>}
        </div>
      </div>
      <ErrorNotice>{msg.error}</ErrorNotice><SuccessNotice>{msg.ok}</SuccessNotice>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="panel space-y-4 p-5">
            <div><label className="label" htmlFor="b-title">Title</label><input id="b-title" className="field" maxLength={160} value={f.title} onChange={set('title')} /></div>
            <div><label className="label" htmlFor="b-excerpt">Excerpt <span className="font-normal text-slate-400">({f.excerpt.length}/300)</span></label><textarea id="b-excerpt" rows={2} maxLength={300} className="field" value={f.excerpt} onChange={set('excerpt')} /></div>
          </div>
          <div className="panel p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1" role="tablist">
                {['write', 'preview'].map((v) => <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${view === v ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{v}</button>)}
              </div>
              {view === 'write' && <div className="flex gap-1">
                {tool(Heading2, 'Heading', () => wrap('\n## ', '\n', 'Heading'))}{tool(Heading3, 'Subheading', () => wrap('\n### ', '\n', 'Subheading'))}
                {tool(Bold, 'Bold', () => wrap('**', '**'))}{tool(Italic, 'Italic', () => wrap('*', '*'))}
                {tool(List, 'Bulleted list', () => wrap('\n- ', '\n', 'List item'))}{tool(Link2, 'Link', () => wrap('[', '](https://)', 'link text'))}
              </div>}
            </div>
            {view === 'write'
              ? <textarea ref={ta} rows={18} aria-label="Article content (Markdown)" className="field font-mono text-sm" placeholder="Write in Markdown. Use ## for section headings; they become the table of contents." value={f.content} onChange={set('content')} />
              : (
                <div className="rounded-xl border border-slate-100 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Preview · {f.category ? categoryName(f.category) : 'No category'} · {fmtDate(new Date())}</p>
                  <h2 className="mt-2 text-3xl font-extrabold text-ink">{f.title || 'Untitled'}</h2>
                  {f.coverImage && <img src={f.coverImage} alt="" className="mt-4 max-h-72 w-full rounded-2xl object-cover" />}
                  <div className="prose-blog" dangerouslySetInnerHTML={{ __html: html || '<p>Nothing to preview yet.</p>' }} />
                </div>
              )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel space-y-4 p-5">
            <div><label className="label" htmlFor="b-cat">Category</label>
              <select id="b-cat" className="field" value={f.category} onChange={set('category')}><option value="">Choose…</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
            <div><label className="label" htmlFor="b-tags">Tags <span className="font-normal text-slate-400">(comma separated)</span></label><input id="b-tags" className="field" value={f.tags} onChange={set('tags')} /></div>
            <div>
              <label className="label" htmlFor="b-cover">Cover image URL</label>
              <input id="b-cover" className="field" placeholder="https://…" value={f.coverImage} onChange={set('coverImage')} />
              <label className="btn-secondary btn-sm mt-2 cursor-pointer"><Upload size={14} /> {uploading ? 'Uploading…' : 'Upload image'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => { upload(e.target.files[0]); e.target.value = ''; }} /></label>
              {f.coverImage && <img src={f.coverImage} alt="Cover preview" className="mt-3 aspect-video w-full rounded-xl object-cover" />}
            </div>
          </div>
          <div className="panel space-y-4 p-5">
            <h3 className="font-bold">SEO</h3>
            <div><label className="label" htmlFor="b-st">SEO title <span className="font-normal text-slate-400">({f.seoTitle.length}/70)</span></label><input id="b-st" maxLength={70} className="field" value={f.seoTitle} onChange={set('seoTitle')} /></div>
            <div><label className="label" htmlFor="b-sd">SEO description <span className="font-normal text-slate-400">({f.seoDescription.length}/160)</span></label><textarea id="b-sd" rows={3} maxLength={160} className="field" value={f.seoDescription} onChange={set('seoDescription')} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
  {status === 'published' ? (
    <>
      <button
        className="btn"
        disabled={busy || uploading}
        onClick={() => save()}
      >
        Update article
      </button>

      <button
        className="btn-danger"
        disabled={busy || uploading}
        onClick={unpublish}
      >
        Unpublish
      </button>
    </>
  ) : (
    <>
      <button
        className="btn-secondary"
        disabled={busy || uploading}
        onClick={() => save()}
      >
        Save draft
      </button>

      <button
        className="btn"
        disabled={busy || uploading}
        onClick={() => save({ publish: true })}
      >
        Publish
      </button>
    </>
  )}
</div>
        </div>
      </div>
    </div>
  );
}
