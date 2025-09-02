// SBA Small Business Search API integration
import { SBA_API_URL, SBA_REQUEST_TEMPLATE } from './constants';

// Type definitions
type SBAResult = {
  uei: string;
  legal_business_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  year_established: string | null;
  sam_active: boolean;
  certifications: string[];
};

type ContractorWithUEI = {
  recipient_name: string;
  recipient_id: string;
  recipient_uei: string;
  total_awards: number;
  award_count: number;
};

export type EnrichedContractor = ContractorWithUEI & {
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  year_established: string | null;
  sam_active: boolean;
  sba_certifications: string[];
};

// Search SBA database by UEI
async function searchByUEI(uei: string): Promise<SBAResult | undefined> {
  if (!uei) return undefined;

  const requestBody = {
    ...SBA_REQUEST_TEMPLATE,
    searchProfiles: { searchTerm: uei }
  };

  try {
    const response = await fetch(SBA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) return undefined;

    const data = await response.json();
    const result = data.results?.[0];
    
    if (!result) return undefined;

    // Extract active certifications
    const activeCerts: string[] = [];
    if (result.active_8a_boolean) activeCerts.push('8(a)');
    if (result.active_wosb_boolean) activeCerts.push('WOSB');
    if (result.active_edwosb_boolean) activeCerts.push('EDWOSB');
    if (result.active_vosb_boolean) activeCerts.push('VOSB');
    if (result.active_sdvosb_boolean) activeCerts.push('SDVOSB');
    if (result.active_hz_boolean) activeCerts.push('HUBZone');

    return {
      uei: result.uei,
      legal_business_name: result.legal_business_name,
      contact_person: result.contact_person || null,
      email: result.email || null,
      phone: result.phone || null,
      website: result.website || null,
      year_established: result.year_established || null,
      sam_active: result.sam_extract_code === 'A',
      certifications: activeCerts
    };
  } catch {
    return undefined;
  }
}

// Enrich contractors with SBA data
export async function enrichContractorsWithSBA(
  contractors: ContractorWithUEI[]
): Promise<EnrichedContractor[]> {
  const sbaPromises = contractors.map(c => searchByUEI(c.recipient_uei));
  const sbaResults = await Promise.all(sbaPromises);

  return contractors.map((contractor, index) => {
    const sbaData = sbaResults[index];
    
    return {
      ...contractor,
      contact_person: sbaData?.contact_person || null,
      email: sbaData?.email || null,
      phone: sbaData?.phone || null,
      website: sbaData?.website || null,
      year_established: sbaData?.year_established || null,
      sam_active: sbaData?.sam_active || false,
      sba_certifications: sbaData?.certifications || []
    };
  });
}