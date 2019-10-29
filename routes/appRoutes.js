const getTeam = require('../queries/getTeam');
const addArrival = require('../queries/addArrival');
const addDeparture = require('../queries/addDeparture');
const mostRecentUserArrival = require('../queries/mostRecentUserArrival');
const mostRecentUserDeparture = require('../queries/mostRecentUserDeparture');
const getMostRecentDepartures = require('../queries/getMostRecentDepartures');

module.exports = app => {
  app.get('/api/team', async (req, res) => {
    const team = await getTeam();
    res.send(team);
  });

  app.get('/api/team/departures', async (req, res) => {
    const mostRecentDepartures = await getMostRecentDepartures();
    res.send(mostRecentDepartures);
  })

  app.post('/api/arrival', async (req, res) => {
    const arrival = await addArrival(req.body);
    res.send(arrival);
  });

  app.post('/api/departure', async (req, res) => {
    const departure = await addDeparture(req.body);
    res.send(departure);
  })

  app.get('/api/arrival/:user_id', async (req, res) => {
    const arrival = await mostRecentUserArrival(req.params.user_id);
    res.send(arrival);
  });

  app.get('/api/departure/:user_id', async (req, res) => {
    const departure = await mostRecentUserDeparture(req.params.user_id);
    res.send(departure);
  });
};
