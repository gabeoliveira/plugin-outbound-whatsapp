import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { IconButton, withTheme } from '@twilio/flex-ui';
import {
  useMenuState,
  MenuButton,
  Menu,
  MenuItem,
} from '@twilio-paste/core/menu';

const NewWaTaskButton = () => {
  const menu = useMenuState();
  return (
    <>
      <MenuButton element="MAIN_HEADER_MENU_BUTTON" {...menu} variant="reset">
        <IconButton icon="Whatsapp" themeOverride={{ lightHover: true }} />
        {/* <PlusIcon decorative={false} size="sizeIcon10" title="Add to cart" /> */}
      </MenuButton>
      <Menu {...menu} aria-label="Actions">
        <MenuItem
          {...menu}
          onClick={() => Flex.Actions.invokeAction('waModalControl')}
        >
          Enviar mensagem para um número
        </MenuItem>
        <MenuItem
          {...menu}
          onClick={() => Flex.Actions.invokeAction('bulkWhatsAppModal')}
        >
          Enviar mensagem em massa
        </MenuItem>
      </Menu>
    </>
  );
};

export default withTheme(NewWaTaskButton);
