const { ReceivingModel } = require('../models/ReceiveFiles');
var moment = require('moment');

exports.addReceivedFiles = (fileName, source, originDestination, timeInitiated, callback) => {
  var newfile = new Object();
  newfile.fileName = fileName;
  newfile.source = source;
  newfile.destination = "server";
  newfile.originSource = source;
  newfile.originDestination = originDestination;
  newfile.timeInitiated = timeInitiated;
  newfile.timeReceived = moment(new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Calcutta'
  })).utc().format('DD-MM-YYYY, HH:mm:ss');
  ackReceived = true;
  ReceivingModel.findOne({ fileName: fileName, originSource: source, originDestination: originDestination }, null, (err, res) => {
    if (!res) {
      new ReceivingModel(newfile).save().then(doc => {
        console.log('fileContents', doc);
        callback(doc);
      });
    } else {
      ReceivingModel.updateOne({ fileName: fileName, originSource: source, originDestination: originDestination }, { $set: newfile }, { upsert: true, new: true }, (err, res) => {
        console.log('res: ', res);
        callback(res);
      })
    }
  })

}

exports.getReceiveFiles = (callback) => {
  ReceivingModel.find().sort({ '_id': -1 }).then(res => {
    callback(res);
  })
}