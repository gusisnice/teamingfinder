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
export const SBA_API_URL = 'https://search.certifications.sba.gov/_api/v2/search';

// SBA API request template
export const SBA_REQUEST_TEMPLATE = {
  searchProfiles: { searchTerm: '' },
  location: { states: [], zipCodes: [], counties: [], districts: [], msas: [] },
  sbaCertifications: { activeCerts: [], isPreviousCert: false, operatorType: "Or" },
  naics: { codes: [], isPrimary: false, operatorType: "Or" },
  selfCertifications: { certifications: [], operatorType: "Or" },
  keywords: { list: [], operatorType: "Or" },
  lastUpdated: { date: { label: "Anytime", value: "anytime" } },
  samStatus: { isActiveSAM: true },
  qualityAssuranceStandards: { qas: [] },
  bondingLevels: { 
    constructionIndividual: "", 
    constructionAggregate: "", 
    serviceIndividual: "", 
    serviceAggregate: "" 
  },
  businessSize: { relationOperator: "at-least", numberOfEmployees: "" },
  annualRevenue: { relationOperator: "at-least", annualGrossRevenue: "" },
  entityDetailId: ""
} as const;

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