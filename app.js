var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var nodebb = require('./routes/nodebb');
var cors = require('cors');
var app = express();
const telemetry = new (require('./libs/sb_telemetry_util/telemetryService'))()

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors());
app.all('/health', (req,res,next) => {
  res.send({statusCode: 200, message: "health api"})
})
app.use('/', nodebb);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.get('/', (req,res)=>{
  logger.info({message: 'request:'+req})
  if (req.session && req.session.authenticated ) {
    logInfo('User is authenticated.. Updating Cookie with Secure and SameSite flags')
    res.cookie('express.sid', req.cookies['express.sid'], {
        httpOnly: true,
        maxAge: CONSTANTS.KEYCLOAK_SESSION_TTL,
        sameSite: 'Strict',
        secure: true,
    })
}
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

telemetry.init({
  pdata: { id: 'discussion-middleware', ver: '1.0.0' },
  // method: 'POST',
  batchsize: process.env.sunbird_telemetry_sync_batch_size || 1, 
  // endpoint: telemetryEventConfig.endpoint,
  // host: envHelper.TELEMETRY_SERVICE_LOCAL_URL,
  // authtoken: 'Bearer ' + envHelper.PORTAL_API_AUTH_TOKEN
})
module.exports = app;
