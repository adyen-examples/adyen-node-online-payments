// handlebars helpers to format/render dates, amount, etc..

const { paymentStatusEnum } = require('../storage.js')

module.exports = {
  // compare function
  ifeq: function(a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  // format date 
  formatDate: function(date) {
    return date.toLocaleString("en-US");
  },
  // format amount (from major units)
  formatAmount: function(amount) {
    return amount / 100;
  },
  // calculate days left 
  expiryDaysToDate: function(date) {
    const diffTime = Math.abs(new Date() - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  }
};
