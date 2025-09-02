import { promises as fs } from 'fs';
import * as path from 'path';

// Type definitions
type Coords = { lat: number; lon: number };
type County = { name: string; state: string };

// Helper functions
const padZip = (zip: string) => zip.padStart(5, '0');
const dbPath = (file: string) => path.join(process.cwd(), 'public', 'county_db', file);
const getCountyName = (fips: string) => FIPS_TO_COUNTY_NAME.get(fips) || { name: `County ${fips}`, state: '' };

// Data structures
const ZIP_TO_FIPS = new Map<string, string>();
const ZIP_COORDS = new Map<string, Coords>();
const FIPS_TO_COUNTY_NAME = new Map<string, County>();
const FIPS_TO_COORDS = new Map<string, Coords>();

// Track loading state
let dataLoaded = false;

// Parse CSV helper
function parseCSV(data: string, handler: (parts: string[]) => void) {
  const lines = data.split('\n');
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    handler(line.split(','));
  }
}

// Load all data asynchronously
async function loadData() {
  if (dataLoaded) return;
  
  // Load all files in parallel
  const [zipData, coordData, adjacencyData] = await Promise.all([
    fs.readFile(dbPath('ZIP_COUNTY_062025.csv'), 'utf-8'),
    fs.readFile(dbPath('tl_2020_us_zcta520.csv'), 'utf-8'),
    fs.readFile(dbPath('county_adjacency.txt'), 'utf-8')
  ]);
  
  // Parse ZIP to County FIPS mapping
  parseCSV(zipData, (parts) => {
    if (parts.length >= 2) {
      const zip = padZip(parts[0]);
      if (!ZIP_TO_FIPS.has(zip)) {
        ZIP_TO_FIPS.set(zip, parts[1]);
      }
    }
  });

  // Parse ZIP coordinates
  parseCSV(coordData, (parts) => {
    if (parts.length >= 9) {
      const lat = parseFloat(parts[7].replace('+', ''));
      const lon = parseFloat(parts[8].replace('+', ''));
      if (!isNaN(lat) && !isNaN(lon)) {
        ZIP_COORDS.set(padZip(parts[0]), { lat, lon });
      }
    }
  });

  // Parse county names
  adjacencyData.split('\n').forEach(line => {
    const parts = line.split('\t');
    if (parts.length >= 4 && parts[0] === parts[2]) {
      const match = parts[0].match(/"([^,]+),\s*([A-Z]{2})"/);
      if (match) {
        FIPS_TO_COUNTY_NAME.set(parts[1], { name: match[1], state: match[2] });
      }
    }
  });

  // Calculate county centroids
  const countyZips = new Map<string, Coords[]>();
  
  ZIP_TO_FIPS.forEach((fips, zip) => {
    const coords = ZIP_COORDS.get(zip);
    if (coords) {
      const list = countyZips.get(fips) || [];
      list.push(coords);
      countyZips.set(fips, list);
    }
  });

  countyZips.forEach((zips, fips) => {
    const avgLat = zips.reduce((sum, z) => sum + z.lat, 0) / zips.length;
    const avgLon = zips.reduce((sum, z) => sum + z.lon, 0) / zips.length;
    FIPS_TO_COORDS.set(fips, { lat: avgLat, lon: avgLon });
  });
  
  dataLoaded = true;
}

// Calculate distance between two points in miles
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) ** 2;
    
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Main function: ZIP → counties within radius
export async function findCountiesWithinRadius(zipCode: string, radiusMiles = 100) {
  await loadData();
  
  const centerFips = ZIP_TO_FIPS.get(zipCode);
  if (!centerFips) throw new Error(`ZIP ${zipCode} not found in database`);
  
  const centerCoords = FIPS_TO_COORDS.get(centerFips);
  if (!centerCoords) throw new Error(`No coordinates for county FIPS ${centerFips}`);
  
  const centerCountyInfo = getCountyName(centerFips);
  
  const nearbyCounties: Array<{
    fips: string;
    name: string;
    state: string;
    distance: number;
  }> = [];
  
  for (const [fips, coords] of FIPS_TO_COORDS) {
    const distance = haversineDistance(
      centerCoords.lat, centerCoords.lon,
      coords.lat, coords.lon
    );
    
    if (distance <= radiusMiles) {
      const countyInfo = getCountyName(fips);
      nearbyCounties.push({
        fips,
        name: countyInfo.name,
        state: countyInfo.state,
        distance: Math.round(distance)
      });
    }
  }
  
  nearbyCounties.sort((a, b) => a.distance - b.distance);
  
  return {
    centerCounty: {
      fips: centerFips,
      name: centerCountyInfo.name,
      state: centerCountyInfo.state
    },
    nearbyCounties,
    totalFound: nearbyCounties.length
  };
}

// Extract ZIP from address string
export function extractZipFromAddress(address: string): string | null {
  const match = address.match(/\b\d{5}\b/);
  return match ? match[0] : null;
}