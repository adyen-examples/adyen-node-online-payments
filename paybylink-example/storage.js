// storage.js
// Local storage for storing Payment Links created by the app
// ========


const getAll = () => {
    return links
  }

const put = (pLinkId, pReference, pUrl, pExpiresAt, pStatus, pIsReusable) => {
  links.push({ id: pLinkId, reference: pReference, url:pUrl, expiresAt: formatDate(pExpiresAt), 
    status: pStatus, isReusable: pIsReusable })
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

var links = [];

module.exports = { getAll, put, update }



  
