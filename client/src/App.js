import React from 'react';
import {
  Navbar,
  Nav,
  ListGroup,
  Container,
  Row,
  Col,
  Spinner,
  Button,
  Image,
  Card,
  Accordion
} from 'react-bootstrap';

import fullLogo from './cats-logo.png';
import './App.css';

import axios from 'axios';
import moment from 'moment';

import socketIOClient from 'socket.io-client';

import * as actions from './utils';

import Chart from 'chart.js';

export default class App extends React.Component {
  chartRef = React.createRef();

  state = {
    self: { in: false, isLoggedIn: false },
    team: [],
    inTeam: [],
    outTeam: [],
    socketDetails: {},
    devEndpoint: 'http://127.0.0.1:2001',
    prodEndpoint: window.location.origin,
    env: process.env.NODE_ENV,
    loading: true,
    error: false,
    errorDetails: {}
  };

  socket =
    process.env.NODE_ENV === 'production'
      ? socketIOClient(this.state.prodEndpoint)
      : socketIOClient(this.state.devEndpoint);

  componentDidMount = async () => {
    window.addRetroArrival = this.addRetroArrival;

    try {
      this.socket.on('arrival', details => {
        console.log(details);
        if (process.env.NODE_ENV === 'development') {
          console.log({ details });
          console.log({ state: this.state });
        }

        console.log(
          actions.returnIndexOfUpdatedUser(details.user.id, this.state.team)
        );

        if (details.currentlyIn) {
          const index = actions.returnIndexOfUpdatedUser(
            details.user.id,
            this.state.inTeam
          );

          const newTeam = [...this.state.inTeam];
          newTeam[index].timestamp = details.departure.timestamp;

          this.setState({ inTeam: newTeam });
        } else if (
          actions.returnIndexOfUpdatedUser(details.user.id, this.state.team) < 0
        ) {
          this.setState({
            inTeam: [
              ...this.state.inTeam,
              { ...details.user, timestamp: details.departure.timestamp }
            ]
          });
        } else {
          console.log('we made it here');
          const tempOutTeam = [...this.state.outTeam];

          const memberToTransfer = tempOutTeam.splice(
            actions.returnIndexOfUpdatedUser(
              details.user.id,
              this.state.outTeam
            ),
            1
          )[0];
          console.log(memberToTransfer);

          memberToTransfer.departure = details.departure.timestamp;

          console.log(memberToTransfer);

          this.setState({
            inTeam: [
              ...this.state.inTeam,
              { ...memberToTransfer, timestamp: details.departure.timestamp }
            ],
            outTeam: tempOutTeam
          });
        }
      });

      try {
        const currentUser = await axios.get('/api/current_user');
        if (currentUser.data) {
          this.setState({ self: { ...currentUser.data, isLoggedIn: true } });
        }
      } catch (error) {
        this.setState({ error: true, errorDetails: error });
      }

      try {
        const recentDepartures = await actions.getTeamDepartures();
        this.setState({
          ...this.state,
          team: recentDepartures
        });
      } catch (error) {
        this.setState({ error: true, errorDetails: error });
      }

      if (this.state.self.isLoggedIn) {
        if (
          this.state.team.some(teamMember => {
            if (teamMember.id === this.state.self.id) {
              return true;
            } else {
              return false;
            }
          })
        ) {
          const currentUserLatestDeparture = this.state.team.filter(
            teamMember => {
              return teamMember.id === this.state.self.id;
            }
          )[0].timestamp;
          const now = parseInt(Date.now() / 1000);

          if (now < currentUserLatestDeparture) {
            this.setState({ self: { ...this.state.self, in: true } });
          }
        }
      }

      const splitTeams = actions.splitTeam(this.state.team);
      this.setState({
        inTeam: splitTeams.inUsers,
        outTeam: splitTeams.outUsers
      });

      this.setState({ loading: false });
    } catch (error) {
      this.setState({ error: true, errorDetails: error, loading: false });
      console.log(error);
    }

    if (this.state.self.id) {
      const myChartRef = this.chartRef.current.getContext('2d');

      const arrivals = await actions.getUserArrivals(this.state.self.id);

      let data = arrivals.map((timestamp, index) => ({
        x: moment(timestamp * 1000).valueOf(),
        y: moment(
          `1970-02-01 ${moment(timestamp * 1000)
            .get('hours')
            .valueOf()}:${moment(timestamp * 1000)
            .get('minutes')
            .valueOf()}`
        ).valueOf()
      }));

      new Chart(myChartRef, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Time',
              backgroundColor: 'rgba(75, 43, 110, 0.7)',
              data: data,
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7
            }
          ]
        },
        options: {
          scales: {
            xAxes: [
              {
                type: 'time',
                position: 'bottom',
                time: {
                  displayFormats: {
                    years: 'k mm'
                  },
                  unit: 'day'
                }
              }
            ],
            yAxes: [
              {
                type: 'linear',
                position: 'left',
                ticks: {
                  min: moment('1970-02-01 07:00:00').valueOf(),
                  max: moment('1970-02-01 10:30:00').valueOf(),
                  stepSize: 3.6e6 / 2,
                  beginAtZero: false,
                  callback: value => {
                    let date = moment(value);
                    if (
                      date.diff(moment('1970-02-01 23:59:59'), 'minutes') === 0
                    ) {
                      return null;
                    }

                    return date.format('h:mm A');
                  }
                }
              }
            ]
          }
        }
      });
    }
  };

  addRetroArrival = async (timestamp, userId) => {
    try {
      const departure = await actions.newRetroArrival(timestamp, userId);
      if (
        actions.returnIndexOfUpdatedUser(
          this.state.self.id,
          this.state.inTeam
        ) > -1
      ) {
        this.socket.emit('arrival', {
          user: this.state.self,
          departure,
          currentlyIn: true
        });
      } else {
        this.socket.emit('arrival', {
          user: this.state.self,
          departure,
          currentlyIn: false
        });
      }
    } catch (error) {
      this.setState({ error: true, errorDetails: error, loading: false });
      console.log(error);
    }
  };

  handleCheckInClick = async () => {
    try {
      //returns the departure
      const departure = await actions.newArrival(this.state.self);
      if (
        actions.returnIndexOfUpdatedUser(
          this.state.self.id,
          this.state.inTeam
        ) > -1
      ) {
        this.socket.emit('arrival', {
          user: this.state.self,
          departure,
          currentlyIn: true
        });
      } else {
        this.socket.emit('arrival', {
          user: this.state.self,
          departure,
          currentlyIn: false
        });
      }

      this.setState({ self: { ...this.state.self, in: true } });
    } catch (error) {
      this.setState({ error: true, errorDetails: error, loading: false });
      console.log(error);
    }
  };

  componentDidUpdate = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log({ state: this.state });
    }
  };

  componentWillUnmount = () => {
    this.socket.disconnect();
  };

  render() {
    if (!this.state.error) {
      return (
        <Container>
          {this.state.loading ? (
            <div style={{ position: 'fixed', top: '50%', left: '50%' }}>
              <Spinner animation="border" role="status"></Spinner>
            </div>
          ) : (
            <div>
              <Navbar expand="md">
                <Navbar.Brand>
                  <Image src={fullLogo}></Image>
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                  <Nav style={{ textAlign: 'center' }}>
                    {this.state.self.email}
                  </Nav>
                  <Nav className="ml-auto">
                    {this.state.self.isLoggedIn ? (
                      <Nav.Link href="/api/logout">
                        <Button variant="outline-secondary">Log Out</Button>
                      </Nav.Link>
                    ) : (
                      <Nav.Link href="/auth/google">
                        <Button variant="outline-secondary">Log In</Button>
                      </Nav.Link>
                    )}
                  </Nav>
                  {this.state.self.isLoggedIn ? (
                    <Button
                      disabled={this.state.self.in}
                      onClick={this.handleCheckInClick}
                      variant="success">
                      Check in
                    </Button>
                  ) : null}
                </Navbar.Collapse>
              </Navbar>
              <Row>
                <Col className="group-container">
                  <div id="in-group">
                    <h2>In</h2>
                    <ListGroup>
                      {this.state.inTeam.map((teamMember, index) => {
                        return (
                          <ListGroup.Item key={index} variant="success">
                            <div
                              style={{
                                float: 'left',
                                display: 'flex',
                                alignItems: 'center'
                              }}>
                              <div>
                                <Image
                                  style={{
                                    height: '2em',
                                    width: '2em',
                                    marginRight: '1em'
                                  }}
                                  src={teamMember.photo_url}
                                  roundedCircle></Image>
                              </div>
                              <span>{`${teamMember.first_name} ${teamMember.last_name}`}</span>
                            </div>
                            <div style={{ float: 'right' }}>
                              {moment
                                .unix(teamMember.timestamp)

                                .format('LTS')}
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </div>
                  <div id="out-group">
                    <h2>Out</h2>
                    <ListGroup>
                      {this.state.outTeam.map((teamMember, index) => {
                        if (teamMember.email.indexOf('catsone.com') > 0) {
                          return (
                            <ListGroup.Item key={index} variant="danger">
                              <div
                                style={{
                                  float: 'left',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}>
                                <div>
                                  <Image
                                    style={{
                                      height: '2em',
                                      width: '2em',
                                      marginRight: '1em'
                                    }}
                                    src={teamMember.photo_url}
                                    roundedCircle></Image>
                                </div>
                                <div>{`${teamMember.first_name} ${teamMember.last_name}`}</div>
                              </div>
                              <div style={{ float: 'right' }}>
                                {moment
                                  .unix(teamMember.timestamp)

                                  .format('LTS')}
                              </div>
                            </ListGroup.Item>
                          );
                        }
                      })}
                    </ListGroup>
                  </div>
                </Col>
              </Row>
              <div>
                {this.state.socketDetails.arrival
                  ? this.state.socketDetails.arrival.timestamp
                  : null}
              </div>
              <div className="reports-container">
                <Accordion>
                  <Card>
                    <Accordion.Toggle
                      as={props => (
                        <Button
                          {...props}
                          className="btn-success"
                          style={{ width: '100%' }}>
                          Arrivals History
                        </Button>
                      )}
                      eventKey="0"></Accordion.Toggle>
                    <Accordion.Collapse eventKey="0">
                      <Card.Body>
                        <canvas id="myChart" ref={this.chartRef} />
                      </Card.Body>
                    </Accordion.Collapse>
                  </Card>
                </Accordion>
              </div>
            </div>
          )}
        </Container>
      );
    } else {
      return (
        <h1 style={{ color: 'red' }}>
          Something went wrong, please reload the page. If it does not resolve
          itself, let Mike know.
        </h1>
      );
    }
  }
}
