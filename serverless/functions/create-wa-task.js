const TokenValidator = require("twilio-flex-token-validator").functionValidator
const { object, string } = require("yup")

exports.handler = TokenValidator(async (context, event, callback) => {
  const { ACCOUNT_SID, AUTH_TOKEN } = context
  const client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN)

  const response = new Twilio.Response()

  response.appendHeader("Access-Control-Allow-Origin", "*")
  response.appendHeader("Access-Control-Allow-Methods", "OPTIONS, POST, GET")
  response.appendHeader("Content-Type", "application/json")
  response.appendHeader("Access-Control-Allow-Headers", "Content-Type")

  const { params, success, error } = await validate(event)

  if (!success) {
    console.log("Event property check failed.", error)
    response.setStatusCode(400)
    response.setBody({ status: 400, errors: error })
    return callback(null, response)
  }

  const {
    toNumber,
    targetWorkerSid,
    initialNotificationMessage,
    workspaceSid,
    workflowSid,
    queueSid,
  } = params

  const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`
  let result

  try {
    const previousConversation = await fetchPreviousConversations(
      client,
      toNumber,
    )

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
        },
      )
    } else if (previousConversation != null) {
      result = await updateTaskInteraction(client, previousConversation, {
        workspace_sid: workspaceSid,
        workflow_sid: workflowSid,
        worker_sid: targetWorkerSid,
        queue_sid: queueSid,
      })

      if (result.success) {
        await sendMessage(
          client,
          previousConversation.conversationSid,
          fromNumber,
          initialNotificationMessage,
        )
      } else {
        await client.conversations
          .conversations(previousConversation.conversationSid)
          .update({ state: "closed" })

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
          },
        )
      }
    } else {
      result = await sendOutboundMessage(
        client,
        toNumber,
        fromNumber,
        initialNotificationMessage,
        previousConversation,
      )
    }

    response.setBody(result)
    callback(null, response)
  } catch (err) {
    response.appendHeader("Content-Type", "plain/text")
    response.setBody(err.message)
    response.setStatusCode(500)
    console.error(err)
    callback(null, response)
  }
})

const validate = async (event) => {
  const schema = object().shape({
    toNumber: string().required(),
    targetWorkerSid: string(),
    initialNotificationMessage: string().required(),
    workspaceSid: string(),
    workflowSid: string(),
    queueSid: string(),
    Token: string(),
  })
  try {
    const params = await schema.validate(event, {
      abortEarly: false,
      stripUnknown: true,
    })

    return { params, success: true }
  } catch (error) {
    console.error("Request validation failed", error)

    return { error, success: false }
  }
}

const fetchPreviousConversations = async (client, toNumber) => {
  console.log(`Finding existent open conversation for ${toNumber}`)
  try {
    const userConversations =
      await client.conversations.v1.participantConversations.list({
        address: `whatsapp:${toNumber}`,
      })

    console.log(userConversations)

    const openConversation = userConversations.find(
      (conversation) => conversation.conversationState === "active",
    )

    if (openConversation) {
      console.log(`Open conversation is '${JSON.stringify(openConversation)}'`)

      return openConversation
    }

    console.warn(`Open conversation not found for ${toNumber}`)

    return null
  } catch (error) {
    console.error(`Error fetching previous conversation!`, error)
    throw error
  }
}

const openTaskInteraction = async (
  client,
  to,
  from,
  body,
  routingProperties,
) => {
  const toNumber = `whatsapp:${to}`
  console.log(`Creating interaction`)
  try {
    const interaction = await client.flexApi.v1.interaction.create({
      channel: {
        type: "whatsapp",
        initiated_by: "agent",
        properties: {
          type: "whatsapp",
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
          task_channel_unique_name: "Chat",
          attributes: {
            from: to,
            direction: "outbound",
            customerName: to,
            customerAddress: toNumber,
            twilioNumber: from,
            channelType: "whatsapp",
          },
        },
      },
    })

    console.log(`New interaction is '${JSON.stringify(interaction)}'`)

    const taskAttributes = JSON.parse(interaction.routing.properties.attributes)

    const conversationSid = taskAttributes.conversationSid

    await sendMessage(client, conversationSid, from, body)

    return {
      success: true,
      interactionSid: interaction.sid,
      conversationSid,
    }
  } catch (error) {
    console.error(`Error creating task interaction!`, error)
    throw error
  }
}

const updateTaskInteraction = async (
  client,
  conversation,
  routingProperties,
) => {
  console.log(`Updating interaction`)
  const attributes = JSON.parse(conversation.conversationAttributes)

  const {
    interactionSid,
    channelSid,
    taskAttributes,
    taskChannelUniqueName,
    webhookSid,
  } = attributes

  try {
    if (webhookSid && interactionSid) {
      await client.conversations
        .conversations(conversation.conversationSid)
        .webhooks(webhookSid)
        .remove()

      await client.flexApi.v1
        .interaction(interactionSid)
        .channels(channelSid)
        .invites.create({
          routing: {
            properties: {
              ...routingProperties,
              task_channel_unique_name: taskChannelUniqueName,
              attributes: taskAttributes,
            },
          },
        })
      return {
        success: true,
        interactionSid: interactionSid,
        conversationSid: conversation.conversationSid,
      }
    }
    return {
      success: false,
      conversationSid: conversation.conversationSid,
    }
  } catch (error) {
    console.error(`Error updating task interaction!`, error)
    throw error
  }
}

const sendOutboundMessage = async (
  client,
  to,
  from,
  body,
  previousConversation,
) => {
  console.log(`Sending outbound whatsapp message for ${toNumber}`)

  const friendlyName = `Outbound ${from} -> ${to}`

  let channel = {}

  if (previousConversation == null) {
    channel = await client.conversations.conversations.create({
      friendlyName,
    })

    try {
      await client.conversations
        .conversations(channel.sid)
        .participants.create({
          "messagingBinding.address": `whatsapp:${to}`,
          "messagingBinding.proxyAddress": from,
        })

      console.log(`Outbound whatsapp message sended for ${toNumber}`)
    } catch (error) {
      console.log(error)

      if (error.code === 50416) {
        return {
          success: false,
          errorMessage: `Error sending message. There is an open conversation already to ${to}`,
        }
      } else
        return {
          success: false,
          errorMessage: `Error sending message. Error while adding ${to} channel`,
        }
    }
  } else {
    channel = previousConversation
    channel.sid = previousConversation.conversationSid
  }

  await sendMessage(client, channel.sid, from, body)

  return { success: true, channelSid: channel.sid }
}

const sendMessage = async (client, conversationSid, author, body) => {
  try {
    const chatMessage = await client.conversations.v1
      .conversations(conversationSid)
      .messages.create({ author, body })

    console.log(`Chat Message is '${JSON.stringify(chatMessage)}'`)

    return chatMessage
  } catch (error) {
    console.error(`Error Sending Conversation Message!`, error)
    throw error
  }
}
