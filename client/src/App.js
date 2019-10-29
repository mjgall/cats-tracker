import React from 'react';
import {
  Navbar,
  Nav,
  ListGroup,
  Container,
  Row,
  Col,
  Form
} from 'react-bootstrap';

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
    prodEndpoint: 'http://cats-tracker.herokuapp.com'
  };

  socket = process.env.NODE_ENV === 'production' ? socketIOClient(this.state.prodEndpoint) : socketIOClient(this.state.devEndpoint);

  returnIndexOfUpdatedUser = (id, teamArray) => {
    const index = teamArray.findIndex(object => object.users_id === id);
    return index;
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

    this.socket.on('arrival', details => {
      this.setState({ ...this.state, socketDetails: details });

      const indexOfUserToUpdate = this.returnIndexOfUpdatedUser(
        details.arrival.user_id,
        this.state.team
      );

      const newTeam = [...this.state.team];
      newTeam[indexOfUserToUpdate].timestamp = details.arrival.timestamp;
      this.setState({ team: newTeam });

      console.log(this.state);
    });

    console.log(this.state);
  };

  handleToggle = async () => {
    //add an arrival if they are out and subsequent departure
    if (!this.state.self.in) {
      const arrival = await actions.newArrival(this.state.self);
      this.socket.emit('arrival', { user: this.state.self, arrival });
    }
    this.setState({ self: { ...this.state.self, in: !this.state.self.in } });
  };

  isInTheFuture = timestamp => {
    const now = moment.now();
    return now < timestamp;
  };

  isToday = timestamp => {
    if (
      moment(timestamp).format('DD/MM/YYYY') ===
      moment(new Date()).format('DD/MM/YYYY')
    ) {
      return true;
    } else {
      return false;
    }
  };

  render() {
    return (
      <Container>
        <Navbar>
          <Navbar.Brand href="/">In-Out-Tracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav>{this.state.self.email}</Nav>
            <Nav className="mr-auto">
              {this.state.self.email ? (
                <Nav.Link href="/api/logout">Logout</Nav.Link>
              ) : (
                <Nav.Link href="/auth/google">Log In</Nav.Link>
              )}
            </Nav>
            {this.state.self.email ? (
              <Form>
                <Form.Check
                  type="switch"
                  id="custom-switch"
                  label={this.state.self.in ? 'In' : 'Out'}
                  onClick={this.handleToggle}
                />
              </Form>
            ) : null}
          </Navbar.Collapse>
        </Navbar>
        <Row>
          <Col>
            <ListGroup>
              {this.state.team.map((teamMember, index) => {
                if (
                  this.isInTheFuture(moment.unix(teamMember.timestamp)) &&
                  !this.isToday(teamMember.timestamp)
                ) {
                  return (
                    <ListGroup.Item
                      key={index}
                      variant="success"
                      style={{ display: 'inline' }}>
                      <div
                        style={{
                          float: 'left'
                        }}>{`${teamMember.first_name} ${teamMember.last_name} -- In`}</div>
                      <div style={{ float: 'right' }}>
                        {moment
                          .unix(teamMember.timestamp)

                          .format('LTS')}
                      </div>
                    </ListGroup.Item>
                  );
                } else {
                  return (
                    <ListGroup.Item key={index} variant="danger">
                      <div
                        style={{
                          float: 'left'
                        }}>{`${teamMember.first_name} ${teamMember.last_name} -- Out`}</div>
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
          </Col>
        </Row>
        <div>
          {this.state.socketDetails.arrival
            ? this.state.socketDetails.arrival.timestamp
            : null}
        </div>
      </Container>
    );
  }
}
