// Locale mapping utility for Adyen payment components
function getLocaleForCountry(countryId) {
  // Map country codes to locales
  const localeMap = {
    'BR': 'pt-BR',
    'CN': 'zh-CN',
    'DK': 'da-DK',
    'DE': 'de-DE',
    'ES': 'es-ES',
    'FR': 'fr-FR',
    'IT': 'it-IT',
    'JP': 'ja-JP',
    'NL': 'nl-NL',
    'NO': 'no-NO',
    'PL': 'pl-PL',
    'RU': 'ru-RU',
    'SE': 'sv-SE',
    'TW': 'zh-TW',
    'US': 'en-US',
    'GB': 'en-GB',
    'AU': 'en-AU',
    'CA': 'en-CA',
    'MX': 'es-MX',
    'KR': 'ko-KR',
    'FI': 'fi-FI',
    'AT': 'de-AT',
    'CH': 'de-CH',
    'BE': 'nl-BE',
    'PT': 'pt-PT',
    'IN': 'en-IN',
    'SG': 'en-SG',
    'HK': 'en-HK',
    'MY': 'en-MY',
    'TH': 'th-TH',
    'ID': 'id-ID',
    'PH': 'en-PH',
    'VN': 'vi-VN',
    'CZ': 'cs-CZ',
    'AE': 'en-AE',
    'KE': 'en-KE',
    'NZ': 'en-NZ'
  };
  
  const locale = localeMap[countryId] || 'en-US';
  console.log('Locale for country', countryId, ':', locale);
  return locale;
}

// Export for use in other files
window.getLocaleForCountry = getLocaleForCountry;
