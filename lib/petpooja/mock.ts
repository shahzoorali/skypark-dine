import type { PetpoojaMenuResponse } from './types';

/**
 * Stand-in for a live PetPooja response, shaped exactly like the documented
 * payload. Item names, descriptions and prices are lifted from Skypark's
 * public PetPooja menu so layout is tested against realistic string lengths.
 *
 * Prices here are the DELIVERY list and are not authoritative for dine-in.
 * This driver exists to build against, never to serve to a guest.
 */

type Seed = [name: string, price: string, diet: string, desc?: string];

const SEED: Record<string, { rank: number; timings?: string; items: Seed[] }> = {
  Starters: {
    rank: 1,
    items: [
      ['Piri Piri Chicken Wings', '449', '2'],
      ['Chicken & Chips', '449', '2'],
      ['Jalapeno Cheese Poppers', '379', '1'],
      ['Peri-Peri Paneer', '499', '1'],
      ['Fish & Chips', '499', '2', 'Seafood perfection, chip satisfaction.'],
      ['BBQ Chicken Wings', '449', '2', 'Smoky, tangy, finger-licking goodness.'],
      ['Honey Chilli Potato', '379', '1', 'Sweet & Spicy Crisps'],
      ['Chilli Paneer', '429', '1', 'Soft paneer cubes cooked in a delectable, spicy and tangy sauce'],
    ],
  },
  'Chinese Starters': {
    rank: 2,
    items: [
      ['Chicken Lollipop', '499', '2'],
      ['Chilli Chicken', '429', '2', 'Fiery chicken in savory gravy'],
      ['Chicken Manchurian', '429', '2', 'Juicy chicken bites in savory Indo-Chinese gravy'],
      ['Veg Manchurian', '399', '1', 'Dumplings drenched in savory goodness.'],
      ['Paneer Majestic', '429', '1', 'Spiced paneer cubes, crispy fried, and tossed in a flavorful sauce'],
      ['Chilli Mushroom', '429', '1'],
      ['Butter Garlic Prawns', '529', '2'],
      ['Apollo Fish', '499', '2'],
    ],
  },
  'Bunking Hours': {
    rank: 3,
    timings: 'Mon-Fri 12:00-18:00',
    items: [
      ['Bunker Burger + Fries', '349', '2', 'The afternoon special. Available 12 to 6, weekdays only.'],
      ['Half Pitcher + Nachos', '499', '1'],
      ['Campus Cooler', '199', '1', 'Iced tea, three ways.'],
    ],
  },
  Desserts: {
    rank: 4,
    items: [
      ['Nutella Cookie Tin', '549', '1', 'Crisp edges, gooey centers, indulgent flavours - all packed in our signature Cookie Tin'],
      ['Subway Double Choco Chip Nutella Cookie Tin', '649', '1', 'Crisp edges, gooey centers with double chocolate chip flavours'],
      ['Chocolate Mousse Jar', '199', '1'],
      ['Nutella Chocolate Brownie', '249', '1'],
      ['Plain Chocolate Brownie', '199', '1'],
    ],
  },
};

export function mockMenuResponse(): PetpoojaMenuResponse {
  const categories = [];
  const items = [];
  let categoryIndex = 0;
  let itemIndex = 0;

  for (const [name, config] of Object.entries(SEED)) {
    categoryIndex += 1;
    const categoryid = `c${categoryIndex}`;
    categories.push({
      categoryid,
      categoryname: name,
      categoryrank: String(config.rank),
      active: '1',
      categorytimings: config.timings ?? '',
    });

    for (const [itemname, price, attr, itemdescription] of config.items) {
      itemIndex += 1;
      const allowVariation = Number(price) >= 429 ? '1' : '0';
      items.push({
        itemid: `i${itemIndex}`,
        itemname,
        item_categoryid: categoryid,
        itemdescription: itemdescription ?? '',
        price,
        item_attributeid: attr,
        itemallowvariation: allowVariation,
        variation:
          allowVariation === '1'
            ? [
                { variationid: `v${itemIndex}a`, name: 'Half', price, active: '1' },
                {
                  variationid: `v${itemIndex}b`,
                  name: 'Full',
                  price: String(Number(price) + 120),
                  active: '1',
                },
              ]
            : [],
        active: '1',
        in_stock: '1',
        itemrank: String(itemIndex),
      });
    }
  }

  return {
    success: '1',
    message: 'mock',
    restaurants: [{ restaurantid: '83305', active: '1', details: { restaurantname: 'SKYPARK CAFE' } }],
    categories,
    items,
    areas: [
      { restaurantareaid: '1', areaid: '1', area_name: 'Indoor' },
      { restaurantareaid: '2', areaid: '2', area_name: 'Terrace' },
      { restaurantareaid: '3', areaid: '3', area_name: 'Garden' },
    ],
    tables: [{ id: '1', restaurantareaid: '1', table_no: '12', seating_capacity: '4' }],
    addongroups: [],
  };
}
