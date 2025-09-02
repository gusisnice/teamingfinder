import { findCountiesWithinRadius, extractZipFromAddress } from '@/lib/county';
import { searchContractors } from '@/lib/usaspending';
import { enrichContractorsWithSBA } from '@/lib/sba';
import { SEARCH_RADIUS_MILES, MAX_CONTRACTORS } from '@/lib/constants';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { address, naicsCode, setAsideType } = body;
  
  // Validate inputs
  if (!address || !naicsCode || !setAsideType) {
    return NextResponse.json(
      { error: "Address, NAICS code, and set-aside type are required" },
      { status: 400 }
    );
  }
  
  // Extract ZIP from address
  const zipCode = extractZipFromAddress(address);
  if (!zipCode) {
    return NextResponse.json(
      { error: "No ZIP code found in address" },
      { status: 400 }
    );
  }
  
  try {
    // Find counties within radius
    const countyResult = await findCountiesWithinRadius(zipCode, SEARCH_RADIUS_MILES);
    const countyFips = countyResult.nearbyCounties.map(c => c.fips);
    
    
    // Search contractors in those counties
    const contractors = await searchContractors(
      countyFips,
      naicsCode,
      setAsideType,
      MAX_CONTRACTORS
    );
    
    // Handle no results case
    if (!contractors) {
      return NextResponse.json({
        centerCounty: countyResult.centerCounty,
        totalCountiesSearched: countyResult.totalFound,
        contractors: [],
        message: "No contractors found matching criteria"
      });
    }
    
    // Enrich with SBA data
    const enrichedContractors = await enrichContractorsWithSBA(contractors);
    
    // Filter to only include contractors with the matching certification
    const filteredContractors = enrichedContractors.filter(contractor => 
      contractor.sba_certifications.includes(setAsideType)
    );
    
    return NextResponse.json({
      centerCounty: countyResult.centerCounty,
      totalCountiesSearched: countyResult.totalFound,
      contractors: filteredContractors
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 }
    );
  }
}