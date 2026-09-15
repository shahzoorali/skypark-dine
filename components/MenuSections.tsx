'use client';

import { useEffect, useRef, useState } from 'react';
import type { MenuCategory } from '@/lib/menu';
import { CategoryNav } from './CategoryNav';
import { MenuItemCard } from './MenuItemCard';

export function MenuSections({ categories }: { categories: MenuCategory[] }) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? '');
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  // Scroll-spy: the pill follows the guest's scroll rather than only the
  // other way round.
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      // Top band only, so the "current" section is the one under the nav.
      { rootMargin: '-120px 0px -70% 0px', threshold: 0 },
    );

    for (const element of sectionRefs.current.values()) observer.observe(element);
    return () => observer.disconnect();
  }, [categories]);

  function scrollTo(id: string) {
    setActiveId(id);
    sectionRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <CategoryNav categories={categories} activeId={activeId} onSelect={scrollTo} />

      {categories.map(category => (
        <section
          key={category.id}
          id={category.id}
          className="section"
          ref={element => {
            if (element) sectionRefs.current.set(category.id, element);
            else sectionRefs.current.delete(category.id);
          }}
        >
          <div className="section__head">
            <h2 className="section__label">{category.name}</h2>
            {category.timings ? (
              <span className="section__timing">{category.timings}</span>
            ) : null}
          </div>

          <div className="grid">
            {category.items.map(item => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
