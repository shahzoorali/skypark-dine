/**
 * Hero.
 *
 * The headline uses the outlined/solid split from the reference design, with
 * the emphasis inverted: the brand name stays solid and the trailing word is
 * outlined. Savoria puts the outline first because its headline is a dish
 * name; here the first word is the restaurant and should not be the lighter
 * of the two.
 */
interface Props {
  restaurantName: string;
  imageUrl?: string;
}

export function Hero({ restaurantName, imageUrl }: Props) {
  const words = restaurantName.trim().split(/\s+/);
  const lead = words.length > 1 ? words.slice(0, -1).join(' ') : restaurantName;
  const tail = words.length > 1 ? words.at(-1) : undefined;

  return (
    <section className="hero">
      <div
        className={`hero__media${imageUrl ? ' hero__media--photo' : ''}`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
      />
      <div className="hero__scrim" />

      <p className="hero__eyebrow">Banjara Hills &middot; Hyderabad</p>

      <h1 className="hero__title">
        <span className="hero__word">{lead}</span>
        {tail ? <span className="hero__word hero__word--outline">{tail}</span> : null}
      </h1>

      <div className="hero__rule" />
      <p className="hero__sub">
        Everything we&rsquo;re serving today, straight from the kitchen&rsquo;s own list.
      </p>
    </section>
  );
}
