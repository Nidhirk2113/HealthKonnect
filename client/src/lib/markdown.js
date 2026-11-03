import { marked } from 'marked';
import DOMPurify from 'dompurify';

const slug = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

marked.setOptions({
  gfm: true,
  breaks: false,
});

const sanitizerConfig = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
};

/**
 * Converts Markdown into sanitized HTML and generates
 * a table of contents from h2/h3 headings.
 */
export function renderMarkdown(md = '') {
  let parsed;

  try {
    parsed = marked.parse(md, {
      gfm: true,
      breaks: false,
    });
  } catch {
    return { html: '<p>Unable to render this article.</p>', toc: [] };
  }

  const clean = DOMPurify.sanitize(parsed, sanitizerConfig);
  const doc = new DOMParser().parseFromString(clean, 'text/html');

  const toc = [];
  const used = new Set();

  doc.querySelectorAll('h2, h3').forEach((heading) => {
    const base = slug(heading.textContent) || 'section';
    let id = base;

    for (let i = 2; used.has(id); i += 1) {
      id = `${base}-${i}`;
    }

    used.add(id);
    heading.id = id;

    toc.push({
      id,
      text: heading.textContent,
      level: Number(heading.tagName[1]),
    });
  });

  doc.querySelectorAll('a').forEach((anchor) => {
    anchor.rel = 'noopener noreferrer';

    if (anchor.target === '_blank') {
      anchor.target = '_blank';
    }
  });

  doc.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
    img.referrerPolicy = 'no-referrer';

    if (!img.src.startsWith('https://')) {
      img.remove();
    }
  });

  return {
    html: doc.body.innerHTML,
    toc,
  };
}