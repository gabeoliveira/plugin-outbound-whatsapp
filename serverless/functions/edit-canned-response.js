const TokenValidator = require('twilio-flex-token-validator').functionValidator;
const { object, string, number } = require('yup');

exports.handler = TokenValidator(async (context, event, callback) => {
  const {
    ACCOUNT_SID,
    AUTH_TOKEN,
    TWILIO_SYNC_SERVICE_SID,
    TWILIO_SYNC_CANNED_RESPONSES_LIST,
  } = context;
  const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

  const response = new Twilio.Response();

  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (!event.TokenResult?.roles.includes('admin')) {
    console.log('user not authorized');
    response.setStatusCode(403);
    response.setBody({
      status: 403,
      errors: { reason: 'User not authorized to perform this action.' },
    });
    return callback(null, response);
  }

  const { success, error } = await validate(event);

  if (!success) {
    response.appendHeader('Content-Type', 'plain/text');
    response.setBody(error.errors.join('\n'));
    response.setStatusCode(400);
    return callback(null, response);
  }

  try {
    let item;
    if (event.index) {
      item = await client.sync.v1
        .services(TWILIO_SYNC_SERVICE_SID)
        .syncLists(TWILIO_SYNC_CANNED_RESPONSES_LIST)
        .syncListItems(event.index)
        .update({ data: { title: event.title, message: event.message } });
      console.log(`canned response with index ${item.index} updated.`);
    } else {
      item = await client.sync.v1
        .services(TWILIO_SYNC_SERVICE_SID)
        .syncLists(TWILIO_SYNC_CANNED_RESPONSES_LIST)
        .syncListItems.create({
          data: { title: event.title, message: event.message },
        });
      console.log(`canned response with index ${item.index} created.`);
    }

    response.appendHeader('Content-Type', 'application/json');
    response.setBody({ index: item.index, ...item.data });
    callback(null, response);
  } catch (error) {
    console.error(error);
    response.appendHeader('Content-Type', 'plain/text');
    response.setBody(error.message);
    response.setStatusCode(500);
    callback(null, response);
  }
});

const validate = async (event) => {
  const schema = object().shape({
    index: number().nullable(),
    title: string().required(),
    message: string().required(),
  });
  try {
    await schema.validate(event, {
      abortEarly: false,
      stripUnknown: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Request validation failed', error);

    return { error, success: false };
  }
};
