module.exports = {
  ifeq: function(a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },
  // format date 
  getStatusClass: function(status) {
    let cssClass = undefined;

    if(status === "Paid") {
      cssClass = "paid";
    } else if(status === "NotPaid") {
      cssClass = "not-paid";
    } else if(status === "PaymentInProgress") {
      cssClass =  "disabled";
    } else if(status === "RefundInProgress") {
      cssClass =  "disabled";
    } else if(status === "Refunded") {
      cssClass =  "disabled";
    } else if(status === "RefundedFailed") {
      cssClass =  "refund-failed";
    } else if(status === "RefundReversed") {
      cssClass =  "disabled";
    }

    return cssClass;
  }
};
