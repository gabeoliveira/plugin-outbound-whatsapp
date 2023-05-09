const TokenValidator = require('twilio-flex-token-validator').functionValidator;
const { object, string } = require('yup');

exports.handler = TokenValidator(async (context, event, callback) => {
  const { ACCOUNT_SID, AUTH_TOKEN } = context;
  const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

  const response = new Twilio.Response();

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { params, success, error } = await validate(event);

  if (!success) {
    console.log('Event property check failed.', error);
    response.setStatusCode(400);
    response.setBody({ status: 400, errors: error });
    return callback(null, response);
  }

  let {
    fromNumber,
    toNumber,
    targetWorkerSid,
    initialNotificationMessage,
    workspaceSid,
    workflowSid,
    queueSid,
  } = params;

  console.log(`Processing request with parameters ${JSON.stringify(params)}`);

  fromNumber = `whatsapp:${fromNumber || process.env.TWILIO_WHATSAPP_NUMBER}`;
  console.log(`Sending outbound request from ${fromNumber}`);

  let result;
  try {
    const previousConversation = await fetchPreviousConversations(
      client,
      fromNumber,
      toNumber
    );

    if (previousConversation == null) {
      result = await openTaskInteraction(
        client,
        toNumber,
        fromNumber,
        initialNotificationMessage,
        {
          workspace_sid: workspaceSid,
          workflow_sid: workflowSid,
          worker_sid: targetWorkerSid,
          queue_sid: queueSid,
        }
      );
    } else {
      const users = await fetchConversationUsers(
        client,
        previousConversation.conversationSid
      );

      // se nao estiver em conversa com algum agente, encerra a conversation e
      // cria uma nova
      if (!users.length) {
        console.log(
          'Nenhum usuário encontrado. Encerra conversation e cria uma nova'
        );

        await client.conversations
          .conversations(previousConversation.conversationSid)
          .update({ state: 'closed' });

        result = await openTaskInteraction(
          client,
          toNumber,
          fromNumber,
          initialNotificationMessage,
          {
            workspace_sid: workspaceSid,
            workflow_sid: workflowSid,
            worker_sid: targetWorkerSid,
            queue_sid: queueSid,
          }
        );
      } else {
        console.log(
          `O usuário já possui uma conversa em andamento com ${JSON.stringify(
            users
          )}`
        );

        throw {
          code: 409,
          message: 'O número está em um antedimento',
          attendants: users,
        };
      }
    }

    response.setBody(result);
    callback(null, response);
  } catch (err) {
    console.error(err);
    response.setBody({ message: err.message, ...err });
    response.setStatusCode(err.code || 500);
    callback(null, response);
  }
});

const validate = async (event) => {
  const schema = object().shape({
    fromNumber: string(),
    toNumber: string().required(),
    targetWorkerSid: string(),
    initialNotificationMessage: string().required(),
    workspaceSid: string(),
    workflowSid: string(),
    queueSid: string(),
  });
  try {
    const params = await schema.validate(event, {
      abortEarly: false,
      stripUnknown: true,
    });

    return { params, success: true };
  } catch (error) {
    console.error('Request validation failed', error);

    return { error, success: false };
  }
};

const fetchPreviousConversations = async (client, fromNumber, toNumber) => {
  console.log(
    `Finding existent open conversation between ${toNumber} and ${fromNumber}`
  );
  try {
    const userConversations =
      await client.conversations.v1.participantConversations.list({
        address: `whatsapp:${toNumber}`,
      });

    console.log(userConversations);

    const openConversation = userConversations.find(
      (conversation) =>
        conversation.conversationState === 'active' &&
        (conversation.participantMessagingBinding || {}).proxy_address ===
          fromNumber
    );

    if (openConversation) {
      console.log(`Open conversation is '${JSON.stringify(openConversation)}'`);

      return openConversation;
    }

    console.warn(`Open conversation not found for ${toNumber}`);

    return null;
  } catch (error) {
    console.error(`Error fetching previous conversation!`, error);
    throw error;
  }
};

const openTaskInteraction = async (
  client,
  to,
  from,
  body,
  routingProperties
) => {
  const toNumber = `whatsapp:${to}`;
  console.log(`Creating interaction`);
  try {
    const interaction = await client.flexApi.v1.interaction.create({
      channel: {
        type: 'whatsapp',
        initiated_by: 'agent',
        properties: {
          type: 'whatsapp',
        },
        participants: [
          {
            address: toNumber,
            proxy_address: from,
          },
        ],
      },
      routing: {
        properties: {
          ...routingProperties,
          task_channel_unique_name: 'Chat',
          attributes: {
            from,
            direction: 'outbound',
            name: toNumber,
            customerAddress: toNumber,
            twilioNumber: from,
            channelType: 'whatsapp',
            initialNotificationMessage: body,
          },
        },
      },
    });

    console.log(`New interaction is '${JSON.stringify(interaction)}'`);

    const taskAttributes = JSON.parse(
      interaction.routing.properties.attributes
    );

    const conversationSid = taskAttributes.conversationSid;

    // TODO: update conversation with iteraction
    await sendMessage(client, conversationSid, from, body);

    return {
      success: true,
      interactionSid: interaction.sid,
      conversationSid,
    };
  } catch (error) {
    console.error(`Error creating task interaction!`, error);
    throw error;
  }
};

const fetchConversationUsers = async (client, conversationSid) => {
  console.log(`Finding users of conversation ${conversationSid}`);
  try {
    const conversationParticipants = await client.conversations.v1
      .conversations(conversationSid)
      .participants.list({ limit: 20 });

    console.log(
      `Found participants ${JSON.stringify(conversationParticipants)}`
    );

    const users = await Promise.all(
      conversationParticipants
        .filter((participant) => participant.identity != null)
        .map(async (participant) => {
          console.log(`Fetch user ${JSON.stringify(participant)}`);

          const user = await client.conversations.v1
            .users(participant.identity)
            .fetch();

          console.log(`User is ${JSON.stringify(user)}`);
          return user;
        })
    );

    return users;
  } catch (error) {
    console.error(`Error fetching conversation users!`, error);
    throw error;
  }
};

const sendMessage = async (client, conversationSid, author, body) => {
  try {
    const chatMessage = await client.conversations.v1
      .conversations(conversationSid)
      .messages.create({ author, body });

    console.log(`Chat Message is '${JSON.stringify(chatMessage)}'`);

    return chatMessage;
  } catch (error) {
    console.error(`Error Sending Conversation Message!`, error);
    throw error;
  }
};
