import { Link } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';
import { categoryName } from '../../lib/clinic.js';
import { fmtDate } from '../../lib/format.js';

export default function BlogCard({ post, large = false }) {
  return (
    <article className={`panel group flex overflow-hidden transition hover:-translate-y-0.5 ${large ? 'flex-col md:flex-row' : 'flex-col'}`}>
      <Link to={`/blogs/${post.slug}`} className={`block shrink-0 overflow-hidden bg-brand-50 ${large ? 'md:w-1/2' : ''}`} tabIndex={-1} aria-hidden="true">
        {post.coverImage
          ? <img src={post.coverImage} alt="" loading="lazy" className={`w-full object-cover transition duration-500 group-hover:scale-105 ${large ? 'h-64 md:h-full' : 'aspect-[16/9]'}`} />
          : <div className={`grid w-full place-items-center text-brand-500 ${large ? 'h-64 md:h-full' : 'aspect-[16/9]'}`}><BookOpen size={36} /></div>}
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <span className="w-fit rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{categoryName(post.category)}</span>
        <h3 className={`mt-3 font-bold text-ink ${large ? 'text-2xl' : 'text-lg'}`}>
          <Link to={`/blogs/${post.slug}`} className="hover:text-brand-700 focus-visible:underline">{post.title}</Link>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600">{post.excerpt}</p>}
        <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          {post.author?.name && <span>{post.author.name}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{fmtDate(post.publishedAt)}</time>}
          <span className="flex items-center gap-1"><Clock size={12} /> {post.readingMinutes} min read</span>
        </p>
      </div>
    </article>
  );
}
