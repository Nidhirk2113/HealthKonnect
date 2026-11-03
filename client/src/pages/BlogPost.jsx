import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Link2, MessageCircle, Share2 } from 'lucide-react';
import { api } from '../services/api.js';
import { categoryName } from '../lib/clinic.js';
import { fmtDate } from '../lib/format.js';
import { renderMarkdown } from '../lib/markdown.js';
import { useMeta } from '../lib/seo.js';
import Avatar from '../components/Avatar.jsx';
import BlogCard from '../components/site/BlogCard.jsx';
import { Empty, Spinner } from '../components/Notice.jsx';


export default function BlogPost() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const post = data?.post;
  const { html, toc } = useMemo(() => renderMarkdown(post?.content), [post?.content]);
  const url = typeof window === 'undefined' ? '' : window.location.href;

  useEffect(() => {
    setData(null); setError('');
    api.get(`/blogs/${encodeURIComponent(slug)}`).then(setData).catch((e) => setError(e.message));
    window.scrollTo(0, 0);
  }, [slug]);

  useMeta(post ? {
    title: post.seoTitle || `${post.title} · Tulasi HealthConnect`,
    description: post.seoDescription || post.excerpt,
    image: post.coverImage || undefined,
    type: 'article',
    jsonLd: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.seoDescription || post.excerpt, image: post.coverImage || undefined, datePublished: post.publishedAt, author: post.author ? { '@type': 'Person', name: post.author.name } : undefined },
  } : {});

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><Empty>{error === 'Article not found' ? 'This article could not be found.' : error}<div className="mt-4"><Link className="btn" to="/blogs">Back to blog</Link></div></Empty></div>;
  if (!post) return <Spinner />;

  const share = [['WhatsApp', `https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`], ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`], ['X', `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`]];
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard unavailable */ } };

  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/blogs" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline"><ArrowLeft size={14} /> All articles</Link>
      <header className="max-w-3xl">
        <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{categoryName(post.category)}</span>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
          {post.author && <span className="flex items-center gap-2"><Avatar name={post.author.name} src={post.author.picture} size={28} /> {post.author.name}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{fmtDate(post.publishedAt)}</time>}
          <span className="flex items-center gap-1"><Clock size={14} /> {post.readingMinutes} min read</span>
        </div>
      </header>
      {post.coverImage && <img src={post.coverImage} alt="" className="mt-8 max-h-[28rem] w-full rounded-3xl object-cover shadow-soft" />}

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_16rem]">
        <div className="max-w-3xl">
          {toc.length >= 2 && (
            <details className="panel mb-8 p-4 lg:hidden"><summary className="cursor-pointer font-semibold">Table of contents</summary>
              <ul className="mt-3 space-y-1.5 text-sm">{toc.map((t) => <li key={t.id} className={t.level === 3 ? 'pl-4' : ''}><a className="text-brand-700 hover:underline" href={`#${t.id}`}>{t.text}</a></li>)}</ul></details>
          )}
          <div className="prose-blog" dangerouslySetInnerHTML={{ __html: html }} />
          {post.tags?.length > 0 && <div className="mt-8 flex flex-wrap gap-2">{post.tags.map((t) => <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">#{t}</span>)}</div>}
          <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-6">
            <span className="flex items-center gap-1 text-sm font-semibold"><Share2 size={15} /> Share</span>
            {share.map(([label, href]) => <a key={label} className="btn-secondary btn-sm" href={href} target="_blank" rel="noopener noreferrer">{label === 'WhatsApp' && <MessageCircle size={14} />}{label}</a>)}
            <button className="btn-secondary btn-sm" onClick={copy}><Link2 size={14} /> {copied ? 'Copied' : 'Copy link'}</button>
          </div>
          <p className="mt-8 rounded-2xl bg-slate-50 p-4 text-xs text-slate-500">This article is for general information and is not a substitute for professional medical advice. In a mental-health emergency call 112 or Tele-MANAS 14416.</p>
        </div>
        {toc.length >= 2 && (
          <aside className="hidden lg:block"><nav aria-label="Table of contents" className="sticky top-24"><p className="mb-3 text-sm font-bold">On this page</p>
            <ul className="space-y-2 border-l border-slate-200 text-sm">{toc.map((t) => <li key={t.id} className={t.level === 3 ? 'pl-6' : 'pl-3'}><a className="text-slate-600 hover:text-brand-700" href={`#${t.id}`}>{t.text}</a></li>)}</ul></nav></aside>
        )}
      </div>

      {data.related.length > 0 && (
        <section className="mt-16"><h2 className="mb-5 text-2xl font-extrabold">Related articles</h2>
          <div className="grid gap-5 md:grid-cols-3">{data.related.map((p) => <BlogCard key={p.id} post={p} />)}</div></section>
      )}
    </article>
  );
}
