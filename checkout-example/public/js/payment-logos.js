// Payment method logo utility
class PaymentLogos {
  static getLogoUrl(paymentMethod) {
    const logoMap = {
      'card': 'card',
      'ideal': 'ideal',
      'googlepay': 'googlepay',
      'sepa': 'sepa',
      'klarna': 'klarna',
      'vipps': 'vipps',
      'mobilepay': 'mobilepay',
      'paypal': 'paypal',
      'applepay': 'applepay',
      'alipay': 'alipay',
      'wechatpay': 'wechatpay',
      'bancontact': 'bancontact',
      'eps': 'eps',
      'giropay': 'giropay',
      'sofort': 'sofort',
      'dotpay': 'dotpay',
      'p24': 'p24',
      'blik': 'blik',
      'trustly': 'trustly',
      'afterpay': 'afterpay',
      'clearpay': 'clearpay',
      'affirm': 'affirm',
      'zip': 'zip',
      'laybuy': 'laybuy',
      'ratepay': 'ratepay',
      'klarna_paynow': 'klarna',
      'klarna_paylater': 'klarna',
      'klarna_payover': 'klarna'
    };

    const logoKey = logoMap[paymentMethod.toLowerCase()] || paymentMethod.toLowerCase();
    return `https://checkoutshopper-test.cdn.adyen.com/checkoutshopper/images/logos/${logoKey}.svg`;
  }

  static async loadLogo(paymentMethod, element) {
    try {
      const logoUrl = this.getLogoUrl(paymentMethod);
      console.log('Loading logo for', paymentMethod, ':', logoUrl);
      
      // Create image element
      const img = document.createElement('img');
      img.src = logoUrl;
      img.alt = paymentMethod;
      img.className = 'payment-method-logo';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.maxHeight = '40px';
      
      // Handle load success
      img.onload = () => {
        console.log('Logo loaded successfully for', paymentMethod);
        if (element) {
          element.innerHTML = '';
          element.appendChild(img);
        }
      };
      
      // Handle load error
      img.onerror = () => {
        console.warn('Failed to load logo for', paymentMethod, ':', logoUrl);
        if (element) {
          element.innerHTML = `<span class="payment-method-fallback">${paymentMethod.toUpperCase()}</span>`;
        }
      };
      
      return img;
    } catch (error) {
      console.error('Error loading logo for', paymentMethod, ':', error);
      if (element) {
        element.innerHTML = `<span class="payment-method-fallback">${paymentMethod.toUpperCase()}</span>`;
      }
      return null;
    }
  }

  static async loadLogosForComponents() {
    const components = [
      { id: 'card', name: 'Card' },
      { id: 'ideal', name: 'iDEAL' },
      { id: 'googlepay', name: 'Google Pay' },
      { id: 'sepa', name: 'SEPA' },
      { id: 'klarna', name: 'Klarna' },
      { id: 'vipps', name: 'Vipps' },
      { id: 'mobilepay', name: 'MobilePay' }
    ];

    for (const component of components) {
      const logoElement = document.getElementById(`${component.id}-logo`);
      if (logoElement) {
        await this.loadLogo(component.id, logoElement);
      }
    }
  }
}

// Export for use in other files
window.PaymentLogos = PaymentLogos;
