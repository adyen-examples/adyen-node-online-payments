// Locale mapping utility for Adyen payment components
function getLocaleForCountry(countryId) {
  // Map country codes to locales
  const localeMap = {
    'BR': 'pt_BR',
    'CN': 'zh_CN',
    'DK': 'da_DK',
    'DE': 'de_DE',
    'ES': 'es_ES',
    'FR': 'fr_FR',
    'IT': 'it_IT',
    'JP': 'ja_JP',
    'NL': 'nl_NL',
    'NO': 'no_NO',
    'PL': 'pl_PL',
    'RU': 'ru_RU',
    'SE': 'sv_SE',
    'TW': 'zh_TW',
    'US': 'en_US',
    'GB': 'en_GB',
    'AU': 'en_AU',
    'CA': 'en_CA',
    'MX': 'es_MX',
    'KR': 'ko_KR',
    'FI': 'fi_FI',
    'AT': 'de_AT',
    'CH': 'de_CH',
    'BE': 'nl_BE',
    'PT': 'pt_PT',
    'IN': 'en_IN',
    'SG': 'en_SG',
    'HK': 'en_HK',
    'MY': 'en_MY',
    'TH': 'th_TH',
    'ID': 'id_ID',
    'PH': 'en_PH',
    'VN': 'vi_VN',
    'CZ': 'cs_CZ',
    'AE': 'en_AE',
    'KE': 'en_KE',
    'NZ': 'en_NZ'
  };
  
  const locale = localeMap[countryId] || 'en_US';
  return locale;
}

// Export for use in other files
window.getLocaleForCountry = getLocaleForCountry;
