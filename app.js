var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var engine = require('ejs-locals');
var fsx = require('fs-extra');
const eventHub = require(__dirname + '/utils/event-hub');
const cron = require("node-cron");

var hostname = 'localhost';
var port = 3000;
var apiVersion = "v1";
var app = express();

// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('common', {
  stream: fsx.createWriteStream('/tmp/network-status-service-access.log', { flags: 'a' })
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));

// A list of routers
var routes = require('./routes/index');
var statusRouter = require('./routes/statusRouter');
app.use('/', routes);
app.use('/api/' + apiVersion + '/status', statusRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

eventHub.registerEventAllHubs();

cron.schedule("* * * * *", function () {
  console.log("running a task every minute");
  eventHub.registerEventAllHubs();
});

module.exports = app;
