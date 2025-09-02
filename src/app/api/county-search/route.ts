import { findCountiesWithinRadius, extractZipFromAddress } from '@/lib/county';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const { address } = body;
  
  if (!address) {
    return NextResponse.json(
      { error: "Address is required" },
      { status: 400 }
    );
  }
  
  const zipCode = extractZipFromAddress(address);
  if (!zipCode) {
    return NextResponse.json(
      { error: "No ZIP code found in address" },
      { status: 400 }
    );
  }
  
  try {
    const result = await findCountiesWithinRadius(zipCode, 100);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof Error && error.message.includes("not found") ? 404 : 500 }
    );
  }
}