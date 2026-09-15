'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Featured } from './featured';

function formatPrice(value: number) {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function Showcase({ dishes }: { dishes: Featured[] }) {
  const [index, setIndex] = useState(0);
  const dish = dishes[index];

  if (!dish) {
    return (
      <p className="v2__note">
        No photographed dishes yet — the showcase needs at least one image.
      </p>
    );
  }

  const step = (delta: number) =>
    setIndex(current => (current + delta + dishes.length) % dishes.length);

  return (
    <>
      <div className="v2__stage">
        <p className="v2__eyebrow">Most loved right now</p>

        <h1 className="v2__dish">
          <span>{dish.lead}</span>
          {dish.tail ? <span className="v2__outline">{dish.tail}</span> : null}
        </h1>

        <p className="v2__card">{dish.description}</p>

        <div className="v2__meta">
          <span className="v2__price">
            {dish.fromPrice ? <small>from</small> : null}₹{formatPrice(dish.price)}
          </span>
          <span className="v2__cat">{dish.category}</span>
        </div>

        <div className="v2__actions">
          <Link className="v2__btn v2__btn--solid" href="/">
            See the full menu
          </Link>
          <button className="v2__btn v2__btn--ghost" type="button">
            Call a waiter
          </button>
        </div>

        <div className="v2__plate">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dish.photo} alt={dish.name} />
          {dishes.length > 1 ? (
            <>
              <button
                className="v2__arrow v2__arrow--prev"
                onClick={() => step(-1)}
                aria-label="Previous dish"
              >
                &#8249;
              </button>
              <button
                className="v2__arrow v2__arrow--next"
                onClick={() => step(1)}
                aria-label="Next dish"
              >
                &#8250;
              </button>
            </>
          ) : null}
        </div>
      </div>

      {dishes.length > 1 ? (
        <div className="v2__rail">
          {dishes.map((d, i) => (
            <button
              key={d.id}
              className="v2__thumb"
              aria-current={i === index}
              onClick={() => setIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.photo} alt="" />
              <span>{d.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
