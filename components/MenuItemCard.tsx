import type { MenuItem } from '@/lib/menu';
import { itemPhoto } from '@/lib/photos';

const DIET_LABEL: Record<MenuItem['diet'], string> = {
  veg: 'Vegetarian',
  nonveg: 'Non-vegetarian',
  egg: 'Contains egg',
  unknown: '',
};

function formatPrice(value: number): string {
  return value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const photo = itemPhoto(item);

  return (
    <article className={`card${item.inStock ? '' : ' card--out'}`}>
      <div className="card__media">
        {photo ? (
          // Local shots are same-origin; PetPooja's fallback is a remote CDN
          // whose host we cannot confirm until a live payload shows it, so
          // next/image is not usable here yet.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="card__img" src={photo} alt="" loading="lazy" />
        ) : null}
      </div>

      <div className="card__body">
        <div className="card__toprow">
          <h3 className="card__name">{item.name}</h3>
          <span
            className={`diet diet--${item.diet}`}
            role="img"
            aria-label={DIET_LABEL[item.diet]}
          />
        </div>

        {item.description ? <p className="card__desc">{item.description}</p> : null}

        <div className="card__footer">
          <span className="price">
            {item.fromPrice ? <span className="price__from">From</span> : null}
            <span className="price__cur">₹</span>
            {formatPrice(item.price)}
          </span>
          {!item.inStock ? <span className="badge">Sold out</span> : null}
        </div>
      </div>
    </article>
  );
}
