import React from 'react';
import { connect } from 'react-redux';
import { Actions, withTheme, Manager } from '@twilio/flex-ui';
import {
  Box,
  Combobox,
  Text,
  Truncate,
  Button,
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
  ModalFooterActions,
} from '@twilio-paste/core';

class CannedResponses extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      response: null,
      responses: [],
      filteredResponses: [],
      responsesStatus: 'Carregando respostas predefinidas...',
      isModalOpen: false,
    };
  }

  manager = Manager.getInstance();

  async componentDidMount() {
    try {
      const response = await fetch(
        process.env.REACT_APP_CANNED_RESPONSES_ENDPOINT,
        {
          method: 'POST',
          body: new URLSearchParams({
            Token:
              this.manager.store.getState().flex.session.ssoTokenPayload.token,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        }
      );
      if (response.status !== 200) {
        console.error('Error requesting canned responses', response.statusText);
        this.setState({
          responsesStatus: 'Erro ao carregar as respostas predefinidas',
        });
      }
      const responses = await response.json();
      this.setState({
        responses,
        filteredResponses: responses,
        responsesStatus:
          responses.length > 0 ? 'Sucesso' : 'Nenhuma resposta encontrada',
      });
    } catch (err) {
      this.setState({
        responsesStatus: 'Erro ao carregar as respostas predefinidas',
      });
    }
  }

  handleModalOpen = () => this.setState({ isModalOpen: true });
  handleModalClose = () => this.setState({ isModalOpen: false });

  render() {
    const modalHeadingID = 'canned-responses-modal-heading';
    return (
      <Box marginBottom="space80">
        <Button
          fullWidth
          variant="secondary"
          disabled={this.state.responsesStatus !== 'Sucesso'}
          onClick={this.handleModalOpen}
        >
          {this.state.responsesStatus === 'Sucesso'
            ? 'Respostas predefinidas'
            : this.state.responsesStatus}
        </Button>
        <Modal
          ariaLabelledby={modalHeadingID}
          isOpen={this.state.isModalOpen}
          onDismiss={this.handleModalClose}
          size="default"
        >
          <ModalHeader>
            <ModalHeading as="h3" id={modalHeadingID}>
              Respostas predefinidas
            </ModalHeading>
          </ModalHeader>
          <ModalBody>
            <Box style={{ minHeight: 350 }}>
              <Combobox
                placeholder="Pesquisar respostas..."
                autocomplete
                initialIsOpen
                items={this.state.filteredResponses}
                optionTemplate={(item) => (
                  <>
                    <Text as="p" fontWeight="fontWeightBold">
                      {item.title}
                    </Text>
                    <Text as="span" fontStyle="italic" color="colorTextWeak">
                      <Truncate title={item.message}>{item.message}</Truncate>
                    </Text>
                  </>
                )}
                itemToString={(item) => item.title}
                selectedItem={this.state.response}
                onSelectedItemChange={({ selectedItem }) => {
                  this.setState({ response: selectedItem });
                }}
                onInputValueChange={({ inputValue }) => {
                  if (inputValue !== undefined) {
                    this.setState({
                      filteredResponses: this.state.responses.filter((item) =>
                        item.title
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                      ),
                    });
                  }
                }}
              />
              {this.state.response && (
                <Box paddingY="space50">
                  <Text marginBottom="space40" textAlign="center">
                    Conteúdo da mensagem:
                  </Text>
                  <Box display="flex" justifyContent="center">
                    <Box
                      backgroundColor="colorBackgroundBrand"
                      color="colorTextInverse"
                      borderRadius={'borderRadius30'}
                      maxWidth={440}
                      minWidth={100}
                      padding="space30"
                    >
                      <span style={{ whiteSpace: 'pre-line' }}>
                        {this.state.response.message}
                      </span>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </ModalBody>
          <ModalFooter>
            <ModalFooterActions>
              <Button
                variant="secondary"
                onClick={() => {
                  this.setState({
                    response: null,
                    filteredResponses: this.state.responses,
                  });
                  this.handleModalClose();
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={!this.state.response}
                onClick={() => {
                  Actions.invokeAction('SendMessage', {
                    conversationSid: this.props.channelSid,
                    body: this.state.response.message,
                  });
                  this.setState({
                    response: null,
                    filteredResponses: this.state.responses,
                  });
                  this.handleModalClose();
                }}
              >
                Enviar mensagem
              </Button>
            </ModalFooterActions>
          </ModalFooter>
        </Modal>
      </Box>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  let currentTask = false;
  state.flex.worker.tasks.forEach((task) => {
    if (ownProps.channelSid === task.attributes.channelSid) {
      currentTask = task;
    }
  });

  return {
    state,
    currentTask,
  };
};

export default connect(mapStateToProps)(withTheme(CannedResponses));
