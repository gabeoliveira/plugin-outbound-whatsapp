import React, { useEffect, useState } from "react";
import { useCombobox } from 'downshift';
import { withTheme, Actions } from "@twilio/flex-ui";
import { CloseIcon } from "@twilio-paste/icons/esm/CloseIcon";
import { SearchIcon } from "@twilio-paste/icons/esm/SearchIcon";

import taskService from "../../services/TaskService";
import twilioService from "../../services/TwilioService";

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
  TextArea,
  Box,
  Stack,
  Spinner
} from '@twilio-paste/core';
import Handlebars from "handlebars";

const AutoCompleteTemplate = (props) => {
  const [value, setValue] = React.useState('');

  const clear = () => {
    props.setSelectedItem('');
    setValue('');
    reset();
  }

  const {reset, ...state} = useCombobox({
    items: props.inputItems,
    onSelectedItemChange: props.onSelectedItemChange,
    onInputValueChange: ({inputValue}) => {
      if (inputValue !== undefined) {
        props.setInputItems(inputValue);
        setValue(inputValue);
      } 
      
      if (inputValue === "") {
        clear();
      }
    },
    inputValue: value,
    selectedItem: props.selectedItem,
  });
  
  return (
    <>
      <Combobox
        state={{...state, reset}}
        items={props.inputItems}
        required
        disabled={props.loading}
        autocomplete
        labelText="Template"
        selectedItem={props.selectedItem}
        insertAfter={
          <Button
            variant="link"
            size="reset"
            onClick={clear}
          >
            {!!value 
              ? <CloseIcon decorative={false} title="Limpar" />  
              : props.loading
                ? <Spinner size="sizeIcon20" decorative={false} title="Loading" /> 
                : <SearchIcon decorative={false} title="Buscar" />
            }
          </Button>
        }
      />
    </>
  );
};

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
      templates: [],
      inputItems: [],
      loading: true,
      selectedTemplate: '',
      templateInputs: {},
      message: ''
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

    twilioService.getTemplates(250)
      .then(templates => {
        const items = templates.map(t => t.languages[0].content);
        this.setState({
          templates: items,
          inputItems: items,
          loading: false
        })
      });

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

  cleanForm() {
    this.setState({
      open: false,
      phoneNumber: '',
      selectedTemplate: '',
      inputItems: [],
      templateInputs: {},
      message: ''
    });
  }

  createTask(){
    Actions.invokeAction('SetActivity', {activitySid: taskService.availableActivitySid});
    taskService.createTask('+55' + this.state.phoneNumber, this.state.message);
    this.cleanForm();
  }

  interpolateMessage(selectedTemplate, templateInputs) {
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

          const templateInputs = {
            ...this.state.templateInputs,
            [inputName]: e.target.value || placeholder
          };

          this.setState({
            ...this.state,
            templateInputs,
            message: this.interpolateMessage(this.state.selectedTemplate, templateInputs)
          });
        }}
        required
      />
    });
  }

  render() {
    const templateInputs = this.createTemplateInputs();

    return (
      <Modal isOpen={this.state.open} onDismiss={this.cancelForm} size="wide">
        <form onSubmit={(e) => {
          e.preventDefault();
          this.createTask();
        }}>
          <ModalHeader>
            <ModalHeading as="h3">
              Iniciar uma conversa por Whatsapp
            </ModalHeading>
          </ModalHeader>
          <ModalBody>
            <Stack orientation="vertical" spacing="space70">
              <Box>
                <Label htmlFor="phoneNumber" required>Número</Label>

                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="text"
                  placeholder="DDD + Número"
                  onChange={e => this.setPhone(e.target.value)}
                  value={this.state.phoneNumber}
                  required
                />
              </Box>

              <Box>
                <AutoCompleteTemplate
                  inputItems={this.state.inputItems}
                  setInputItems={(inputValue) => {
                    this.setState({
                      inputItems: this.state.templates.filter(item => item.toLowerCase().includes(inputValue.toLowerCase()))
                    });
                  }}
                  loading={this.state.loading}
                  selectedItem={this.state.selectedTemplate}
                  setSelectedItem={(item) => this.setState({selectedTemplate: ''})}
                  onSelectedItemChange={changes => {
                    if (changes.selectedItem != null) {
                      const templateInputs = {};
                      const selectedTemplate = changes.selectedItem;

                      [...selectedTemplate.matchAll(/\{\{([0-9]+)\}\}/g)].forEach(([value, name]) => {
                        templateInputs[name] = value;
                      });

                      this.setState({
                        selectedTemplate,
                        templateInputs,
                        message: selectedTemplate
                      });
                    } else {
                      this.setState({
                        selectedTemplate: '',
                        templateInputs: [],
                        message: ''
                      });
                    }
                  }} />
              </Box>
              
              {templateInputs.length 
                ? (<Box>
                    <Label required>Valores</Label>
                    <Stack orientation="horizontal" spacing="space30" paddingTop="space40">
                      {this.createTemplateInputs()}
                    </Stack>
                  </Box>)
                : <Box/>
              }

              <Box>
                <Label htmlFor="message" required>Mensagem</Label>
                <TextArea id="message" name="message" readOnly value={this.state.message} required/>
              </Box>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <ModalFooterActions>
              <Button variant="secondary" onClick={this.cancelForm}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit">
                Enviar
              </Button>
            </ModalFooterActions>
          </ModalFooter>
        </form>
      </Modal>
    );
  }
}

export default withTheme(OutboundWaDialog);
