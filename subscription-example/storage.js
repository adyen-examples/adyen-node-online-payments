// storage.js
// Local storage for storing tokens used in the Admin Panel
// ========

// shopper reference: constant value for demo purpose supporting one shopper
const SHOPPER_REFERENCE = "YOUR_UNIQUE_SHOPPER_ID_IOfW3k9G2PvXFu2j";

const getAll = () => {
  return tokens
}

const put = (pToken, pPaymentMethod, pShopperReference) => {
  tokens.push({ recurringDetailReference: pToken, paymentMethod: pPaymentMethod, shopperReference: pShopperReference })
}

const remove = (pToken) => {
  let indexToRemove = tokens.findIndex(obj => obj.recurringDetailReference === pToken);
  tokens.splice(indexToRemove, 1)[0];
}

var tokens = [];

module.exports = { SHOPPER_REFERENCE, getAll, put, remove }




