import { getMenu } from '@/lib/petpooja';
import { MenuHeader } from '@/components/MenuHeader';
import { Hero } from '@/components/Hero';
import { MenuSections } from '@/components/MenuSections';
import { flags } from '@/config/flags';
import { heroPhoto } from '@/lib/photos';

// The menu changes when the kitchen changes it; the adapter holds the cache.
export const dynamic = 'force-dynamic';

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>;
}) {
  const { table } = await searchParams;
  const menu = await getMenu({ tableNo: table });

  return (
    <main className="app">
      <MenuHeader tableNo={table} />
      <Hero restaurantName={menu.restaurantName} imageUrl={heroPhoto} />
      <MenuSections categories={menu.categories} source={menu.source} />

      {!flags.ordering ? (
        <div className="waiter">
          <button className="waiter__btn" type="button">
            Call a waiter
          </button>
        </div>
      ) : null}

      <p className="footnote">
        Prices in ₹ and exclusive of taxes. Ask our staff about allergens.
        {menu.source === 'mock' ? ' · Sample data — not live' : null}
      </p>
    </main>
  );
}
