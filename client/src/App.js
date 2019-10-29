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
import logo from './favicon-96-99fb5624ade39a5d238ce5a85127348575ff4f19a215e382646b92d1cb9a250d.png';
import './App.css';

import axios from 'axios';
import moment from 'moment';
import 'moment-timezone';
import socketIOClient from 'socket.io-client';

import * as actions from './utils';

export default class App extends React.Component {
  state = {
    self: { in: false },
    team: [],
    socketDetails: {},
    response: false,
    devEndpoint: 'http://127.0.0.1:2001',
    prodEndpoint: 'http://cats-tracker.herokuapp.com',
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

  isToday = timestamp => {
    const now = moment();
    if (moment(timestamp).isSame(now, 'day')) {
      return true;
    } else {
      return false;
    }
  };

  makeTwoArrays = arrayOfUsers => {
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
    const currentUser = await axios.get('/api/current_user');
    if (currentUser.data) {
      this.setState({ self: currentUser.data });
    }

    const recentDepartures = await actions.getTeamDepartures();
    this.setState({
      ...this.state,
      team: recentDepartures
    });

    const userStates = this.makeTwoArrays(this.state.team);

    this.setState({ inTeam: userStates.inUsers, outTeam: userStates.outUsers });

    if (this.state.self.email) {
      const currentUserLatestDeparture = this.state.team.filter(teamMember => {
        return teamMember.users_id === this.state.self.id;
      })[0].timestamp;
      const now = moment().unix();

      if (now < currentUserLatestDeparture) {
        this.setState({ self: { ...this.state.self, in: true } });
      }
    }

    this.socket.on('arrival', details => {
      this.setState({ ...this.state, socketDetails: details });

      const indexOfUserToUpdate = this.returnIndexOfUpdatedUser(
        details.arrival.user_id,
        this.state.team
      );

      const newTeam = [...this.state.team];
      newTeam[indexOfUserToUpdate].timestamp = details.arrival.timestamp;
      this.setState({ team: newTeam });
    });

    this.setState({ loading: false });
  };

  handleToggle = async () => {
    //add an arrival if they are out and subsequent departure
    if (!this.state.self.in) {
      const arrival = await actions.newArrival(this.state.self);
      this.socket.emit('arrival', { user: this.state.self, arrival });
    }
    this.setState({ self: { ...this.state.self, in: !this.state.self.in } });
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
              {/* <Navbar.Brand href="/">In-Out-Tracker</Navbar.Brand> */}
              <Navbar.Brand>
                <Image src={logo}></Image>
              </Navbar.Brand>
              <Nav>{this.state.self.first_name}</Nav>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="mr-auto">
                  {this.state.self.email ? (
                    <Nav.Link href="/api/logout">Logout</Nav.Link>
                  ) : (
                    <Nav.Link href="/auth/google">Log In</Nav.Link>
                  )}
                </Nav>
                {this.state.self.email ? (
                  <Button
                    disabled={this.state.self.in}
                    onClick={this.handleToggle}
                    variant="success">
                    Check in
                  </Button>
                ) : null}
              </Navbar.Collapse>
            </Navbar>
            <Row>
              <Col>
                <h2>In</h2>
                <ListGroup>
                  {this.state.inTeam.map((teamMember, index) => {
                    return (
                      <ListGroup.Item
                        key={index}
                        variant="success"
                        style={{ display: 'inline' }}>
                        <div
                          style={{
                            float: 'left'
                          }}>{`${teamMember.first_name} ${teamMember.last_name}`}</div>
                        <div style={{ float: 'right' }}>
                          {moment
                            .unix(teamMember.timestamp)

                            .format('LTS')}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
                <h2>Out</h2>
                <ListGroup>
                  {this.state.outTeam.map((teamMember, index) => {
                    return (
                      <ListGroup.Item key={index} variant="danger">
                        <div
                          style={{
                            float: 'left'
                          }}>{`${teamMember.first_name} ${teamMember.last_name}`}</div>
                        <div style={{ float: 'right' }}>
                          {moment
                            .unix(teamMember.timestamp)

                            .format('LTS')}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
                </ListGroup>
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
