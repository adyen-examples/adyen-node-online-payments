// storage.js
// Local storage for storing payments used in the Admin Panel
// ========


// payments saved in memory
// contains a list of PaymentModel (pre-authorisations)
// each PaymentModel contains a list of PaymentDetailsModel (each operation performed 
// after pre-authorisation - adjust|extend|capture|reversal)
var payments = [];

class PaymentModel {
  constructor(merchantReference, pspReference, amount, currency, bookingDate, expiryDate, paymentMethodBrand, paymentDetailsModelList) {
    this.merchantReference = merchantReference;
    this.pspReference = pspReference;
    this.amount = amount;
    this.currency = currency;
    this.bookingDate = bookingDate;
    this.expiryDate = expiryDate;
    this.paymentMethodBrand = paymentMethodBrand;
    this.paymentDetailsModelList = paymentDetailsModelList
  }
}

class PaymentDetailsModel {
  constructor(merchantReference, pspReference, originalReference, amount, currency, dateTime, eventCode, refusalReason, paymentMethodBrand, success) {
    this.merchantReference = merchantReference;
    this.pspReference = pspReference;
    this.originalReference = originalReference;
    this.amount = amount;
    this.currency = currency;
    this.dateTime = dateTime;
    this.eventCode = eventCode;
    this.refusalReason = refusalReason;
    this.paymentMethodBrand = paymentMethodBrand;
    this.success = success;
  }
}

// get all payments 
const getAll = () => {
  return payments;
}

// get payment by merchantReference
const getByMerchantReference = (merchantReference) => {
  return payments.find(obj => obj.merchantReference === merchantReference);
}

// add new PaymentDetailsModel to history
const addToHistory = (paymentDetailsModel) => {
  if(paymentDetailsModel.merchantReference == null) {
    throw Error("Merchant Reference is undefined");
  }

  // get payment by merchant reference
  const paymentModel = getByMerchantReference(paymentDetailsModel.merchantReference);

  if(paymentModel == null) {
    console.log("Payment not found in storage - Reference: " + paymentDetailsModel.merchantReference);
  } else {

    // add to history
    paymentModel.paymentDetailsModelList.push(paymentDetailsModel);
    paymentModel.lastUpdated = new Date();
}

}

// update payment given its merchantReference
const updatePayment = (merchantReference, amount, expiryDate) => {
  
  var index = payments.findIndex(x => x.merchantReference === merchantReference);

  if(index >= 0) {
    payments[index].amount = amount;
    payments[index].expiryDate = expiryDate;
  } else {
    console.log("Payment not found in storage - Reference: " + merchantReference);
  }

}


module.exports = { PaymentModel, PaymentDetailsModel, getAll, getByMerchantReference, addToHistory, updatePayment }



  
