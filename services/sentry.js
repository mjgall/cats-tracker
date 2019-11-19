const Sentry = require('@sentry/node');
Sentry.init({
  dsn: 'https://0a6a707c297f4f02b6013337086a5fa4@sentry.io/1826941'
});

module.exports = Sentry;
