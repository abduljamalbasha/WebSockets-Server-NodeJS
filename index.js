var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var fs = require('fs');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var config = require('./config/config');
var klaw = require('klaw-sync');
var rimraf = require('rimraf');
var logger = require('./utils/logger').logger;
var uuid = require('uuid/v5');
var { logging } = require('./utils/logs');
var moment = require('moment');
var path = require('path');
var { mongoose } = require('./db/mongoose');
const receiveController = require('./controllers/receive');
const sendController = require('./controllers/send');


app.use(bodyParser.json());
app.use(cors());

require('./routes/sendRoutes')(app);
require('./routes/receiveRoutes')(app);
require('./routes/fetchRoutes')(app);

var clients = {}, fileIndex = 0;


io.on(config.connection, (socket) => {
  socket.on('clientName', (message, callback) => {
    logger.info(message.clientName + '(' + message.clientId + ')' + ' client has connected');
    clients[message.clientId] = socket;
    callback(true);
  });
  socket.on(config.disconnect, (listener, val) => {
    logger.info("User has disconnected " + listener);
  });

  socket.on(config.shipReadyToSend, (value, callback) => {
    if (value.ready === true) {
      setTimeout(() => {
        callback(true);
      }, 1000)
    }
  })

  socket.on(config.shipReadyToReceive, async (value, callback) => {
    let folderPath;
    if (value.ready === true) {
      if (value.clientId === 10001) {
        folderPath = config.communicationDirectory + config.sendDirectory;
      } else {
        folderPath = config.communicationDirectory + config.receiveDirectory + '\\' + value.clientId;
      }
      readDirectory(config.filesToClient, folderPath, value.clientId);
      setInterval(() => {
        readDirectory(config.filesToClient, folderPath, value.clientId);
      }, 30000);
    }
  });

  socket.on(config.filesFromClient, async (message, callback) => {
    var fileName = message.fileName;
    var fileContent = Buffer.from(message.fileContent);
    var destinationId = message.destinationId;
    var timeInitated = message.timeInitated;
    var uuId = uuid(fileName, config.uuid);
    var logText;
    try {
      await directoryExists(config.communicationDirectory);
      if (message.sourceId) {
        await directoryExists(config.communicationDirectory + config.sendDirectory);
        await directoryExists(config.communicationDirectory + config.sendDirectory + '\\' + message.sourceId);
      }
      await directoryExists(config.communicationDirectory + config.receiveDirectory);
      if (destinationId === 10001) {
        await fs.writeFileSync(config.communicationDirectory + config.sendDirectory + '\\' + message.sourceId + '\\' + fileName, fileContent);
        receiveController.addReceivedFiles(fileName, message.sourceId, "Shore", timeInitated, (value) => {
          console.log('value: ', value);
        })
        logText = uuId + " -received file " + fileName + " from vessel " + message.sourceId;
        logger.info(logText);
        callback(logText);
      } else {
        await directoryExists(config.communicationDirectory + config.receiveDirectory + '\\' + destinationId);
        fs.writeFileSync(config.communicationDirectory + config.receiveDirectory + '\\' + destinationId + '\\' + fileName, fileContent);
        receiveController.addReceivedFiles(fileName, "Shore", destinationId, timeInitated, (value) => {
          console.log('value: ', value);
        })
        logText = uuId + " -received file " + fileName + " vessel " + destinationId;
        logger.info(logText);
        callback(logText);
      }
    } catch (error) {
      console.log('error: ', error);
    }
  });
});

function readDirectory(nspName, folderPath, clientId) {
  const files = klaw(folderPath, { nodir: true });
  fileIndex = 0;
  if (files.length !== 0) {
    transportFile(nspName, files, files.length, clientId);
  }
}

async function transportFile(nspName, files, fileCount, clientId) {
  try {
    var url = files[fileIndex].path;
    var folderArr = url.split('\\');
    var fileName = folderArr[folderArr.length - 1];
    var vesselId = folderArr[folderArr.length - 2];
    var sourceId = folderArr[folderArr.length - 3];
    var file_id, source, destination, originSource, originDestination;
    fs.exists(url, async (exists) => {
      if (exists) {
        var startTime = moment(new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Calcutta'
        })).utc();
        if (sourceId === config.sendDirectory) {
          source = "server";
          destination = "Shore";
          originSource = vesselId;
          originDestination = "Shore";
        }
        else {
          source = "server";
          destination = vesselId;
          originSource = "Shore";
          originDestination = vesselId;
        }
        logging(fileName, source, destination, originSource, originDestination, url);
        await sendController.addSendFiles(fileName, originSource, originDestination, (result) => {
          var buff = fs.readFileSync(url);
          var data = Buffer.from(buff);
          console.log(fileName + '   ' + result._id);
          clients[clientId].emit(nspName, { fileName: fileName, fileContent: data, vesselId: vesselId }, async (value) => {
            var endTime = moment(new Date().toLocaleString('en-US', {
              timeZone: 'Asia/Calcutta'
            })).utc();
            await sendController.updateSendFileACK(result._id, endTime.format('DD-MM-YYYY, HH:mm:ss'), (value) => {
              logger.info("ACK - " + value);
              var secondsDifference = endTime.diff(startTime, 'seconds');
              var milliseconds = endTime.diff(startTime, 'milliseconds');
              logger.info(secondsDifference + 's ' + milliseconds + 'ms taken for ' + fileName);
              fs.unlink(url, (err) => {
                if (!err) {
                  if (fileIndex < fileCount - 1) {
                    setTimeout(() => {
                      fileIndex++;
                      transportFile(nspName, files, files.length, clientId);
                    }, 1000)
                  }
                } else {
                  logger.error(err);
                }
              })
            });
          })
        })

      }

    })
  } catch (error) {
    console.log('error: ', error);
  }
}

async function directoryExists(folderPath) {
  try {
    if (!fs.existsSync(folderPath))
      fs.mkdirSync(folderPath);
  } catch (error) {
    console.log('error: ', error);
  }

}

function deleteFolder(folderPath) {
  try {
    rimraf(folderPath, function (err) {
      if (err) {
        console.log('err: ', err);
      } else {
        // console.log("Folder Deleted ", new Date().toLocaleString());
      }
    })
  } catch (error) {
    console.log('error: ', error);
  }
}

app.get('/logs', (req, res) => {
  res.sendFile(path.join(__dirname + '\\log\\trace-logs-' + moment(new Date()).format('DD-MM-YYYY') + '.log'))
})




server.listen(config.port, () => {
  console.log(`Server is up on port ${config.port}`);
});