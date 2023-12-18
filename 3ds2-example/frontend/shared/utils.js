export const renderResultTemplate = (result) => {
  console.log("rendering the result:", result);
  const resultTemplate = document.querySelector(".auth-result");
  let resultMessage = document.querySelector("p.auth-result-msg");

  resultMessage.innerHTML = `${result}`;

  resultTemplate.classList.add("show-auth-result");
};

export const attachClickHandlerForReset = () => {
  document.querySelector("button.reset-btn").addEventListener("click", () => {
    console.log("reset view");
    const url = window.location.href;
    if (url.indexOf("redirectResult") !== -1) {
      const baseUrl = url.substring(0, url.indexOf("?")); // remove appended redirectResult from url to reload on reset
      window.location.href = baseUrl;
    } else {
      window.location.reload();
    }
  });
};

export const parseRedirectResultToRequestData = (url) => {
  console.log("parsing the redirect result from the url");
  const redirectResult = url.substring(url.indexOf("=") + 1, url.length); // parse redirectResult from url string

  return {
    details: { redirectResult },
  };
};

export const getFlowType = () => {
  const flowRadioValue = document.querySelector("input[name=flow]:checked").value;
  return flowRadioValue.toString().toLowerCase();
};
