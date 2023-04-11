import {
  Box,
  Button,
  Combobox,
  Text,
  Truncate,
  Label,
  Modal,
  ModalHeader,
  ModalHeading,
  ModalBody,
  ModalFooter,
  ModalFooterActions,
  TextArea,
  Input,
  useToaster,
  Toaster,
} from '@twilio-paste/core';
import { IconButton, Manager } from '@twilio/flex-ui';
import { useEffect, useState } from 'react';

export default function EditCannedResponses() {
  const modalHeadingID = 'edit-canned-responses-modal-heading';
  const [open, setOpen] = useState(false);
  const [responsesFilterInput, setResponsesFilterInput] = useState('');
  const [responses, setResponses] = useState(null);
  const [filteredResponses, setFilteredResponses] = useState([]);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [editedResponse, setEditedResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const cleanState = () => {
    setResponsesFilterInput('');
    setSelectedResponse(null);
    setFilteredResponses(responses);
    setEditedResponse(null);
  };
  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(
        process.env.REACT_APP_CANNED_RESPONSES_ENDPOINT,
        {
          method: 'POST',
          body: new URLSearchParams({
            Token:
              Manager.getInstance().store.getState().flex.session
                .ssoTokenPayload.token,
          }),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
        }
      );
      const responses = await response.json();
      setResponses([
        {
          index: -1,
          title: 'Criar nova resposta predefinida',
          message: 'Selecione essa opção para criar uma nova resposta',
        },
        ...responses,
      ]);
      setFilteredResponses([
        {
          index: -1,
          title: 'Criar nova resposta predefinida',
          message: 'Selecione essa opção para criar uma nova resposta',
        },
        ...responses,
      ]);
    };
    fetchData();
  }, []);
  const toaster = useToaster();
  return (
    <div>
      <IconButton
        icon="Message"
        themeOverride={{ lightHover: true }}
        onClick={() => setOpen(true)}
      />
      <Modal
        ariaLabelledby={modalHeadingID}
        isOpen={open}
        onDismiss={() => {
          cleanState();
          setOpen(false);
        }}
        size="default"
      >
        <ModalHeader>
          <ModalHeading as="h3" id={modalHeadingID}>
            Editar respostas predefinidas
          </ModalHeading>
        </ModalHeader>
        <ModalBody>
          <Box style={{ minHeight: 350 }}>
            <Combobox
              disabled={isLoading}
              placeholder="Pesquisar respostas..."
              autocomplete
              initialIsOpen
              items={filteredResponses}
              inputValue={responsesFilterInput}
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
              selectedItem={selectedResponse}
              onSelectedItemChange={({ selectedItem }) => {
                setSelectedResponse(selectedItem);
                if (selectedItem) {
                  setEditedResponse(
                    selectedItem.index >= 0
                      ? selectedItem
                      : { title: '', message: '' }
                  );
                }
              }}
              onInputValueChange={({ inputValue }) => {
                if (inputValue !== undefined) {
                  setResponsesFilterInput(inputValue);
                  setFilteredResponses(
                    responses.filter(
                      (item) =>
                        item.title
                          .toLowerCase()
                          .includes(inputValue.toLowerCase()) ||
                        item.message
                          .toLowerCase()
                          .includes(inputValue.toLowerCase())
                    )
                  );
                }
              }}
            />
            {editedResponse && (
              <Box paddingY="space80">
                <Label htmlFor="response-title" required>
                  Título
                </Label>
                <Input
                  id="response-title"
                  disabled={isLoading}
                  value={editedResponse.title}
                  onChange={(event) =>
                    setEditedResponse({
                      ...editedResponse,
                      title: event.target.value,
                    })
                  }
                />
                <Box marginTop="space50">
                  <Label htmlFor="response-message" required>
                    Mensagem
                  </Label>
                  <TextArea
                    id="response-message"
                    disabled={isLoading}
                    value={editedResponse.message}
                    onChange={(event) => {
                      setEditedResponse({
                        ...editedResponse,
                        message: event.target.value,
                      });
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
          {selectedResponse && selectedResponse.index >= 0 && (
            <Button
              variant="destructive"
              loading={isLoading}
              onClick={async () => {
                setIsLoading(true);
                let bodyData = {
                  index: selectedResponse.index,
                  Token:
                    Manager.getInstance().store.getState().flex.session
                      .ssoTokenPayload.token,
                };
                const response = await fetch(
                  process.env.REACT_APP_DELETE_CANNED_RESPONSE_ENDPOINT,
                  {
                    method: 'POST',
                    body: new URLSearchParams(bodyData),
                    headers: {
                      'Content-Type':
                        'application/x-www-form-urlencoded;charset=UTF-8',
                    },
                  }
                );
                setIsLoading(false);
                if (response.status === 200) {
                  toaster.push({
                    variant: 'success',
                    message: 'Resposta removida com sucesso!',
                    dismissAfter: 5000,
                  });
                  let updatedList = responses.filter(
                    (response) => response.index !== selectedResponse.index
                  );
                  cleanState();
                  setResponses(updatedList);
                  setFilteredResponses(updatedList);
                } else {
                  const error = await response.text();
                  toaster.push({
                    variant: 'error',
                    message: error,
                    dismissAfter: 5000,
                  });
                }
              }}
            >
              Remover
            </Button>
          )}
          <Toaster {...toaster} />
        </ModalBody>
        <ModalFooter>
          <ModalFooterActions>
            <Button
              variant="secondary"
              onClick={() => {
                cleanState();
                setOpen(false);
              }}
            >
              Sair
            </Button>
            <Button
              variant="primary"
              loading={isLoading}
              onClick={async () => {
                setIsLoading(true);
                let bodyData = {
                  title: editedResponse.title,
                  message: editedResponse.message,
                  Token:
                    Manager.getInstance().store.getState().flex.session
                      .ssoTokenPayload.token,
                };
                if (selectedResponse.index >= 0) {
                  bodyData.index = selectedResponse.index;
                }
                const response = await fetch(
                  process.env.REACT_APP_EDIT_CANNED_RESPONSE_ENDPOINT,
                  {
                    method: 'POST',
                    body: new URLSearchParams(bodyData),
                    headers: {
                      'Content-Type':
                        'application/x-www-form-urlencoded;charset=UTF-8',
                    },
                  }
                );
                setIsLoading(false);
                if (response.status === 200) {
                  toaster.push({
                    variant: 'success',
                    message: 'Alteração feita com sucesso!',
                    dismissAfter: 5000,
                  });
                  const updatedItem = await response.json();
                  let indexFound = false;
                  let updatedList = responses.map((response) => {
                    if (response.index === updatedItem.index) {
                      indexFound = true;
                      return updatedItem;
                    } else {
                      return response;
                    }
                  });
                  if (!indexFound) {
                    updatedList = [...responses, updatedItem];
                  }
                  setResponses(updatedList);
                  setFilteredResponses(updatedList);
                  setSelectedResponse(updatedItem);
                  setResponsesFilterInput(updatedItem.title);
                } else {
                  const error = await response.text();
                  toaster.push({
                    variant: 'error',
                    message: error,
                    dismissAfter: 5000,
                  });
                }
              }}
            >
              Salvar
            </Button>
          </ModalFooterActions>
        </ModalFooter>
      </Modal>
    </div>
  );
}
