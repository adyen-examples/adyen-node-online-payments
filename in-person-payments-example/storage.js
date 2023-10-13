// storage.js
// Local storage for storing Payment Links created by the app
// ========

global.STATUS_PAID = "Paid";
global.STATUS_NOTPAID = "NotPaid";
global.STATUS_INPROGRESS = "InProgress";
global.STATUS_REFUNDINPROGRESS = "RefundInProgress";
global.STATUS_REFUNDFAILED = "RefundFailed";


const getTables = () => {
    return tables
  }

function init_tables() {
  for (var i = 0; i < 4; i++) {
    const tableNumber = i + 1;
    tables.push({
      "tableName": "Table " + tableNumber,
      "amount": 22.22 * tableNumber,
      "currency": "EUR",
      "paymentStatus": "NotPaid"
    });
  }


}

const getTable = (tableName) => {
  let index = tables.findIndex(obj => obj.tableName === tableName);

  if(index == -1) {
    throw new Error("Table " + tableName + " not found");
  }

  return tables[index];

}

const saveTable = (pTable) => {
  let indexToUpdate = tables.findIndex(obj => obj.tableName === pTable.tableName);
  if(indexToUpdate > -1) {
    tables[indexToUpdate] = pTable;
  }

}

const update = (pLink) => {
  let indexToUpdate = links.findIndex(obj => obj.id === pLink.id);
  if(indexToUpdate > -1) {
    pLink.expiresAt = formatDate(pLink.expiresAt)
    links[indexToUpdate] = pLink;
  }
}

// format as dd-mm-yyyy hh:mi
const formatDate = (dateString) => {

  const date = new Date(dateString);

  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  };
  
  return date.toLocaleString('nl-NL', options);
}

var tables = [];

init_tables();

module.exports = { getTables, getTable, saveTable, update }



  
