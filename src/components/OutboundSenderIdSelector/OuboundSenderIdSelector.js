import React, { useEffect, useState } from 'react';
import { withTheme } from '@twilio/flex-ui';
import { Box } from '@twilio-paste/core/box';
import { HelpText } from '@twilio-paste/core/help-text';
import { Label } from '@twilio-paste/core/label';
import { Select, Option } from '@twilio-paste/core/select';
import phoneNumberService from '../../services/PhoneNumberService';

const OutboundSenderIdSelector = ({
  selectedSenderId,
  setSelectedSenderId,
}) => {
  const [fetchingPhoneNumbers, setFetchingPhoneNumbers] = useState(true);
  const [fetchingPhoneNumbersFailed, setFetchingPhoneNumbersFailed] =
    useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [helpText, setHelpText] = useState('Loading phone numbers...');
  const [selectOptions, setSelectOptions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await phoneNumberService.findAll();
        setPhoneNumbers(response.phoneNumbers);
      } catch (error) {
        setFetchingPhoneNumbersFailed(true);
      } finally {
        setFetchingPhoneNumbers(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (fetchingPhoneNumbers) {
      setSelectOptions([]);
      setHelpText('Carregando números...');
    } else if (fetchingPhoneNumbersFailed) {
      setSelectOptions([]);
      setHelpText('Não foi possível carregar os números');
    } else {
      setSelectOptions([
        {
          friendlyName: 'Selecione um número de saída',
          phoneNumber: 'placeholder',
        },
        ...phoneNumbers,
      ]);
      setHelpText('');

      // initialize state to the first number, which is what the Select control will display
      if (!selectedSenderId && phoneNumbers.length > 0) {
        setSelectedSenderId(phoneNumbers[0].phoneNumber);
      }
    }
  }, [fetchingPhoneNumbers, fetchingPhoneNumbersFailed]);

  return (
    <Box width="100%">
      <Label htmlFor="outboundSenderIdSelect" required>
        Número de saída
      </Label>
      <Select
        id="outboundSenderIdSelect"
        disabled={helpText !== ''}
        value={selectedSenderId}
        onChange={(e) => setSelectedSenderId(e.target.value)}
        required
      >
        {selectOptions.map((item) => (
          <Option
            value={item.phoneNumber}
            disabled={item.phoneNumber === 'placeholder'}
            key={item.phoneNumber}
          >
            {item.friendlyName}
          </Option>
        ))}
      </Select>
      {helpText && <HelpText>{helpText}</HelpText>}
    </Box>
  );
};

export default withTheme(OutboundSenderIdSelector);
