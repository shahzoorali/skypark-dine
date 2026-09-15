/**
 * Shapes for PetPooja's Dine-in QR API.
 * Source: https://dineinapi.docs.apiary.io/
 *
 * NOTE: these are modelled from the published documentation only. They have
 * NOT yet been validated against a live staging response. Once staging
 * credentials arrive, diff a real payload against this file before trusting it.
 */

export interface PetpoojaCredentials {
  app_key: string;
  app_secret: string;
  access_token: string;
  restID: string;
}

/** Raw response from thirdparty_fetch_dinein_qr_menu */
export interface PetpoojaMenuResponse {
  success: string; // "1" | "0"
  message?: string;
  restaurants?: PetpoojaRestaurant[];
  categories?: PetpoojaCategory[];
  items?: PetpoojaItem[];
  areas?: PetpoojaArea[];
  tables?: PetpoojaTable[];
  addongroups?: PetpoojaAddonGroup[];
  itemspecialnotes?: unknown[];
}

export interface PetpoojaRestaurant {
  restaurantid?: string;
  active?: string;
  details?: Record<string, unknown>;
}

export interface PetpoojaCategory {
  categoryid: string;
  categoryname: string;
  categoryrank?: string;
  parent_category_id?: string;
  active?: string;
  categorytimings?: string;
  category_image_url?: string;
}

export interface PetpoojaItem {
  itemid: string;
  itemname: string;
  item_categoryid: string;
  itemdescription?: string;
  price?: string;
  minimumpreparationtime?: string;
  item_attributeid?: string; // veg / non-veg / egg marker
  itemallowvariation?: string;
  variation?: PetpoojaVariation[];
  addon?: PetpoojaItemAddon[];
  item_image_url?: string;
  active?: string;
  in_stock?: string;
  itemrank?: string;
  item_tags?: string[];
}

export interface PetpoojaVariation {
  id?: string;
  variationid?: string;
  name?: string;
  price?: string;
  active?: string;
}

export interface PetpoojaItemAddon {
  addon_group_id: string;
  addon_item_selection_min?: string;
  addon_item_selection_max?: string;
}

export interface PetpoojaAddonGroup {
  addongroupid: string;
  addongroup_name: string;
  active?: string;
  addongroupitems?: PetpoojaAddonItem[];
}

export interface PetpoojaAddonItem {
  addonitemid: string;
  addonitem_name: string;
  addonitem_price?: string;
  active?: string;
}

export interface PetpoojaArea {
  restaurantareaid?: string;
  areaid?: string;
  area_name?: string;
}

export interface PetpoojaTable {
  id?: string;
  restaurantareaid?: string;
  table_no?: string;
  seating_capacity?: string;
}
