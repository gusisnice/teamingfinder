# Teaming Finder

Find certified federal contractors for federal opportunities.

## What it does

- Enter ZIP, NAICS code, and certification type
- Searches USAspending.gov + SBA database
- Returns top contractors with contact info

## Why

Government contractors need to find certified businesses to partner with for set-aside opportunities.

## Run

```bash
npm install
npm run dev
```

## How it works

1. ZIP → Counties within 100 miles
2. Counties + NAICS + Set-aside → USAspending API (past 5 years)
3. UEI → SBA API (contact details)
4. Filter by active certification
5. Sort by award amount

## Data Sources

- County mapping: HUD ZIP-County crosswalk
- Contract data: USAspending.gov
- Business details: SBA Dynamic Small Business Search