/**
 * currencyService.js
 * 
 * Provides localized pricing based on the user's locale.
 * Uses regional price points (standard SaaS strategy) rather than pure exchange rates
 * to maintain purchasing power parity.
 */

const REGIONAL_PRICING = {
  'IN': {
    currency: 'INR',
    symbol: '₹',
    plans: {
      pro: 249,
      family: 599,
      yearly_discount: 'Save 33%'
    }
  },
  'EU': {
    currency: 'EUR',
    symbol: '€',
    plans: {
      pro: 6.99,
      family: 16.99,
      yearly_discount: 'Save 33%'
    }
  },
  'GB': {
    currency: 'GBP',
    symbol: '£',
    plans: {
      pro: 5.99,
      family: 14.99,
      yearly_discount: 'Save 33%'
    }
  },
  'US': {
    currency: 'USD',
    symbol: '$',
    plans: {
      pro: 6.99,
      family: 16.99,
      yearly_discount: 'Save 33%'
    }
  },
  'CA': {
    currency: 'CAD',
    symbol: '$',
    plans: {
      pro: 8.99,
      family: 21.99,
      yearly_discount: 'Save 33%'
    }
  },
  'AU': {
    currency: 'AUD',
    symbol: '$',
    plans: {
      pro: 9.99,
      family: 24.99,
      yearly_discount: 'Save 33%'
    }
  }
};

const DEFAULT_PRICING = REGIONAL_PRICING['US'];

export const getDetectedCountry = () => {
  try {
    const locale = navigator.language || 'en-US';
    
    // Check for explicit country code (e.g., en-GB)
    const parts = locale.split('-');
    if (parts.length > 1) {
      const code = parts[1].toUpperCase();
      if (REGIONAL_PRICING[code]) return code;
      // Handle special cases
      if (['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI'].includes(code)) return 'EU';
    }
    
    // Fallback detection for specific languages
    if (locale.startsWith('hi')) return 'IN';
    if (locale.startsWith('fr') || locale.startsWith('de') || locale.startsWith('it')) return 'EU';
    if (locale.startsWith('en-IN')) return 'IN';
    if (locale.startsWith('en-GB')) return 'GB';
    if (locale.startsWith('en-AU')) return 'AU';
    if (locale.startsWith('en-CA')) return 'CA';
    
    return 'US';
  } catch (e) {
    return 'US';
  }
};

/**
 * Returns all supported regions for the UI switcher.
 */
export const getSupportedRegions = () => Object.keys(REGIONAL_PRICING);

/**
 * Returns the localized pricing object for the detected or specified region.
 */
export const getLocalizedPricing = (countryCode = getDetectedCountry()) => {
  // Handle Eurozone mapping
  const euroZone = ['FR', 'DE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI'];
  if (euroZone.includes(countryCode)) return REGIONAL_PRICING['EU'];
  
  return REGIONAL_PRICING[countryCode] || DEFAULT_PRICING;
};

/**
 * Formats a number as a local currency string.
 */
export const formatCurrency = (amount, countryCode = getDetectedCountry()) => {
  const pricing = getLocalizedPricing(countryCode);
  return new Intl.NumberFormat(navigator.language, {
    style: 'currency',
    currency: pricing.currency,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
};
