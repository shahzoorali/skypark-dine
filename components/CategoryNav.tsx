'use client';

import { useRef, useEffect } from 'react';
import type { MenuCategory } from '@/lib/menu';

interface Props {
  categories: MenuCategory[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the active pill in view when scroll-spy moves it, so the nav does
  // not silently disagree with what the guest is looking at.
  useEffect(() => {
    const container = scrollRef.current;
    const pill = container?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!container || !pill) return;

    const left = pill.offsetLeft - container.clientWidth / 2 + pill.clientWidth / 2;
    container.scrollTo({ left, behavior: 'smooth' });
  }, [activeId]);

  return (
    <nav className="catnav" aria-label="Menu sections">
      <div className="catnav__scroll" ref={scrollRef}>
        {categories.map(category => (
          <button
            key={category.id}
            className="pill"
            aria-current={category.id === activeId}
            onClick={() => onSelect(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </nav>
  );
}
