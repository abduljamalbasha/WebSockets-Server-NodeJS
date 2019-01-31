const { SendingModel } = require('../models/SendFile');
var moment = require('moment');

exports.addSendFiles = (fileName, originSource, destination, callback) => {
  var newfile = new Object();
  newfile.fileName = fileName;
  newfile.source = "server";
  newfile.destination = destination;
  newfile.originSource = originSource;
  newfile.originDestination = destination;
  newfile.timeSent = moment(new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Calcutta'
  })).utc().format('DD-MM-YYYY, HH:mm:ss');
  SendingModel.findOne({ fileName: fileName, originSource: originSource, originDestination: destination }, null, (err, res) => {
    if (!res) {
      new SendingModel(newfile).save().then(doc => {
        console.log('fileContents', doc);
        callback(doc);
      });
    } else {
      SendingModel.updateOne({ fileName: fileName, originSource: originSource, originDestination: destination }, { $set: newfile }, { upsert: true, new: true }, (err, res) => {
        console.log('res: ', res);
        callback(res);
      })
    }
  });
}

exports.updateSendFileACK = async (id, ackReceivedTime, callback) => {
  await SendingModel.findByIdAndUpdate(id, { $set: { ackReceived: true, ackReceivedTime: ackReceivedTime } }, { new: true }, (err, result) => {
  }).then(res => {
    callback(res);
  })
}

exports.getSendFiles = (callback) => {
  SendingModel.find().sort({ '_id': -1 }).then(res => {
    callback(res);
  })
}

