const TokenValidator = require('twilio-flex-token-validator').functionValidator;

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

  try {
    const lista = await client.sync.v1
      .services(TWILIO_SYNC_SERVICE_SID)
      .syncLists(TWILIO_SYNC_CANNED_RESPONSES_LIST)
      .syncListItems.list();

    response.appendHeader('Content-Type', 'application/json');
    response.setBody(lista.map((item) => item.data));
    console.log(
      `${lista.length} canned responses obtained from /canned-responses`
    );
    callback(null, response);
  } catch (error) {
    console.error(error);
    response.appendHeader('Content-Type', 'plain/text');
    response.setBody(error.message);
    response.setStatusCode(500);
    callback(null, response);
  }
});
