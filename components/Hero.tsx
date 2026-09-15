/**
 * Savoria-style hero over the Skypark palette.
 *
 * `imageUrl` is intentionally optional: until the food shoot lands, the
 * gradient stands in. Pass a photograph and it drops straight in.
 */
interface Props {
  restaurantName: string;
  imageUrl?: string;
}

export function Hero({ restaurantName, imageUrl }: Props) {
  return (
    <section className="hero">
      <div
        className={`hero__media${imageUrl ? ' hero__media--photo' : ''}`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />
      <div className="hero__scrim" />
      <p className="hero__eyebrow">Banjara Hills · Hyderabad</p>
      <h1 className="hero__title">{restaurantName}</h1>
      <div className="hero__rule" />
      <p className="hero__sub">
        Everything we&rsquo;re serving today, straight from the kitchen&rsquo;s own list.
      </p>
    </section>
  );
}
