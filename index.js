const path = require('path');

const express = require('express');
const app = express();

const Sentry = require('@sentry/node');

Sentry.init({ dsn: 'https://0a6a707c297f4f02b6013337086a5fa4@sentry.io/1826941' });

const http = require('http').createServer(app);
const io = require('socket.io').listen(http);

const cookieSession = require('cookie-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const keys = require('./config/keys');

require('./services/passport');

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  cookieSession({ maxAge: 30 * 24 * 60 * 60 * 1000, keys: [keys.cookieKey] })
);

app.use(passport.initialize());
app.use(passport.session());

//ROUTES
//AUTH
require('./routes/authRoutes')(app);
//APP
require('./routes/appRoutes')(app);

//CONDITIONS IF DEPLOYED TO PRODUCTION
if (process.env.NODE_ENV === 'production') {
  // Express will serve up production assets
  app.use(express.static(path.join(__dirname, 'client', 'build')));

  // Express will serve up the index.html file
  // if it doesn't recognize the route
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

io.sockets.on('connection', (socket) => {

  console.log('a user connected');
  socket.on('arrival', details => {
    console.log(details);
    io.sockets.emit('arrival', details);
  });
});


// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

http.listen(process.env.PORT || 2001, () =>
  console.log("We're running on 2001")
);
