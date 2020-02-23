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
  Accordion,
  InputGroup,
  FormControl,
  
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
    errorDetails: {},
    prevDays: 25
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
      //https://stackoverflow.com/questions/56835227/order-the-time-units-on-y-axis-chart-js
      const ctx = this.chartRef.current.getContext('2d');

      let arrivalsFull = await actions.getUserArrivals(this.state.self.id);
      let arrivals = arrivalsFull.slice(
        Math.max(arrivalsFull.length - this.state.prevDays, 1)
      );

      const s1 = {
        label: 'Arrival',
        borderColor: '#4b2b6e',
        lineTension: 0,
        fill: false,
        data: arrivals
          .filter(arrival => {
            if (
              new Date(arrival * 1000).getHours() > 11 ||
              new Date(arrival * 1000).getHours() < 7 ||
              new Date(arrival * 1000).getDay() === 0 ||
              new Date(arrival * 1000).getDay() === 0
            ) {
              return false;
            }
            return true;
          })
          .map((arrival, index) => {
            arrival = arrival * 1000;

            const xFormatted = new Date(arrival);
            const xFinal = new Date(
              xFormatted.getFullYear(),
              xFormatted.getMonth(),
              xFormatted.getDate(),
              0,
              0,
              0
            ).toLocaleString();

            const yFormatted = new Date(arrivals[0] * 1000);
            const yArrival = new Date(arrival);
            const yFinal = new Date(
              yFormatted.getFullYear(),
              yFormatted.getMonth(),
              yFormatted.getDate(),
              yArrival.getHours(),
              yArrival.getMinutes(),
              yArrival.getSeconds()
            ).toLocaleString();
            const x = xFinal;
            const y = yFinal;
            console.log(x, y);
            return { x, y };
          })
      };

      const yFormatted = new Date(arrivals[0] * 1000);
      const yFinalMin = new Date(
        yFormatted.getFullYear(),
        yFormatted.getMonth(),
        yFormatted.getDate(),
        7,
        0,
        0
      ).toLocaleString();
      const yFinalMax = new Date(
        yFormatted.getFullYear(),
        yFormatted.getMonth(),
        yFormatted.getDate(),
        11,
        0,
        0
      ).toLocaleString();

      new Chart(ctx, {
        type: 'line',
        responsive: true,
        data: { datasets: [s1] },
        options: {
          legend: {
            display: true
          },
          scales: {
            xAxes: [
              {
                type: 'time',
                weight: 0,
                time: {
                  unit: 'day'
                }
              }
            ],
            yAxes: [
              {
                type: 'time',
                // type: 'linear',
                reverse: false,
                time: {
                  unit: 'hour'
                },
                ticks: {
                  min: yFinalMin,
                  max: yFinalMax
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
    // return (
    //   <div style={{ background: '#1e528a', height: '100vh', width: '100vw' }}>
    //     <div style={{ textAlign: 'center' }}>
    //       <img
    //         style={{
    //           display: 'block',
    //           marginLeft: 'auto',
    //           marginRight: 'auto',
    //           width: '40%'
    //         }}
    //         src="https://media.giphy.com/media/l4FGn8asw5EJrm10s/giphy.gif"></img>
    //       <h3>
    //         <a style={{ color: 'white' }} href="mailto:mike.gallagh@gmail.com">
    //           mike.gallagh@gmail.com
    //         </a>
    //       </h3>
    //     </div>
    //   </div>
    // );

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
                {this.state.self.id ? (
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
                ) : null}
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
