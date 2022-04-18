import React from "react";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import Button from '@material-ui/core/Button'
import { withTheme, Actions } from "@twilio/flex-ui";
import * as Flex from "@twilio/flex-ui";
import { Container , Title , Label, ContactData} from "./OutboundWaDialog.styles";
import taskService from "../../services/TaskService";


class OutboundWaDialog extends React.Component {
  constructor(props) {
    super();
    this.props = props;
    this.showForm = this.showForm.bind(this);
    this.cancelForm = this.cancelForm.bind(this);
    this.createTask = this.createTask.bind(this);
    this.state = {
      open: false,
      phoneNumber: ''
    };
  }

  componentDidMount() {
    console.log("modal did mount");
    document.addEventListener(
      "waModalControlOpen",
      e => {
        this.showForm(e.url);
      },
      false
    );
  }

  showForm(media) {
    console.log("show form function");
    this.setState({ open: true});
  }

  cancelForm() {
    this.setState({ open: false });
  }

  setPhone(phoneNumber) {
    this.setState({phoneNumber});
  }

  createTask(){
    Actions.invokeAction('SetActivity',{activitySid: taskService.availableActivitySid});
    taskService.createTask(this.state.phoneNumber);
    this.setState({open: false});
  }

  render() {
    return (
      <Dialog
        open={this.state.open}
        onClose={this.cancelForm}
        aria-labelledby="form-dialog-title"
        maxWidth={"md"}
        fullWidth={true}
      >
        <DialogContent>
            <Container>
                <Title>Enviar mensagem por Whatsapp</Title>
                <ContactData>
                    <Label>Número</Label>
                    <input type="text" id="phoneNumber"
                        placeholder="DDD + Número"
                        onChange={e => this.setPhone(e.target.value)}
                        onBlur={(e) => {
                            this.setPhone('+55' + e.target.value);
                          }}    
                    />
                </ContactData>
                <div>
                    <Button variant="contained" color="secondary" onClick={this.createTask} >Enviar</Button>
                </div>
            </Container>
        </DialogContent>
      </Dialog>
    );
  }
}

export default withTheme(OutboundWaDialog);
