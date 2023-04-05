import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
import { CustomizationProvider } from '@twilio-paste/core/customization';
import NewWaTaskButton from './components/NewWaTaskButton';
import OutboundWaDialog from './components/OutboundWaDialog/OutboundWaDialog';
import CannedResponses from './components/CannedResponses/CannedResponses';

import reducers, { namespace } from './states';
import EditCannedResponses from './components/CannedResponses/EditCannedResponses';

const PLUGIN_NAME = 'OutboundWhatsappPlugin';

export default class OutboundWhatsappPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    this.registerReducers(manager);

    flex.setProviders({
      CustomProvider: (RootComponent) => (props) => {
        const pasteProviderProps = {
          baseTheme: props.theme?.isLight ? 'default' : 'dark',
          theme: props.theme?.tokens,
          style: { minWidth: '100%', height: '100%' },
          elements: {
            MAIN_HEADER_MENU_BUTTON: {
              'box-shadow': 'none !important',
            },
          },
        };

        return (
          <CustomizationProvider {...pasteProviderProps}>
            <RootComponent {...props} />
          </CustomizationProvider>
        );
      },
    });

    if (manager.user.roles.includes('admin')) {
      flex.MainHeader.Content.add(
        <EditCannedResponses key="edit-canned-responses" />,
        { sortOrder: -1000, align: 'end' }
      );
    }

    /*Outbound WhatsApp button*/
    flex.MainHeader.Content.add(
      <NewWaTaskButton key="outbound-whatsapp-button" />,
      { sortOrder: -999, align: 'end' }
    );

    /*Custom action to dispatch an event and open the modal screen*/
    flex.Actions.registerAction('waModalControl', (payload) => {
      var event = new Event('waModalControlOpen');
      document.dispatchEvent(event);
      return Promise.resolve();
    });

    /*Outbound Whatsapp Dialog */
    flex.MainContainer.Content.add(<OutboundWaDialog key="imageModal" />, {
      sortOrder: 1,
    });

    /* Agent auto-responses */

    flex.MessageInputV2.Content.add(<CannedResponses key="canned-responses" />);
  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(
        `You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`
      );
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
