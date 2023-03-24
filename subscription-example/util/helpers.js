// Handlebar helper to implement IF EQUAL function 
module.exports = {
  ifeq: function(a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  }
};
