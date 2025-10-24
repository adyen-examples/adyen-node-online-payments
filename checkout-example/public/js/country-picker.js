// Country Picker functionality
class CountryPicker {
    constructor() {
        this.currentCountry = 'NL'; // Default to Netherlands
        this.dropdown = document.getElementById('countryDropdown');
        this.picker = document.getElementById('countryPicker');
        this.flag = document.getElementById('countryFlag');
        this.name = document.getElementById('countryName');
        
        this.init();
    }
    
    init() {
        if (!this.dropdown || !this.picker) return;
        
        // Check if there's a stored country preference
        const storedCountry = localStorage.getItem('selectedCountry');
        if (storedCountry) {
            console.log('Found stored country:', storedCountry);
            // Ensure we only store the country ID, not an object
            try {
                const parsed = JSON.parse(storedCountry);
                this.currentCountry = parsed.id || parsed;
            } catch (e) {
                this.currentCountry = storedCountry;
            }
        } else {
            // No stored preference, default to Netherlands
            console.log('No stored country preference, defaulting to Netherlands');
            this.currentCountry = 'NL';
            localStorage.setItem('selectedCountry', 'NL');
        }
        
        this.populateDropdown();
        this.bindEvents();
        this.setCountry(this.currentCountry);
    }
    
    populateDropdown() {
        if (!this.dropdown) return;
        
        this.dropdown.innerHTML = '';
        
        countries.forEach(country => {
            const option = document.createElement('div');
            option.className = 'country-option';
            option.dataset.countryId = country.id;
            
            option.innerHTML = `
                <img src="${getCountryFlagUrl(country.id)}" alt="${country.name}" class="country-option-flag">
                <span class="country-option-name">${country.name}</span>
            `;
            
            option.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Country option clicked:', country.id);
                this.selectCountry(country.id);
            });
            
            this.dropdown.appendChild(option);
        });
    }
    
    bindEvents() {
        // Toggle dropdown on click
        this.picker.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.picker.contains(e.target)) {
                this.closeDropdown();
            }
        });
        
        // Close dropdown on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
    }
    
    toggleDropdown() {
        this.dropdown.classList.toggle('show');
        this.picker.classList.toggle('open');
    }
    
    closeDropdown() {
        this.dropdown.classList.remove('show');
        this.picker.classList.remove('open');
    }
    
    selectCountry(countryId) {
        console.log('Selecting country:', countryId);
        this.setCountry(countryId);
        this.closeDropdown();
        this.onCountryChange(countryId);
    }
    
    setCountry(countryId) {
        const country = findCountryById(countryId);
        if (!country) {
            console.log('Country not found for ID:', countryId);
            return;
        }
        
        console.log('Setting country to:', countryId, country.name);
        this.currentCountry = countryId;
        
        // Update display
        this.flag.src = getCountryFlagUrl(countryId);
        this.flag.alt = country.name;
        this.name.textContent = country.name;
        
        // Update selected state in dropdown
        this.dropdown.querySelectorAll('.country-option').forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.countryId === countryId) {
                option.classList.add('selected');
            }
        });
    }
    
    onCountryChange(countryId) {
        // Ensure we have just the country ID, not an object
        const cleanCountryId = typeof countryId === 'string' ? countryId : countryId.id || countryId;
        console.log('Country changed to:', cleanCountryId);
        
        // Store selected country in localStorage
        localStorage.setItem('selectedCountry', cleanCountryId);
        
        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent('countryChanged', {
            detail: { countryId: cleanCountryId, country: findCountryById(cleanCountryId) }
        }));
        
        // If we're on a dropin page, reload the payment methods
        if (window.location.pathname.includes('/checkout/dropin')) {
            this.reloadDropinPaymentMethods(cleanCountryId);
        }
    }
    
    reloadDropinPaymentMethods(countryId) {
        // Ensure we have just the country ID, not an object
        const cleanCountryId = typeof countryId === 'string' ? countryId : countryId.id || countryId;
        console.log('Reloading dropin with country:', cleanCountryId);
        
        // Find the dropin container and reload it
        const dropinContainer = document.getElementById('dropin-container');
        if (dropinContainer && window.adyenCheckout) {
            // Destroy existing checkout instance
            if (window.adyenCheckoutInstance) {
                window.adyenCheckoutInstance.unmount();
            }
            
            // Reload with new country
            this.loadDropinWithCountry(cleanCountryId);
        }
    }
    
    async loadDropinWithCountry(countryId) {
        try {
            // Ensure we have just the country ID, not an object
            const cleanCountryId = typeof countryId === 'string' ? countryId : countryId.id || countryId;
            console.log('Loading dropin with country:', cleanCountryId);
            
            // Get new session with country parameter
            const response = await fetch(`/api/sessions?country=${encodeURIComponent(cleanCountryId)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const session = await response.json();
            
            // Create new checkout instance
            const configuration = {
                session: session,
                clientKey: document.getElementById("clientKey").innerHTML,
                environment: "test",
                locale: this.getLocaleForCountry(cleanCountryId),
                countryCode: cleanCountryId,
                showPayButton: true,
                onPaymentCompleted: (result, component) => {
                    console.info("onPaymentCompleted", result, component);
                    this.handleOnPaymentCompleted(result.resultCode);
                },
                onPaymentFailed: (result, component) => {
                    console.info("onPaymentFailed", result, component);
                    this.handleOnPaymentFailed(result.resultCode);
                },
                onError: (error, component) => {
                    console.error("onError", error.name, error.message, error.stack, component);
                    window.location.href = "/result/error";
                },
            };
            
            const adyenCheckout = await AdyenCheckout(configuration);
            const dropin = new Dropin(adyenCheckout).mount('#dropin-container');
            
            window.adyenCheckoutInstance = adyenCheckout;
            
        } catch (error) {
            console.error('Error reloading dropin:', error);
        }
    }
    
    getLocaleForCountry(countryId) {
        // Map country codes to locales
        const localeMap = {
            'US': 'en_US',
            'GB': 'en_GB',
            'NL': 'nl_NL',
            'DE': 'de_DE',
            'FR': 'fr_FR',
            'ES': 'es_ES',
            'IT': 'it_IT',
            'NO': 'no_NO',
            'SE': 'sv_SE',
            'DK': 'da_DK',
            'FI': 'fi_FI',
            'JP': 'ja_JP',
            'CN': 'zh_CN',
            'KR': 'ko_KR',
            'BR': 'pt_BR',
            'MX': 'es_MX',
            'AU': 'en_AU',
            'CA': 'en_CA',
            'IN': 'en_IN',
            'SG': 'en_SG',
            'HK': 'en_HK',
            'MY': 'en_MY',
            'TH': 'th_TH',
            'ID': 'id_ID',
            'PH': 'en_PH',
            'VN': 'vi_VN',
            'RU': 'ru_RU',
            'PL': 'pl_PL',
            'CZ': 'cs_CZ',
            'AT': 'de_AT',
            'CH': 'de_CH',
            'BE': 'nl_BE',
            'PT': 'pt_PT',
            'AE': 'en_AE',
            'KE': 'en_KE',
            'NZ': 'en_NZ'
        };
        
        return localeMap[countryId] || 'en_US';
    }
    
    handleOnPaymentCompleted(resultCode) {
        switch (resultCode) {
            case "Authorised":
                window.location.href = "/result/success";
                break;
            case "Pending":
            case "Received":
                window.location.href = "/result/pending";
                break;
            default:
                window.location.href = "/result/error";
                break;
        }
    }
    
    handleOnPaymentFailed(resultCode) {
        switch (resultCode) {
            case "Cancelled":
            case "Refused":
                window.location.href = "/result/failed";
                break;
            default:
                window.location.href = "/result/error";
                break;
        }
    }
}

// Initialize country picker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing country picker...');
    new CountryPicker();
});
