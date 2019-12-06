var express = require('express');
var router = express.Router();
const ltiParams = require('../ltiParams')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Consumer',
  ltiParameters : ltiParams } );
});

module.exports = router;
