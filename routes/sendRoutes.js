const sendController = require('../controllers/send');

module.exports = (app) => {
  app.get('/fetchSendFiles', (req, res) => {
    sendController.getSendFiles((value) => {
      res.send(value);
    })

  });
}