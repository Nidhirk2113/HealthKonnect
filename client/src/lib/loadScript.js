const cache = new Map();

export function loadScript(src) {
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = () => {
      cache.delete(src);
      reject(new Error(`Could not load ${new URL(src).hostname}. Check your connection or ad-blocker.`));
    };
    document.head.appendChild(s);
  });
  cache.set(src, p);
  return p;
}
