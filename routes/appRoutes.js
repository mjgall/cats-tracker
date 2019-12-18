const getTeam = require('../queries/getTeam');
const addArrival = require('../queries/addArrival');
const addLateArrival = require('../queries/addAdHocArrival');
const addDeparture = require('../queries/addDeparture');
const mostRecentUserArrival = require('../queries/mostRecentUserArrival');
const mostRecentUserDeparture = require('../queries/mostRecentUserDeparture');
const getMostRecentDepartures = require('../queries/getMostRecentDepartures');
const getUserById = require('../queries/getUserById');


const Sentry = require('../services/sentry');

module.exports = (app, io) => {

  app.get('/api/button-arrival/:userId', async (req, res) => {
    console.log('Button endpoint hit')
    const userId = req.params.userId;
    const user = await getUserById(userId);
  
    const response = await mostRecentUserDeparture(userId);
  
    const mostRecentDeparture = response.most_recent_departure;
  
    let currentlyIn = false;
    user.isLoggedIn = false;
  
    const isWithinEightHours = timestamp => {
      const now = (Date.now() / 1000).toFixed(0);
  
      const arrival = timestamp - 60 * 60 * 8;
  
      const departure = timestamp;
  
      if (now > arrival && now < departure) {
        return true;
      } else {
        return false;
      }
    };
  
    if (isWithinEightHours(mostRecentDeparture)) {
      console.log('cant check in, too soon');
      res.send("can't log in, too soon");
    } else {
      currentlyIn = false;
      try {
        const arrival = await addArrival({ id: userId });
  
        const departure = await addDeparture(arrival);
  
        io.emit('arrival', {
          user,
          departure,
          currentlyIn
        });
  
        res.send(departure);
      } catch (error) {
        Sentry.captureException(error);
        console.log(error);
        res.send(error);
      }
    }
  });

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

  
 
};
