var mongoose = require('mongoose');

mongoose.Promise = global.Promise;


mongoose.connect('mongodb://abishekg:database12345@ds062178.mlab.com:62178/web-sockets-server', {
  useNewUrlParser: true,
}, (callback) => {
  console.log("Connected!");
});

module.exports = { mongoose };