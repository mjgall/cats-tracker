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
  Image
} from 'react-bootstrap';
import fullLogo from './cats-logo.png';
import './App.css';

import axios from 'axios';
import moment from 'moment';

import socketIOClient from 'socket.io-client';

import * as actions from './utils';

export default class App extends React.Component {
  state = {
    self: { in: false, isLoggedIn: false },
    team: [],
    inTeam: [],
    outTeam: [],
    socketDetails: {},
    devEndpoint: 'http://127.0.0.1:2001',
    prodEndpoint: 'http://cats-tracker.herokuapp.com',
    env: process.env.NODE_ENV,
    loading: true
  };

  socket =
    process.env.NODE_ENV === 'production'
      ? socketIOClient(this.state.prodEndpoint)
      : socketIOClient(this.state.devEndpoint);

  returnIndexOfUpdatedUser = (id, teamArray) => {
    const index = teamArray.findIndex(object => object.users_id === id);
    return index;
  };

  isWithinEightHours = timestamp => {
    const now = (Date.now() / 1000).toFixed(0);
    const arrival = timestamp - 60 * 60 * 8;
    const departure = timestamp;

    if (now > arrival && now < departure) {
      return true;
    } else {
      return false;
    }
  };

  splitTeam = arrayOfUsers => {
    let inUsers = [];
    let outUsers = [];
    arrayOfUsers.forEach(user => {
      if (this.isWithinEightHours(user.timestamp)) {
        inUsers.push(user);
      } else {
        outUsers.push(user);
      }
    });
    return { inUsers, outUsers };
  };

  componentDidMount = async () => {
    this.socket.on('arrival', details => {
      if (details.currentlyIn) {
        const index = this.returnIndexOfUpdatedUser(
          details.user.id,
          this.state.inTeam
        );

        const newTeam = [...this.state.inTeam];
        newTeam[index].timestamp = details.departure.timestamp;
        this.setState({ inTeam: newTeam });
      } else {
        const index = this.returnIndexOfUpdatedUser(
          details.user.id,
          this.state.outTeam
        );

        const newOutTeam = [...this.state.outTeam];
        const transferredMember = newOutTeam.splice(index, 1)[0];
        transferredMember.timestamp = transferredMember.timestamp =
          details.departure.timestamp;
        const newInTeam = [transferredMember, ...this.state.inTeam];
        this.setState({ outTeam: newOutTeam, inTeam: newInTeam });
      }
    });

    const currentUser = await axios.get('/api/current_user');
    if (currentUser.data) {
      this.setState({ self: { ...currentUser.data, isLoggedIn: true } });
    }

    const recentDepartures = await actions.getTeamDepartures();
    this.setState({
      ...this.state,
      team: recentDepartures
    });

    const splitTeams = this.splitTeam(this.state.team);

    this.setState({ inTeam: splitTeams.inUsers, outTeam: splitTeams.outUsers });

    if (this.state.self.isLoggedIn) {
      console.log(this.state.team);

      if (
        this.state.team.some(teamMember => {
          if (teamMember.users_id === this.state.self.id) {
            return true;
          } else {
            return false;
          }
        })
      ) {
        const currentUserLatestDeparture = this.state.team.filter(
          teamMember => {
            return teamMember.users_id === this.state.self.id;
          }
        )[0].timestamp;
        const now = parseInt(Date.now() / 1000);

        if (now < currentUserLatestDeparture) {
          this.setState({ self: { ...this.state.self, in: true } });
        }
      }
    }

    this.setState({ loading: false });
  };

  handleCheckInClick = async () => {
    //returns the departure
    const departure = await actions.newArrival(this.state.self);

    if (
      this.returnIndexOfUpdatedUser(this.state.self.id, this.state.inTeam) > -1
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
  };

  render() {
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
          </div>
        )}
      </Container>
    );
  }
}
