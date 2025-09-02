'use client';

import { useState, FormEvent } from 'react';

// Google Analytics type
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js',
      targetId: string | Date,
      config?: {
        [key: string]: string | number;
      }
    ) => void;
  }
}

type ContractorData = {
  recipient_name: string;
  recipient_id: string;
  recipient_uei: string;
  total_awards: number;
  award_count: number;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  year_established: string | null;
  sam_active: boolean;
  sba_certifications: string[];
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ContractorData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    
    const formData = new FormData(e.currentTarget);
    const address = formData.get('address') as string;
    const naicsCode = formData.get('naics') as string;
    const setAsideType = formData.get('setAsideType') as string;
    
    // Track search event in Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: `${naicsCode}_${address}_${setAsideType}`,
        zip_code: address,
        naics_code: naicsCode,
        set_aside_type: setAsideType,
        event_category: 'engagement',
        event_label: 'partner_search'
      });
    }
    
    try {
      const res = await fetch('/api/partner-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, naicsCode, setAsideType })
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Search failed');
      
      setResults(data.contractors);
      if (data.contractors.length === 0) {
        setError('No contractors found matching your criteria');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-medium text-gray-900 mb-1">
          Find Teaming Partners
        </h1>
        <p className="text-gray-500 text-sm mb-10">
          Find certified businesses for an opportunity
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6 mb-10">
          <div>
            <label htmlFor="address" className="block text-sm text-gray-900 mb-2">
              Where is the work?
            </label>
            <input
              id="address"
              name="address"
              type="text"
              required
              maxLength={5}
              onInput={(e) => {
                const input = e.target as HTMLInputElement;
                input.value = input.value.replace(/\D/g, '');
              }}
              placeholder="Add ZIP code"
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-900 transition-all"
            />
          </div>
          
          <div>
            <label htmlFor="naics" className="block text-sm text-gray-900 mb-2">
              What kind of work?
            </label>
            <input
              id="naics"
              name="naics"
              type="text"
              required
              maxLength={6}
              pattern="\d{2,6}"
              onInput={(e) => {
                const input = e.target as HTMLInputElement;
                input.value = input.value.replace(/\D/g, '');
              }}
              placeholder="Add NAICS code"
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-900 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-900 mb-2">
              What certification needed?
            </label>
            <div className="relative">
              <input type="hidden" name="setAsideType" id="setAsideTypeInput" required />
              <button
                type="button"
                id="dropdownButton"
                className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-900 transition-all text-left flex justify-between items-center"
                data-value=""
                onClick={() => {
                  const dropdown = document.getElementById('dropdownMenu') as HTMLElement | null;
                  const arrow = document.getElementById('dropdownArrow') as HTMLElement | null;
                  if (dropdown && arrow) {
                    const isOpen = dropdown.classList.contains('opacity-100');
                    if (isOpen) {
                      dropdown.classList.remove('opacity-100', 'visible');
                      dropdown.classList.add('opacity-0', 'invisible');
                      arrow.classList.remove('rotate-180');
                    } else {
                      dropdown.classList.remove('opacity-0', 'invisible');
                      dropdown.classList.add('opacity-100', 'visible');
                      arrow.classList.add('rotate-180');
                    }
                  }
                }}
              >
                <span className="text-gray-500">
                  Select certification type
                </span>
                <svg id="dropdownArrow" className="h-4 w-4 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div id="dropdownMenu" className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible transition-all">
                {[
                  { value: '8(a)', label: '8(a)' },
                  { value: 'HUBZone', label: 'HUBZone' },
                  { value: 'WOSB', label: 'Women-Owned Small Business' },
                  { value: 'SDVOSB', label: 'Service-Disabled Veteran-Owned Small Business' },
                  { value: 'EDWOSB', label: 'Economically Disadvantaged Women-Owned Small Business' }
                ].map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const button = document.getElementById('dropdownButton') as HTMLButtonElement;
                      const input = document.getElementById('setAsideTypeInput') as HTMLInputElement;
                      const dropdown = document.getElementById('dropdownMenu') as HTMLDivElement;
                      const arrow = document.getElementById('dropdownArrow') as HTMLElement;
                      const span = button.querySelector('span') as HTMLSpanElement;
                      button.dataset.value = option.value;
                      input.value = option.value;
                      span.textContent = option.label;
                      span.className = 'text-gray-900';
                      dropdown.classList.remove('opacity-100', 'visible');
                      dropdown.classList.add('opacity-0', 'invisible');
                      arrow.classList.remove('rotate-180');
                    }}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
            
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Finding Partners...' : 'Find Partners'}
          </button>
        </form>
        
        {error && (
          <div className="text-red-600 text-sm mb-8">
            {error}
          </div>
        )}
        
        {results && results.length > 0 && (
          <div className="space-y-3">
            {results.map((contractor) => (
              <article 
                key={contractor.recipient_id} 
                className={`bg-gray-50 rounded-lg p-5 ${contractor.website ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={() => {
                  if (contractor.website) {
                    let url = contractor.website;
                    // Remove www. prefix
                    url = url.replace(/^(https?:\/\/)?(www\.)?/, '');
                    // Always use https://
                    url = `https://${url}`;
                    
                    // Track contractor click event
                    if (typeof window !== 'undefined' && window.gtag) {
                      window.gtag('event', 'contractor_click', {
                        contractor_name: contractor.recipient_name,
                        contractor_website: url,
                        event_category: 'engagement',
                        event_label: 'website_visit'
                      });
                    }
                    
                    window.open(url, '_blank');
                  }
                }}
              >
                <h3 className="font-medium text-gray-900 mb-3">
                  {contractor.recipient_name}
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  {contractor.contact_person && (
                    <div className="space-y-1">
                      <p>{contractor.contact_person.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</p>
                      {contractor.email && <p>{contractor.email}</p>}
                      {contractor.phone && (
                        <p>
                          ({contractor.phone.slice(0, 3)}) {contractor.phone.slice(3, 6)}-{contractor.phone.slice(6, 10)}
                        </p>
                      )}
                    </div>
                  )}
                  {contractor.year_established && (
                    <p>Established {contractor.year_established}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}