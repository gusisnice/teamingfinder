// USAspending.gov API integration for contractor search
import { 
  YEARS_LOOKBACK, 
  API_PAGE_SIZE, 
  MAX_API_PAGES, 
  VALID_SET_ASIDES, 
  SetAsideType,
  USASPENDING_API_URL
} from './constants';
import stateMap from './data/fips-states.json';
import { toISODate } from './utils';

// Type definitions
export type ContractorResult = {
  recipient_name: string;
  recipient_id: string;
  recipient_uei: string;
  total_awards: number;
  award_count: number;
};

type USASpendingResponse = {
  results: Array<{
    'Recipient Name': string | null;
    'recipient_id': string | null;
    'Recipient UEI': string | null;
    'Award Amount': number | null;
  }>;
  page_metadata?: {
    page: number;
    hasNext: boolean;
  };
};

// Convert FIPS to state/county format for API
function fipsToLocation(fips: string) {
  const stateCode = fips.substring(0, 2);
  const countyCode = fips.substring(2);
  const state = stateMap[stateCode as keyof typeof stateMap];
  
  return state ? { 
    country: 'USA',
    state, 
    county: countyCode
  } : null;
}

// Search contractors in USAspending API
export async function searchContractors(
  countyFips: string[],
  naicsCode: string,
  setAsideType: string,
  limit = 10
): Promise<ContractorResult[] | undefined> {
  // Validate inputs
  if (!/^\d{6}$/.test(naicsCode)) {
    throw new Error(`Invalid NAICS code: must be 6 digits, got ${naicsCode}`);
  }
  if (!VALID_SET_ASIDES.includes(setAsideType as SetAsideType)) {
    throw new Error(`Invalid set-aside type: ${setAsideType}. Valid types: ${VALID_SET_ASIDES.join(', ')}`);
  }

  // Build time period
  const endDate = toISODate(new Date());
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - YEARS_LOOKBACK);
  const startDateStr = toISODate(startDate);

  // Convert FIPS codes to location objects
  const locations = countyFips
    .map(fipsToLocation)
    .filter((loc): loc is NonNullable<typeof loc> => loc !== null);

  if (locations.length === 0) {
    throw new Error('No valid county FIPS codes provided');
  }

  // Build base request body
  const baseRequestBody = {
    filters: {
      award_type_codes: ['A', 'B', 'C', 'D'],
      time_period: [{ start_date: startDateStr, end_date: endDate }],
      place_of_performance_locations: locations,
      naics_codes: { require: [naicsCode] },
      set_aside_type_codes: [setAsideType]
    },
    fields: ['Recipient Name', 'recipient_id', 'Recipient UEI', 'Award Amount'],
    limit: API_PAGE_SIZE
  };

  // Paginate through results
  let allResults: USASpendingResponse['results'] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= MAX_API_PAGES) {
    const requestBody = { ...baseRequestBody, page };
    
    const response = await fetch(USASPENDING_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`USAspending API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as USASpendingResponse;
    allResults = allResults.concat(data.results);
    
    hasMore = data.page_metadata?.hasNext || false;
    page++;
  }

  // Aggregate by recipient
  const recipientMap = new Map<string, ContractorResult>();
  
  allResults.forEach(award => {
    const recipientId = award.recipient_id;
    const recipientName = award['Recipient Name'];
    const recipientUei = award['Recipient UEI'];
    const awardAmount = award['Award Amount'] || 0;

    if (!recipientId || !recipientName) return;

    const existing = recipientMap.get(recipientId);
    if (existing) {
      existing.total_awards += awardAmount;
      existing.award_count += 1;
    } else {
      recipientMap.set(recipientId, {
        recipient_name: recipientName,
        recipient_id: recipientId,
        recipient_uei: recipientUei || '',
        total_awards: awardAmount,
        award_count: 1
      });
    }
  });

  // Sort by total awards and return top N
  const contractors = Array.from(recipientMap.values());
  contractors.sort((a, b) => b.total_awards - a.total_awards);
  
  const topContractors = contractors.slice(0, limit);
  return topContractors.length > 0 ? topContractors : undefined;
}