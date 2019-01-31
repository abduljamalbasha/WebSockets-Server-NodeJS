const fetchController = require('../controllers/fetch');


module.exports = (app) => {
  app.get('/fetchFiles', (req, res) => {
    fetchController.fetchFiles((value) => {
      res.send(value);
    })
  });
}