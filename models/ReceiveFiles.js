const mongoose = require('mongoose');


const receiveSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  destination: {
    type: String,
    required: true,
  },
  originSource: {
    type: String,
    required: true,
  },
  originDestination: {
    type: String,
    required: true
  },
  timeReceived: {
    type: String,
    required: true,
  },
  timeInitiated: {
    type: String,
    required: true,
  }
});

var ReceivingModel = mongoose.model('receivedValues', receiveSchema);

module.exports = { ReceivingModel };
