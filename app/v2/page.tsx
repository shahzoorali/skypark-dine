import Link from 'next/link';
import { getMenu } from '@/lib/petpooja';
import { pickFeatured } from './featured';
import { Showcase } from './Showcase';
import './v2.css';

export const dynamic = 'force-dynamic';

/**
 * Homepage 2 — the showcase treatment, for comparison against the menu-first
 * homepage at /. Same data, same tokens, different proposition: one dish at a
 * time rather than the whole card grid.
 */
export default async function ShowcasePage() {
  const menu = await getMenu();
  const dishes = pickFeatured(menu);

  return (
    <main className="v2">
      <div className="v2__glow" />

      <header className="v2__masthead">
        <span className="v2__mark" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5F0E8" strokeWidth="2" strokeLinecap="round">
            <path d="M6 2v8a2 2 0 002 2 2 2 0 002-2V2M8 2v20" />
            <path d="M17 2c-1.5 2-2 4-2 7 0 2 1 3 2 3s2-1 2-3c0-3-.5-5-2-7zM17 12v10" />
          </svg>
        </span>
        <span>
          <span className="v2__wordmark">SKYPARK</span>
          <span className="v2__tagline">Banjara Hills</span>
        </span>
      </header>

      <Showcase dishes={dishes} />

      {menu.source === 'mock' ? (
        <p className="v2__note">Sample data — not live</p>
      ) : null}

      <nav className="v2__bar" aria-label="Sections">
        <Link className="v2__tab" href="/" aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 2v8a2 2 0 002 2 2 2 0 002-2V2M8 2v20" />
            <path d="M17 2c-1.5 2-2 4-2 7 0 2 1 3 2 3s2-1 2-3c0-3-.5-5-2-7zM17 12v10" />
          </svg>
        </Link>

        <button className="v2__tab" type="button" aria-label="Drinks">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14l-7 9zM12 12v8M8 21h8" />
          </svg>
        </button>

        <button className="v2__tab v2__tab--primary v2__tab--active" type="button" aria-label="Featured">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.9 6.3 6.6.8-4.9 4.6 1.3 6.5L12 17l-5.9 3.2 1.3-6.5L2.5 9.1l6.6-.8z" />
          </svg>
        </button>

        <button className="v2__tab" type="button" aria-label="Ask a question">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 01-9 8.4 8.8 8.8 0 01-3.9-.9L3 21l1.9-5A8.4 8.4 0 0112 3a8.4 8.4 0 019 8.5z" />
          </svg>
        </button>

        <button className="v2__tab" type="button" aria-label="Account">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
      </nav>

    </main>
  );
}
