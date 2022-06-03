import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
import NewWaTaskButton  from './components/NewWaTaskButton';
import OutboundWaDialog from './components/OutboundWaDialog/OutboundWaDialog';
import CannedResponses from './components/CannedResponses/CannedResponses';


import reducers, { namespace } from './states';

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

    /*Outbound WhatsApp button*/
    flex.MainHeader.Content.add(<NewWaTaskButton key="outbound-whatsapp-button"/>, {sortOrder: -999, align: 'end'})

    /*Custom action to dispatch an event and open the modal screen*/
    flex.Actions.registerAction("waModalControl", (payload) => {
      var event = new Event("waModalControlOpen");
      document.dispatchEvent(event);
      return Promise.resolve();
    });

    /*Outbound Whatsapp Dialog */
    flex.MainContainer.Content.add(<OutboundWaDialog key="imageModal" />, {
      sortOrder: 1
    });

    /*Notification registration for task creation*/

    flex.Notifications.registerNotification({
      id: "waTaskCreated",
      closeButton: true,
      content: "Outbound Whatsapp task created. The customer has not yet been messaged. Please contact him using one of the pre-registered templates.",
      timeout: 5000,
      type: "information"
    });

    /* Agent auto-responses */

    flex.MessageInput.Content.add(<CannedResponses key="canned-responses" />);
  
    
    /* Register event listener for new reservations so Flex will auto-accept outbound tasks */
    manager.workerClient.on('reservationCreated', payload => {
      

      const { sid , task } = payload;

      console.log(task.attributes);


      if(task.attributes.channelType === 'whatsapp' && task.attributes.direction === 'outbound'){
        console.log('New outbound task received');

        flex.Notifications.showNotification("waTaskCreated", null);
        
        flex.Actions.invokeAction('AcceptTask', {
          sid
        });

        flex.Actions.invokeAction('SelectTask', {
          sid
        });

      }

    });

  }

  /**
   * Registers the plugin reducers
   *
   * @param manager { Flex.Manager }
   */
  registerReducers(manager) {
    if (!manager.store.addReducer) {
      // eslint: disable-next-line
      console.error(`You need FlexUI > 1.9.0 to use built-in redux; you are currently on ${VERSION}`);
      return;
    }

    manager.store.addReducer(namespace, reducers);
  }
}
