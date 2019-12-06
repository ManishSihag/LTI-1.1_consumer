var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const config = require('./config')
var indexRouter = require('./routes/index');
var launchRouter = require('./routes/launch');
const port = process.env.PORT || config.port;
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/launch', launchRouter);

app.listen(port, ()=>{
  console.log('listening on port ', port);
  })



module.exports = app;
