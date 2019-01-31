const receiveController = require('../controllers/receive');


module.exports = (app) => {
  app.get('/fetchReceiveFiles', (req, res) => {
    receiveController.getReceiveFiles((value) => {
      res.send(value);
    })
  });
}