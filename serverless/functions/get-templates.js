const TokenValidator = require('twilio-flex-token-validator').functionValidator;
const base64 = require('base-64');
const fetch = require('node-fetch');

const { Headers } = fetch;
const { URLSearchParams } = require('url');

exports.handler = TokenValidator(async (context, event, callback) => {
  const {
    ACCOUNT_SID, 
    AUTH_TOKEN,
    TWILIO_API_READ_TEMPLATES_URL
  } = context;

  const {
    pageSize,
    page,
    pageToken
  } = event;
  
  const response = new Twilio.Response();
  response.appendHeader('Access-Control-Allow-Origin', '*');
  response.appendHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const headers = new Headers();
    headers.append('Authorization', 'Basic ' + base64.encode(ACCOUNT_SID + ":" + AUTH_TOKEN));
    
    const params = new URLSearchParams();
    if (pageSize) {
      params.append('PageSize', pageSize);
    }
    if (page) {
      params.append('Page', page);
    }
    if (pageToken) {
      params.append('PageToken', pageToken);
    }

    const requestUrl = TWILIO_API_READ_TEMPLATES_URL + '?' + params;
    console.log('Request', requestUrl);
    console.log('Headers', headers);
    const resp = await fetch(requestUrl, { method: 'GET', headers });
    const body = await resp.json();

    response.setStatusCode(200);
    response.setBody(body);
    console.log(response);
    return callback(null, response);  
  } catch (error) {
    console.error(error);
    response.setStatusCode(error && error.status || 500);
    response.setBody(error);
    return callback(null, response);
  }
});
