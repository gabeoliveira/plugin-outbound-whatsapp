import React from 'react';
import { VERSION, Actions } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
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

    flex.MainHeader.Content.add(<NewWaTaskButton key="outbound-whatsapp-button"/>, {sortOrder: -999, align: 'end'})

    flex.Actions.registerAction("waModalControl", (payload) => {
      var event = new Event("waModalControlOpen");
      document.dispatchEvent(event);
      return Promise.resolve();
    });

    flex.MainContainer.Content.add(<OutboundWaDialog key="imageModal" />, {
      sortOrder: 1
    });

    /* Agent auto-responses */

    flex.MessageInput.Content.add(<CannedResponses key="canned-responses" />);

    manager.chatClient.on('channelJoined', payload => {
      console.log('Channel Joined');
      console.log(payload);
    });
    
    manager.workerClient.on('reservationCreated', payload => {
      

      const { sid , task } = payload;

      console.log(task);

      if(task.attributes.channelType === 'whatsapp' && task.attributes.direction === 'outbound'){
        console.log('New outbound task received');
        
        flex.Actions.invokeAction('AcceptTask', {
          sid
        });

        flex.Actions.invokeAction('SelectTask', {
          sid
        });

         // define a message to send into the channel once the task is automatically accepted - if you wish for the agent to select a message instead of sending it automatically, just remove this piece of code

        let body = `Hello! We're reaching out to talk to you about your request. Please reply with YES to talk to one of our agents.`;

        flex.Actions.invokeAction('SendMessage', {
          channelSid: task.attributes.channelSid,
          body: body
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
