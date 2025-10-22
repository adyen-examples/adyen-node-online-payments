const countries = [
    {
        id: 'AU',
        name: 'Australia'
    },
    {
        id: 'AT',
        name: 'Austria'
    },
    {
        id: 'BE',
        name: 'Belgium'
    },
    {
        id: 'BR',
        name: 'Brazil'
    },
    {
        id: 'CA',
        name: 'Canada'
    },
    {
        id: 'CN',
        name: 'China'
    },
    {
        id: 'CZ',
        name: 'Czech Republic'
    },
    {
        id: 'DK',
        name: 'Denmark'
    },
    {
        id: 'FI',
        name: 'Finland'
    },
    {
        id: 'FR',
        name: 'France'
    },
    {
        id: 'DE',
        name: 'Germany'
    },
    {
        id: 'HK',
        name: 'Hong Kong'
    },
    {
        id: 'IN',
        name: 'India'
    },
    {
        id: 'ID',
        name: 'Indonesia'
    },
    {
        id: 'IT',
        name: 'Italy'
    },
    {
        id: 'JP',
        name: 'Japan'
    },
    {
        id: 'KE',
        name: 'Kenya'
    },
    {
        id: 'MY',
        name: 'Malaysia'
    },
    {
        id: 'MX',
        name: 'Mexico'
    },
    {
        id: 'NL',
        name: 'Netherlands'
    },
    {
        id: 'NO',
        name: 'Norway'
    },
    {
        id: 'NZ',
        name: 'New Zealand'
    },
    {
        id: 'PH',
        name: 'Philippines'
    },
    {
        id: 'PL',
        name: 'Poland'
    },
    {
        id: 'PT',
        name: 'Portugal'
    },
    {
        id: 'RU',
        name: 'Russia'
    },
    {
        id: 'SG',
        name: 'Singapore'
    },
    {
        id: 'KR',
        name: 'South Korea'
    },
    {
        id: 'ES',
        name: 'Spain'
    },
    {
        id: 'SE',
        name: 'Sweden'
    },
    {
        id: 'CH',
        name: 'Switzerland'
    },
    {
        id: 'TH',
        name: 'Thailand'
    },
    {
        id: 'AE',
        name: 'United Arab Emirates'
    },
    {
        id: 'GB',
        name: 'United Kingdom'
    },
    {
        id: 'US',
        name: 'United States'
    },
    {
        id: 'VN',
        name: 'Vietnam'
    }
];

// Function to get country flag URL
function getCountryFlagUrl(countryCode) {
    return `https://ca-test.adyen.com/ca/adl/img/flags/${countryCode.toLowerCase()}.svg`;
}

// Function to find country by ID
function findCountryById(countryId) {
    return countries.find(country => country.id === countryId);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { countries, getCountryFlagUrl, findCountryById };
}
