import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../services/api.js';
import { CATEGORIES } from '../lib/clinic.js';
import { useMeta } from '../lib/seo.js';
import BlogCard from '../components/site/BlogCard.jsx';
import { PageHero, Section } from '../components/site/ui.jsx';
import { Empty, ErrorNotice, Spinner } from '../components/Notice.jsx';

export default function Blogs() {
  useMeta({ title: 'Blog · Tulasi HealthConnect', description: 'Articles on mental health, therapy, stress, sleep and emotional well-being.' });
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');
  const [cats, setCats] = useState(CATEGORIES);
  const [s, setS] = useState({ posts: [], page: 1, pages: 1, loading: true, error: '' });
  const reqId = useRef(0);

  useEffect(() => { const t = setTimeout(() => setTerm(q.trim()), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { api.get('/categories').then((r) => setCats(r.categories)).catch(() => {}); }, []);

  const load = useCallback((page, replace) => {
    const id = ++reqId.current; // ignore out-of-order responses
    setS((x) => ({ ...x, loading: true, error: '' }));
    const qs = new URLSearchParams({ page, limit: 9, ...(term && { q: term }), ...(category && { category }) });
    api.get(`/blogs?${qs}`)
      .then((r) => id === reqId.current && setS((x) => ({ posts: replace ? r.posts : [...x.posts, ...r.posts], page: r.page, pages: r.pages, loading: false, error: '' })))
      .catch((e) => id === reqId.current && setS((x) => ({ ...x, loading: false, error: e.message })));
  }, [term, category]);
  useEffect(() => { load(1, true); }, [load]);

  const filtered = Boolean(term || category);
  const [featured, ...rest] = filtered ? [null, ...s.posts] : s.posts;
  const chip = (active) => `rounded-full px-3.5 py-1.5 text-sm font-medium ${active ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`;

  return (
    <>
      <PageHero eyebrow="Blog" title="Health resources & insights">Practical, thoughtful articles on mental health and well-being.</PageHero>
      <Section className="!pt-8">
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <label htmlFor="blog-search" className="sr-only">Search articles</label>
            <input id="blog-search" type="search" className="field !pl-9" placeholder="Search articles…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <button className={chip(!category)} aria-pressed={!category} onClick={() => setCategory('')}>All</button>
            {cats.map((c) => <button key={c.slug} className={chip(category === c.slug)} aria-pressed={category === c.slug} onClick={() => setCategory(c.slug)}>{c.name}</button>)}
          </div>
        </div>

        <ErrorNotice>{s.error}</ErrorNotice>
        {s.loading && s.posts.length === 0 ? <Spinner /> : s.posts.length === 0 && !s.error ? (
          <Empty>{filtered ? 'No articles match your search.' : 'No articles have been published yet. Please check back soon.'}</Empty>
        ) : (
          <div className="space-y-6" aria-live="polite">
            {featured && <BlogCard post={featured} large />}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => <BlogCard key={p.id} post={p} />)}</div>
          </div>
        )}
        {s.page < s.pages && (
          <div className="mt-8 text-center"><button className="btn-secondary" disabled={s.loading} onClick={() => load(s.page + 1, false)}>{s.loading ? 'Loading…' : 'Load more'}</button></div>
        )}
      </Section>
    </>
  );
}
