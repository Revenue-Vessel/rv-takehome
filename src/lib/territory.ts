import { Deal, DealWithTerritory } from "./types";

const stateToTerritory: Record<string, string> = {
  CA: "West Coast",
  WA: "West Coast",
  OR: "West Coast",
  AZ: "Southwest",
  NM: "Southwest",
  NV: "Southwest",
  OK: "Southwest",
  TX: "Southwest",
  IL: "Midwest",
  IN: "Midwest",
  IA: "Midwest",
  KS: "Midwest",
  MI: "Midwest",
  MN: "Midwest",
  MO: "Midwest",
  NE: "Midwest",
  ND: "Midwest",
  OH: "Midwest",
  SD: "Midwest",
  WI: "Midwest",
  AL: "Southeast",
  AR: "Southeast",
  FL: "Southeast",
  GA: "Southeast",
  KY: "Southeast",
  LA: "Southeast",
  MS: "Southeast",
  NC: "Southeast",
  SC: "Southeast",
  TN: "Southeast",
  VA: "Southeast",
  WV: "Southeast",
  CT: "Northeast",
  DE: "Northeast",
  ME: "Northeast",
  MD: "Northeast",
  MA: "Northeast",
  NH: "Northeast",
  NJ: "Northeast",
  NY: "Northeast",
  PA: "Northeast",
  RI: "Northeast",
  VT: "Northeast",
  CO: "Mountain",
  ID: "Mountain",
  MT: "Mountain",
  UT: "Mountain",
  WY: "Mountain",
  AK: "Pacific",
  HI: "Pacific",
};

function getStateFromCity(city: string): string | null {
  // Validated with https://regexr.com/
  const match = city.match(/([A-Z]{2})$/);
  return match ? match[1] : null;
}

export function getTerritory(originCity: string): string {
  const state = getStateFromCity(originCity);
  return state ? stateToTerritory[state] || "Other" : "Other";
}

export function enrichDeal(deal: Deal): DealWithTerritory {
  return {
    ...deal,
    territory: getTerritory(deal.origin_city),
  };
}
