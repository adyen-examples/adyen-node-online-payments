
// make the form visible
function show(id) {
    element = document.getElementById(id);
    element.removeAttribute("hidden");

    hideOthers(id);
}

// hide forms excepted form with given id
function hideOthers(id) {
    let elements = document.getElementsByClassName("paymentOperationForm");

    for (let i = 0; i < elements.length; i++) {
        if(elements[i].id != id) {
            elements[i].setAttribute("hidden", "hidden");
        }
    }
}


