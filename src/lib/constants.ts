// Search parameters
export const SEARCH_RADIUS_MILES = 100;
export const MAX_CONTRACTORS = 10;
export const YEARS_LOOKBACK = 5;
export const API_PAGE_SIZE = 100;
export const MAX_API_PAGES = 10;

// Geographic constants
export const EARTH_RADIUS_MILES = 3959;

// API endpoints
export const USASPENDING_API_URL = 'https://api.usaspending.gov/api/v2/search/spending_by_award/';

// Valid set-aside types from federal contracting
export const VALID_SET_ASIDES = [
  'NONE',
  '8(a)',
  'WOSB',
  'VOSB', 
  'SDVOSB',
  'HUBZone',
  'EDWOSB',
  'SDB',
  'SBA'
] as const;

export type SetAsideType = typeof VALID_SET_ASIDES[number];