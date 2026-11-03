export const Section = ({ id, className = '', children }) => (
  <section id={id} className={`mx-auto max-w-6xl px-4 py-16 ${className}`}>{children}</section>
);

export const SectionHeading = ({ eyebrow, title, children, center }) => (
  <div className={`mb-8 ${center ? 'text-center' : ''}`}>
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{title}</h2>
    {children && <p className={`mt-3 max-w-2xl text-slate-600 ${center ? 'mx-auto' : ''}`}>{children}</p>}
  </div>
);

export const PageHero = ({ eyebrow, title, children }) => (
  <div className="bg-gradient-to-b from-brand-50 to-[#f7faf8]">
    <div className="mx-auto max-w-6xl px-4 py-14">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="fade-up mt-3 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">{title}</h1>
      {children && <p className="mt-4 max-w-2xl text-lg text-slate-600">{children}</p>}
    </div>
  </div>
);
