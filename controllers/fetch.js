const { SendingModel } = require('../models/SendFile');
const { ReceivingModel } = require('../models/ReceiveFiles');


exports.fetchFiles = async (callback) => {
  var allFiles = [];
  var file = {};
  await SendingModel.find().then(async sendFiles => {
    await ReceivingModel.find().then(receiveFiles => {
      receiveFiles.map(receiveFile => {
        file.fileName = receiveFile.fileName;
        file.originSource = receiveFile.originSource;
        file.originDestination = receiveFile.originDestination;
        file.timeReceived = receiveFile.timeReceived;
        file.timeInitiated = receiveFile.timeInitiated;
        sendFiles.map(sendFile => {
          if (file.fileName === sendFile.fileName && file.originSource === sendFile.originSource && file.originDestination === sendFile.originDestination) {
            file.timeSent = sendFile.timeSent;
            file.ackReceived = sendFile.ackReceived;
            file.ackReceivedTime = sendFile.ackReceivedTime;
            allFiles.push(file);
            file = {};
          }
        })
      })
    })
    callback(allFiles);
  })
}