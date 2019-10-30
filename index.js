const path = require('path');

const express = require('express');
const app = express();

const http = require('http').createServer(app);
const io = require('socket.io').listen(http);

//
const cookieSession = require('cookie-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const keys = require('./config/keys');

require('./services/passport');

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
  // like our main.js file, or main.css file!
  app.use(express.static(path.join(__dirname, 'client', 'build')));

  // Express will serve up the index.html file
  // if it doesn't recognize the route
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

io.sockets.on('connection', socket => {
  socket.on('arrival', details => {
    console.log(details);
    io.sockets.emit('arrival', details);
  });
});

http.listen(process.env.PORT || 2001, () =>
  console.log("We're running on 2001")
);
