const getTeam = require('../queries/getTeam');
const addArrival = require('../queries/addArrival');
const addDeparture = require('../queries/addDeparture');
const mostRecentUserArrival = require('../queries/mostRecentUserArrival');
const mostRecentUserDeparture = require('../queries/mostRecentUserDeparture');
const getMostRecentDepartures = require('../queries/getMostRecentDepartures');

module.exports = app => {
  app.get('/api/team', async (req, res) => {
    try {
      const team = await getTeam();
      res.send(team);
    } catch (error) {
      throw error;
    }
  });

  app.get('/api/team/departures', async (req, res) => {
    try {
      const mostRecentDepartures = await getMostRecentDepartures();
      res.send(mostRecentDepartures);
    } catch (error) {
      throw error;
    }
  });

  app.post('/api/arrival', async (req, res) => {
    try {
      const arrival = await addArrival(req.body);
      res.send(arrival);
    } catch (error) {
      throw error;
    }
  });

  app.post('/api/departure', async (req, res) => {
    try {
      const departure = await addDeparture(req.body);
      res.send(departure);
    } catch (error) {
      throw error;
    }
  });

  app.get('/api/arrival/:user_id', async (req, res) => {
    try {
      const arrival = await mostRecentUserArrival(req.params.user_id);
      res.send(arrival);
    } catch (error) {
      throw error;
    }
  });

  app.get('/api/departure/:user_id', async (req, res) => {
    try {
      const departure = await mostRecentUserDeparture(req.params.user_id);
      res.send(departure);
    } catch (error) {
      throw error;
    }
  });
};
