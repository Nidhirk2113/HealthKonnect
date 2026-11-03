import { useEffect } from 'react';

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  const created = !el;
  if (created) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  const prev = el.getAttribute('content');
  el.setAttribute('content', value);
  return () => (created ? el.remove() : el.setAttribute('content', prev ?? ''));
}

/** Sets the page title and description/Open Graph tags while a page is mounted, then restores them. */
export function useMeta({ title, description, image, type = 'website', jsonLd } = {}) {
  useEffect(() => {
    if (!title) return undefined;
    const prevTitle = document.title;
    document.title = title;
    const undo = [setMeta('property', 'og:title', title), setMeta('property', 'og:type', type)];
    if (description) undo.push(setMeta('name', 'description', description), setMeta('property', 'og:description', description));
    if (image) undo.push(setMeta('property', 'og:image', image));
    let script;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
    return () => { document.title = prevTitle; undo.forEach((u) => u()); script?.remove(); };
  }, [title, description, image, type, jsonLd && JSON.stringify(jsonLd)]);
}
