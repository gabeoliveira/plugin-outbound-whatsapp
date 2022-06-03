import React from "react";
import { withTheme, Actions } from "@twilio/flex-ui";
import taskService from "../../services/TaskService";
import {
  Combobox,
  Modal,
  Button,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
  ModalFooterActions,
  Input,
  Label,
  Paragraph,
  Stack
} from '@twilio-paste/core';
import Handlebars from "handlebars";


class OutboundWaDialog extends React.Component {
  constructor(props) {
    super();
    this.props = props;
    this.showForm = this.showForm.bind(this);
    this.cancelForm = this.cancelForm.bind(this);
    this.createTask = this.createTask.bind(this);
    this.state = {
      open: false,
      phoneNumber: '',
      selectedTemplate: '',
      templateInputs: {}
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
    phoneNumber = '+55' + phoneNumber;
    this.setState({phoneNumber});
  }

  createTask(){
    Actions.invokeAction('SetActivity',{activitySid: taskService.availableActivitySid});
    taskService.createTask(this.state.phoneNumber);
    this.setState({open: false});
  }

  interpolateMessage() {
    const {selectedTemplate, templateInputs} = this.state;
    const template = Handlebars.compile(selectedTemplate);
    return template(templateInputs);
  }

  createTemplateInputs() {
    return [...this.state.selectedTemplate.matchAll(/\{\{([0-9]+)\}\}/g)].map(match => {
      const placeholder = match[0];
      const inputName = match[1];
      const value = this.state.templateInputs[inputName];

      return <Input
        placeholder={placeholder}
        value={value === placeholder ? '' : value}
        onChange={e => {
          this.setState({
            ...this.state,
            templateInputs: {
              ...this.state.templateInputs,
              [inputName]: e.target.value || placeholder
            }
          });
        }}
        required
      />
    });
  }

  render() {
    const templates = [
      "Olá {{1}} 😃! Sou {{2}}, agente de relacionamento da sua conta e acompanho você aqui na {{3}} 🤩.\nPodemos conversar por aqui?",
      'Adrienne Maree Brown',
      'Octavia Butler'];

    return (
      <Modal isOpen={this.state.open} onDismiss={this.cancelForm} size="wide">
        <ModalHeader>
          <ModalHeading as="h3">
            Iniciar uma conversa por Whatsapp
          </ModalHeading>
        </ModalHeader>
        <ModalBody style={{minHeight: 400}} element="MODAL_BODY_HEIGHT_400">
          <Label htmlFor="phoneNumber" required>Número</Label>

          <Input
            id="phoneNumber"
            name="phoneNumber"
            type="text"
            placeholder="DDD + Número"
            onChange={e => this.setPhone(e.target.value)}
            required
          />

          <Combobox
            items={templates}
            labelText="Selecione um template"
            selectedItem={this.state.selectedTemplate}
            onSelectedItemChange={comboState => {
              const templateInputs = {};
              const selectedTemplate = comboState.selectedItem;

              [...selectedTemplate.matchAll(/\{\{([0-9]+)\}\}/g)].forEach(([value, name]) => {
                templateInputs[name] = value;
              });

              this.setState({
                ...this.state,
                selectedTemplate,
                templateInputs
              });
            }}
            required />

          <Stack orientation="horizontal" spacing="space60">
            {this.createTemplateInputs()}
          </Stack>

          <Paragraph>
            {this.interpolateMessage()}
          </Paragraph>

        </ModalBody>
        <ModalFooter>
          <ModalFooterActions>
            <Button variant="secondary" onClick={this.cancelForm}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={this.createTask}>
              Enviar
            </Button>
          </ModalFooterActions>
        </ModalFooter>
      </Modal>
    );
  }
}

export default withTheme(OutboundWaDialog);
