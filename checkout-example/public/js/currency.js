// Currency mapping utility for order summary
function getCurrencyForCountry(countryId) {
  console.log('Getting currency for country:', countryId);
  const currencyMap = {
    'US': 'USD',
    'GB': 'GBP',
    'NO': 'NOK',
    'SE': 'SEK',
    'DK': 'DKK',
    'CH': 'CHF',
    'JP': 'JPY',
    'CN': 'CNY',
    'KR': 'KRW',
    'BR': 'BRL',
    'MX': 'MXN',
    'AU': 'AUD',
    'CA': 'CAD',
    'IN': 'INR',
    'SG': 'SGD',
    'HK': 'HKD',
    'MY': 'MYR',
    'TH': 'THB',
    'ID': 'IDR',
    'PH': 'PHP',
    'VN': 'VND',
    'RU': 'RUB',
    'PL': 'PLN',
    'CZ': 'CZK',
    'AE': 'AED',
    'KE': 'KES',
    'NZ': 'NZD',
    'NL': 'EUR',
    'DE': 'EUR',
    'FR': 'EUR',
    'ES': 'EUR',
    'IT': 'EUR',
    'AT': 'EUR',
    'BE': 'EUR',
    'FI': 'EUR',
    'IE': 'EUR',
    'LU': 'EUR',
    'PT': 'EUR',
    'SK': 'EUR',
    'SI': 'EUR',
    'EE': 'EUR',
    'LV': 'EUR',
    'LT': 'EUR',
    'MT': 'EUR',
    'CY': 'EUR'
  };
  
  const currency = currencyMap[countryId] || 'EUR';
  console.log('Currency for', countryId, ':', currency);
  return currency;
}

function getCurrencySymbol(currency) {
  const symbolMap = {
    'USD': '$',
    'GBP': '£',
    'EUR': '€',
    'NOK': 'kr',
    'SEK': 'kr',
    'DKK': 'kr',
    'CHF': 'CHF',
    'JPY': '¥',
    'CNY': '¥',
    'KRW': '₩',
    'BRL': 'R$',
    'MXN': '$',
    'AUD': 'A$',
    'CAD': 'C$',
    'INR': '₹',
    'SGD': 'S$',
    'HKD': 'HK$',
    'MYR': 'RM',
    'THB': '฿',
    'IDR': 'Rp',
    'PHP': '₱',
    'VND': '₫',
    'RUB': '₽',
    'PLN': 'zł',
    'CZK': 'Kč',
    'AED': 'د.إ',
    'KES': 'KSh',
    'NZD': 'NZ$'
  };
  
  return symbolMap[currency] || currency;
}

function formatPrice(amount, currency) {
  const symbol = getCurrencySymbol(currency);
  const formattedAmount = (amount / 100).toFixed(2);
  
  // For currencies that put symbol after the amount
  const suffixCurrencies = ['NOK', 'SEK', 'DKK', 'CHF', 'KRW', 'IDR', 'VND', 'RUB', 'PLN', 'CZK', 'KES'];
  
  let result;
  if (suffixCurrencies.includes(currency)) {
    result = `${formattedAmount} ${symbol}`;
  } else {
    result = `${symbol}${formattedAmount}`;
  }
  
  console.log('Formatted price:', amount, currency, '->', result);
  return result;
}

// Export for use in other files
window.getCurrencyForCountry = getCurrencyForCountry;
window.getCurrencySymbol = getCurrencySymbol;
window.formatPrice = formatPrice;
