import axios from 'axios';

export const getTeam = async () => {
  const team = await axios.get('/api/team');
  return team.data;
};

export const getTeamDepartures = async () => {
  const teamDepartures = await axios.get('/api/team/departures');
  return teamDepartures.data;
};

export const newRetroArrival = async (timestamp, userId) => {
  console.log(timestamp, userId);
  const arrival = await axios.post('/api/latearrival', { timestamp, userId });
  const departure = await axios.post('/api/departure', arrival.data);
  console.log(departure.data);
  return departure.data;
};

export const newArrival = async user => {
  console.log(user);
  const arrival = await axios.post('/api/arrival', user);
  const departure = await axios.post('/api/departure', arrival.data);
  console.log(departure.data);
  return departure.data;
};

export const returnIndexOfUpdatedUser = (id, teamArray) => {
  const index = teamArray.findIndex(object => object.id === id);
  return index;
};

export const isWithinEightHours = timestamp => {
  const now = (Date.now() / 1000).toFixed(0);
  const arrival = timestamp - 60 * 60 * 8;
  const departure = timestamp;

  if (now > arrival && now < departure) {
    return true;
  } else {
    return false;
  }
};

export const splitTeam = arrayOfUsers => {
  let inUsers = [];
  let outUsers = [];
  arrayOfUsers.forEach(user => {
    if (isWithinEightHours(user.timestamp)) {
      inUsers.push(user);
    } else {
      outUsers.push(user);
    }
  });
  return { inUsers, outUsers };
};
