import axios from 'axios';

export const getTeam = async () => {
  const team = await axios.get('/api/team');
  return team.data;
};

export const getTeamDepartures = async () => {
  const teamDepartures = await axios.get('/api/team/departures');
  return teamDepartures.data;
};

export const newArrival = async user => {
  console.log(user)
  const arrival = await axios.post('/api/arrival', user);
  const departure = await axios.post('/api/departure', arrival.data);
  console.log(departure.data);
  return departure.data;
};
