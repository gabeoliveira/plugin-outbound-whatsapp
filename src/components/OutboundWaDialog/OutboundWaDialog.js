import React, { useState } from 'react';
import { withTheme, Actions } from '@twilio/flex-ui';
import { CloseIcon } from '@twilio-paste/icons/esm/CloseIcon';
import { SearchIcon } from '@twilio-paste/icons/esm/SearchIcon';
import { Toaster } from '@twilio-paste/toast';
import { v4 as uuidv4 } from 'uuid';
import unidecode from 'unidecode';

import taskService from '../../services/TaskService';
import getTemplatesService from '../../services/GetTemplatesService';
import OutboundSenderIdSelector from '../OutboundSenderIdSelector/OuboundSenderIdSelector';

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
  Text,
  TextArea,
  Box,
  Stack,
  Spinner,
} from '@twilio-paste/core';
import Handlebars from 'handlebars';

const AutoCompleteCombobox = (props) => {
  const [value, setValue] = useState('');
  const [displayItems, setDisplayItems] = useState([
    ...props.inputItems.slice(0, props.maxDisplayedItems),
    {
      templateName: `Exibindo os primeiros ${props.maxDisplayedItems} resultados`,
      message: '',
    },
  ]);

  const handleInputValueChange = (inputValue) => {
    if (inputValue !== undefined) {
      const valueLowerCase = unidecode(inputValue.toLowerCase());

      const filteredItems = props.inputItems.filter((item) => {
        const templateNameLowerCase = unidecode(
          item.templateName.toLowerCase()
        );
        const messageLowerCase = unidecode(item.message.toLowerCase());

        return (
          templateNameLowerCase.includes(valueLowerCase) ||
          messageLowerCase.includes(valueLowerCase)
        );
      });

      setDisplayItems([
        ...filteredItems.slice(0, props.maxDisplayedItems),
        {
          templateName:
            filteredItems.length === 0
              ? `Nenhum resultado encontrado contendo "${inputValue}"`
              : filteredItems.length === 1
              ? `Exibindo um resultado encontrado contendo "${inputValue}"`
              : filteredItems.length > props.maxDisplayedItems
              ? `Exibindo os primeiros ${props.maxDisplayedItems} resultados contendo "${inputValue}"`
              : `Exibindo ${filteredItems.length} resultados contendo "${inputValue}"`,
          message: '',
        },
      ]);

      setValue(inputValue);
    }
  };

  const handleClearSelection = () => {
    setValue('');
    props.clear();
    props.setSelectedItem('');
    setDisplayItems(props.inputItems.slice(0, props.maxDisplayedItems));
  };

  return (
    <>
      <Combobox
        disabled={props.loading}
        autocomplete
        items={displayItems}
        inputValue={value}
        selectedItem={props.selectedItem}
        labelText="Template"
        element="COMBOBOX_MODAL_LISTBOX"
        disabledItems={displayItems.slice(
          displayItems.length - 1,
          displayItems.length
        )}
        required
        insertAfter={
          <Button variant="link" size="reset" onClick={handleClearSelection}>
            {!!value ? (
              <CloseIcon decorative={false} title="Limpar" />
            ) : props.loading ? (
              <Spinner size="sizeIcon20" decorative={false} title="Loading" />
            ) : (
              <SearchIcon decorative={false} title="Buscar" />
            )}
          </Button>
        }
        optionTemplate={(item) => {
          return (
            <Box>
              <Text
                as="div"
                fontSize="fontSize30"
                fontWeight="colorTextWeakfontWeightSemibold"
                lineHeight="lineHeight10"
              >
                {item.templateName}
              </Text>
              <Text
                as="div"
                fontSize="fontSize20"
                color="colorTextWeak"
                lineHeight="lineHeight10"
              >
                {item.message}
              </Text>
            </Box>
          );
        }}
        itemToString={(item) => (item ? item.templateName : '')}
        onInputValueChange={({ inputValue }) => {
          handleInputValueChange(inputValue);
        }}
        onSelectedItemChange={props.onSelectedItemChange}
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
    this.cleanForm = this.cleanForm.bind(this);
    this.state = {
      open: false,
      toNumber: '',
      templates: [],
      inputItems: [],
      loading: true,
      sending: false,
      selectedTemplate: '',
      templateInputs: {},
      message: '',
      toasts: [],
    };
  }

  async componentDidMount() {
    console.log('modal did mount');
    document.addEventListener(
      'waModalControlOpen',
      (e) => {
        this.showForm(e.url);
      },
      false
    );

    const templates = await getTemplatesService.getAllTemplates();

    const items = templates
      .filter((t) => t.languages[0].status === 'approved')
      .map((t) => ({
        message: t.languages[0].content,
        templateName: t.template_name,
      }));
    this.setState({
      templates: items,
      inputItems: items,
      loading: false,
    });
  }

  showForm(media) {
    console.log('show form function');
    this.setState({ open: true });
  }

  cancelForm() {
    this.setState({ open: false });
  }

  setPhone(toNumber) {
    this.setState({ toNumber });
  }

  cleanForm() {
    this.setState({
      open: false,
      toNumber: '',
      fromNumber: null,
      selectedTemplate: '',
      templateInputs: {},
      message: '',
    });
  }

  createTask() {
    Actions.invokeAction('SetActivity', {
      activitySid: taskService.availableActivitySid,
    });
    return taskService.createTask(
      this.state.fromNumber,
      '+55' + this.state.toNumber,
      this.state.message
    );
  }

  interpolateMessage(selectedTemplate, templateInputs) {
    const template = Handlebars.compile(selectedTemplate);
    return template(templateInputs);
  }

  createTemplateInputs() {
    return [...this.state.selectedTemplate.matchAll(/\{\{([0-9]+)\}\}/g)].map(
      (match) => {
        const placeholder = match[0];
        const inputName = match[1];
        const value = this.state.templateInputs[inputName];

        return (
          <Input
            placeholder={placeholder}
            value={value === placeholder ? '' : value}
            onChange={(e) => {
              const templateInputs = {
                ...this.state.templateInputs,
                [inputName]: e.target.value || placeholder,
              };

              this.setState({
                ...this.state,
                templateInputs,
                message: this.interpolateMessage(
                  this.state.selectedTemplate,
                  templateInputs
                ),
              });
            }}
            required
          />
        );
      }
    );
  }

  render() {
    const templateInputs = this.createTemplateInputs();

    return (
      <>
        <Modal
          ariaLabelledby="outboundWhatsapp"
          isOpen={this.state.open}
          onDismiss={this.cancelForm}
          size="wide"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();

              this.setState({ sending: true });
              this.createTask()
                .then(() => {
                  this.setState({ sending: false });
                  this.cleanForm();
                })
                .catch((err) => {
                  console.error(err);

                  let message;
                  if (err.response && err.response.status === 409) {
                    const attendants = err.response.data.attendants
                      .map((attendant) => attendant.friendlyName)
                      .join(',');
                    message = `Não foi possível enviar a mensagem. O cliente está em atedimento com ${attendants}`;
                  } else {
                    'Ocorreu um erro ao enviar a mensagem: ' + err;
                  }

                  this.setState({
                    sending: false,
                    toasts: [
                      ...this.state.toasts,
                      {
                        id: uuidv4(),
                        variant: 'error',
                        message,
                      },
                    ],
                  });
                });
            }}
          >
            <ModalHeader>
              <ModalHeading as="h3">
                Iniciar uma conversa por Whatsapp
              </ModalHeading>
            </ModalHeader>
            <ModalBody>
              <Stack orientation="vertical" spacing="space70">
                <Box>
                  <Label htmlFor="toNumber" required>
                    Número
                  </Label>

                  <Input
                    id="toNumber"
                    name="toNumber"
                    type="text"
                    placeholder="DDD + Número"
                    onChange={(e) => this.setPhone(e.target.value)}
                    value={this.state.toNumber}
                    required
                  />
                </Box>

                <Box>
                  <AutoCompleteCombobox
                    inputItems={this.state.inputItems}
                    loading={this.state.loading}
                    selectedItem={this.state.selectedTemplate}
                    maxDisplayedItems={20}
                    clear={() =>
                      this.setState({ selectedTemplate: '', message: '' })
                    }
                    setSelectedItem={(item) =>
                      this.setState({ selectedTemplate: '' })
                    }
                    onSelectedItemChange={(changes) => {
                      if (changes.selectedItem !== null) {
                        const templateInputs = {};
                        const item = changes.selectedItem;
                        const selectedTemplate = item.message;
                        [
                          ...selectedTemplate.matchAll(/\{\{([0-9]+)\}\}/g),
                        ].forEach(([value, name]) => {
                          templateInputs[name] = value;
                        });

                        this.setState({
                          selectedTemplate,
                          templateInputs,
                          message: selectedTemplate,
                        });
                      } else {
                        this.setState({
                          selectedTemplate: '',
                          templateInputs: [],
                          message: '',
                        });
                      }
                    }}
                  />
                </Box>

                {templateInputs.length ? (
                  <Box>
                    <Label required>Valores</Label>
                    <Stack
                      orientation="horizontal"
                      spacing="space30"
                      paddingTop="space40"
                    >
                      {this.createTemplateInputs()}
                    </Stack>
                  </Box>
                ) : (
                  <Box />
                )}

                <OutboundSenderIdSelector
                  value={this.state.fromNumber}
                  setSelectedSenderId={(fromNumber) =>
                    this.setState({ fromNumber })
                  }
                />

                <Box>
                  <Label htmlFor="message" required>
                    Mensagem
                  </Label>
                  <TextArea
                    id="message"
                    name="message"
                    readOnly
                    value={this.state.message}
                    required
                  />
                </Box>
              </Stack>
            </ModalBody>
            <ModalFooter element="MODAL_FOOTER">
              <ModalFooterActions>
                <Button
                  variant="secondary"
                  onClick={this.cancelForm}
                  disabled={this.state.sending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={this.state.sending}
                >
                  {this.state.sending ? (
                    <Spinner
                      size="sizeIcon20"
                      decorative={false}
                      title="Loading"
                    />
                  ) : (
                    'Enviar'
                  )}
                </Button>
              </ModalFooterActions>
            </ModalFooter>
          </form>
        </Modal>
        <Toaster
          toasts={this.state.toasts.length ? this.state.toasts : []}
          pop={(id) => {
            this.setState({
              toasts: this.state.toasts.filter((t) => t.id !== id),
            });
          }}
        />
      </>
    );
  }
}

export default withTheme(OutboundWaDialog);
