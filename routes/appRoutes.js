const getTeam = require('../queries/getTeam');
const addArrival = require('../queries/addArrival');
const addLateArrival = require('../queries/addLateArrival');
const addDeparture = require('../queries/addDeparture');
const mostRecentUserArrival = require('../queries/mostRecentUserArrival');
const mostRecentUserDeparture = require('../queries/mostRecentUserDeparture');
const getMostRecentDepartures = require('../queries/getMostRecentDepartures');

const Sentry = require('../services/sentry');
//typo in addLateArrival filename
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
      Sentry.captureException(error);
    }
  });

  app.get('/api/team/departures', async (req, res) => {
    try {
      const mostRecentDepartures = await getMostRecentDepartures();
      res.send(mostRecentDepartures);
    } catch (error) {
      Sentry.captureException(error);
    }
  });

  app.post('/api/arrival', async (req, res) => {
    try {
      const arrival = await addArrival(req.body);
      res.send(arrival);
    } catch (error) {
      Sentry.captureException(error);
    }
  });

  app.post('/api/latearrival', async (req, res) => {
    console.log(req.body);
    try {
      const arrival = await addLateArrival(req.body.timestamp, req.body.userId);
      console.log(arrival);
      res.send(arrival);
    } catch (error) {
      console.log(error);
      Sentry.captureException(error);
    }
  });

  app.post('/api/departure', async (req, res) => {
    try {
      const departure = await addDeparture(req.body);
      res.send(departure);
    } catch (error) {
      Sentry.captureException(error);
    }
  });

  app.get('/api/arrival/:user_id', async (req, res) => {
    try {
      const arrival = await mostRecentUserArrival(req.params.user_id);
      res.send(arrival);
    } catch (error) {
      Sentry.captureException(error);
    }
  });

  app.get('/api/departure/:user_id', async (req, res) => {
    try {
      const departure = await mostRecentUserDeparture(req.params.user_id);
      res.send(departure);
    } catch (error) {
      Sentry.captureException(error);
    }
  });

  app.get('/api/button-arrival/:userId', async (req, res) => {
    //query string should have a userId on it
    console.log(req.params)
    const userId = req.params.userId;
    try {
      const arrival = await addArrival({ id: userId });
      console.log(arrival)
      const departure = await addDeparture(arrival);
      res.send(departure);
    } catch (error) {
 
      Sentry.captureException(error);
      res.send(error)
    }
  });
};
