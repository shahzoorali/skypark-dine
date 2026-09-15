/**
 * Demo photography.
 *
 * These are real Skypark shots, but they are matched to mock menu items by
 * eye, not by fact — the burger in `burger-board.jpg` is not necessarily the
 * burger the mock calls "Bunker Burger + Fries". So they are served ONLY when
 * the mock driver is, alongside the "Sample data — not live" footer.
 *
 * A guest orders what they see. Nothing in here may ever appear over live
 * PetPooja data; `itemPhoto` enforces that by taking the menu source.
 */

const BY_SLUG: Record<string, string> = {
  'bunker-burger-fries': 'burger-board',
  'half-pitcher-nachos': 'sliders',
  'campus-cooler': 'burger-hand',
  'chilli-chicken': 'chicken-plate',
  'chicken-manchurian': 'chicken-top',
  'chicken-lollipop': 'chicken-angle',
  'piri-piri-chicken-wings': 'chicken-top',
  'bbq-chicken-wings': 'chicken-plate',
  'chicken-chips': 'burger-stack',
  'honey-chilli-potato': 'chutneys',
  'chilli-paneer': 'chicken-angle',
  'paneer-majestic': 'spices',
  'peri-peri-paneer': 'griddle',
};

export function demoPhoto(slug: string): string | undefined {
  const name = BY_SLUG[slug];
  return name ? `/demo/${name}.jpg` : undefined;
}
