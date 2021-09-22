# Initiating Outbound WhatsApp From Flex
There are a number of use cases around specifically _initiating_ outbound WhatsApp from Flex - that are not off-the-shelf capabilities within the Flex UI. Since the Flex UI reacts to Tasks, these typically originate from an inbound message coming in _from_ the customer - at which point an agent can converse with the customer via the Flex Chat UI interface. Sometimes though, we (the agent, CRM, or external system) need to be the _initiators_ of the WhatsApp conversation.

This plugin provides support for initiating outbound Whatsapp tasks as an agent.

## Overview

This plugin enables a front-end dialog screen allowing an agent to enter a phone number (international E-164 format) and create a new task for himself. Since WhatsApp has limitations around the types of messages that are allowed in an outbound use case, the plugin also enable a drop-down list with pre-defined messages to initiate the conversation. To support the task creation, the following Twilio Function was added:

1) **create-wa-task.js**: This Twilio Function is called when the agent clicks in _Create Task_. It receives the destination number and also the worker identity, so the task can be created only for them. For security reasons, it only accepts calls from within Flex

## Setup

### Requirements

To deploy this plugin, you will need:
- An active Twilio account with Flex provisioned. Refer to the [Flex Quickstart](https://www.twilio.com/docs/flex/quickstart/flex-basics#sign-up-for-or-sign-in-to-twilio-and-create-a-new-flex-project) to create one.
- WhatsApp set up as a channel on flex. Refer to the [WhatsApp in Flex](https://www.twilio.com/blog/whatsapp-and-flex-in-minutes) article to learn how to do it.
- npm version 5.0.0 or 6 installed (type `npm -v` in your terminal to check)
- Node version 10.12.0 or later installed (type `node -v` in your terminal to check)
- A mobile device with WhatsApp installed
- [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart#install-twilio-cli) along with the [Flex CLI Plugin](https://www.twilio.com/docs/twilio-cli/plugins#available-plugins) and the [Serverless Plugin](https://www.twilio.com/docs/twilio-cli/plugins#available-plugins). * Run the following commands to install them:
   ```
   # Install the Twilio CLI
   npm install twilio-cli -g
   # Install the Serverless and Flex as Plugins
   twilio plugins:install @twilio-labs/plugin-serverless
   twilio plugins:install @twilio-labs/plugin-flex@beta
   ```
   
   * The Twilio CLI with the Serverless and Flex Plugins are recommended for local development and debugging purposes, but you have the option to use the Functions UI in the Twilio Console.

### Twilio Account Settings

Before we begin, we need to collect
all the config values we need to run the plugin on your Flex application:

| Config&nbsp;Value | Description                                                                                                                                                  |
| :---------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account&nbsp;Sid  | Your primary Twilio account identifier - find this [on the Console Dashboard](https://www.twilio.com/console).                                                         |
| Auth Token  | Your Twilio Auth Token, which acts as your password - find this [on the Console Dashboard](https://www.twilio.com/console).                                                         |
| Chat Service SID | Unique identifier for your Flex Chat Service. You can find this on the [Programmable Chat Dashboard](https://www.twilio.com/console/chat/dashboard).                                    |
| Twilio WhatsApp Number | The WhatsApp number to use when sending messages to a WhatsApp recipient. You can find this either on the [Twilio Sandbox for WhatsApp page](https://www.twilio.com/console/sms/whatsapp/learn) if you're using a test number, or the [WhatsApp Senders](https://www.twilio.com/console/sms/whatsapp/senders) if you've enabled personalized WhatsApp numbers.                                  |
| Proxy Service SID | Unique identifier for a Flex Proxy Service. You can check this in the [Proxy Dashboard](https://console.twilio.com/us1/develop/proxy/services).    |
| TaskRouter Agent Available Activity SID | The unique identifier for the Agent Available Activity. Used to set the agent activity as online when creating the Outbound Task. You can find this in [TaskRouter Dashboard](https://console.twilio.com/us1/service/taskrouter/), by accessing your **Flex Workspace**, then **Activities**   |

### Deployment

After the above requirements have been met:

- Clone this repository `git clone REPO_URL`

- Deploy your Twilio function

 ```bash
cd serverless

? Copy the Environment Variables example file to .env
cp .env.example .env

? Fill the .env file with your environment variables

twilio serverless:deploy
```


- Deploy your Twilio Plugin

 ```bash
cd ..

? Copy the Environment Variables example file to .env
cp .env.example .env

? Fill the .env file with your TaskRouter Activity SID and the Twilio Serverless Domain obtained after Function deployment

? Install dependencies
npm install

? Copy appConfig file to your production file
cp public/appConfig.example.js public/appConfig.js

twilio flex:plugins:deploy --major --changelog "Changelog here"
```


To test the plugin locally, run the following command:

  ```bash
twilio flex:plugins:start
```

Navigate to [http://localhost:3000](http://localhost:3000).

That's it!


## Development

Run `twilio flex:plugins --help` to see all the commands we currently support. For further details on Flex Plugins refer to our documentation on the [Twilio Docs](https://www.twilio.com/docs/flex/developer/plugins/cli) page.

## Contributing

Check out [CONTRIBUTING](CONTRIBUTING.md) for more information on how to contribute to this project.

## License

MIT © Twilio Inc.


## Credits

This plugin was based on the [media-message plugin](https://github.com/twilio-labs/plugin-media-messages). Many thanks to the original contributors:
* [jprix](https://github.com/jprix)
* [Terence Rogers](https://github.com/trogers-twilio)
* [Brad McAllister](https://github.com/bdm1981)
* [Vinicius Miguel](https://github.com/vmiguelsilva)

## License

[MIT](http://www.opensource.org/licenses/mit-license.html)

## Disclaimer

No warranty expressed or implied. Software is as is.

[twilio]: https://www.twilio.com

