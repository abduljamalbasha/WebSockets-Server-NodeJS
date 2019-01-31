const mongoose = require('mongoose');


const sendSchema = new mongoose.Schema({
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
  timeSent: {
    type: String,
    required: true,
  },
  ackReceived: {
    type: Boolean,
    default: false
  },
  ackReceivedTime: {
    type: String,
    required: false,
  }
});

var SendingModel = mongoose.model('sendSchema', sendSchema);

module.exports = { SendingModel };
