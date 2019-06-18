var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var yeelight = require('yeelight-awesome');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const leftLight = new yeelight.Yeelight({ lightIp: "192.168.1.102", port: 55443 });
const rightLight = new yeelight.Yeelight({ lightIp: "192.168.1.101", port: 55443 });

leftLight.on("connected", () => {
  leftLight.setHSV(0, 0, 'sudden');
  leftLight.setPower(false, 'sudden');
  console.log("left light connected");
});

leftLight.on("disconnected", () => {
  console.log("left light disconnected");
});

leftLight.connect();

rightLight.on("connected", () => {
  rightLight.setHSV(0, 0, 'sudden');
  rightLight.setPower(false, 'sudden');
  console.log("right light connected");
});

rightLight.on("disconnected", () => {
  console.log("right light disconnected");
});

rightLight.connect();

app.get('/', function(req, res, next) {
  res.render('index', { title: 'Posenet IOT Demo' });
});

app.post('/api/left', async function(req, res, next) {
  try {
    await leftLight.toggle();
    res.status(200).send({ leftLight: 'toggling' });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

app.post('/api/right', async function(req, res, next) {
  try {
    await rightLight.toggle();
    res.status(200).send({ leftLight: 'toggling' });
  } catch (e) {
    console.log(e);
    res.status(500).send(e);
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
