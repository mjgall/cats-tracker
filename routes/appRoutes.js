const getTeam = require('../queries/getTeam');
const addArrival = require('../queries/addArrival');
const addDeparture = require('../queries/addDeparture');
const mostRecentUserArrival = require('../queries/mostRecentUserArrival');
const mostRecentUserDeparture = require('../queries/mostRecentUserDeparture');
const getMostRecentDepartures = require('../queries/getMostRecentDepartures');

const Sentry = require('../services/sentry');

module.exports = app => {
  app.get('/api/debug-sentry', function mainHandler(req, res) {
    console.log('Sentry debug error test');
    throw new Error('My first Sentry error!');
  });

  app.get('/api/team', async (req, res) => {
    try {
      const team = await getTeam();
      res.send(team);
    } catch (error) {
      Sentry.captureException(error)
    }
  });

  app.get('/api/team/departures', async (req, res) => {
    try {
      const mostRecentDepartures = await getMostRecentDepartures();
      res.send(mostRecentDepartures);
    } catch (error) {
      Sentry.captureException(error)
    }
  });

  app.post('/api/arrival', async (req, res) => {
    try {
      const arrival = await addArrival(req.body);
      res.send(arrival);
    } catch (error) {
      Sentry.captureException(error)
    }
  });

  app.post('/api/departure', async (req, res) => {
    try {
      const departure = await addDeparture(req.body);
      res.send(departure);
    } catch (error) {
      Sentry.captureException(error)
    }
  });

  app.get('/api/arrival/:user_id', async (req, res) => {
    try {
      const arrival = await mostRecentUserArrival(req.params.user_id);
      res.send(arrival);
    } catch (error) {
      Sentry.captureException(error)
    }
  });

  app.get('/api/departure/:user_id', async (req, res) => {
    try {
      const departure = await mostRecentUserDeparture(req.params.user_id);
      res.send(departure);
    } catch (error) {
      Sentry.captureException(error)
    }
  });
};
