import React from 'react';
import { connect } from 'react-redux';
import { Actions, withTheme, Manager} from '@twilio/flex-ui';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

import { CannedResponsesStyles } from './CannedResponses.Styles';

class CannedResponses extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      response: '',
    }
  }

  manager = Manager.getInstance();

  handleChange = (event) => {
    this.setState({ [event.target.name]: event.target.value });

    Actions.invokeAction('SendMessage', {
      channelSid: this.props.channelSid,
      body: event.target.value
    });
  }

  render() {
    return (

      /* Rendering canned responses. This is an example in which templates are hard-coded. They can be dynamic using Twilio Sync */
      <CannedResponsesStyles>
        <FormControl className="form">
          <InputLabel className="input-label" htmlFor="response">Canned Responses</InputLabel>
          <Select
            value={this.state.response}
            onChange={this.handleChange}
            name="response"
          >
            <MenuItem value="Hello! We're reaching out to talk to you about your request. Please reply with YES to talk to one of our agents.">Greeting</MenuItem>
            <MenuItem value={`Hello. I'm ${this.manager.workerClient.attributes.full_name} and I'm responsible for your request with us. Please reply with YES to engage in a conversation with us.`}>Personal Greeting</MenuItem>
            <MenuItem value="This is my third canned response.">Canned Response 3</MenuItem>
          </Select>
        </FormControl>
      </CannedResponsesStyles>
    )
  }
};

const mapStateToProps = (state, ownProps) => {
  let currentTask = false;
  state.flex.worker.tasks.forEach((task) => {
    if (ownProps.channelSid === task.attributes.channelSid) {
      currentTask = task;
    }
  })

  return {
    state,
    currentTask,
  }
}

export default connect(mapStateToProps)(withTheme(CannedResponses));
