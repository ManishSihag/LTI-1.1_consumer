var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const config = require('./config')
var indexRouter = require('./routes/index');
var launchRouter = require('./routes/launch');
var showResult = require('./routes/result')
const port = process.env.PORT || config.port;
const xmlparser = require('express-xml-bodyparser');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(xmlparser());

app.use('/', indexRouter);
app.use('/launch', launchRouter);
app.use('/result', showResult);

app.listen(port, ()=>{
  console.log('listening on port ', port);
  })



module.exports = app;
