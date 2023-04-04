import * as Flex from '@twilio/flex-ui';

function delay(ms, result) {
  return new Promise((resolve) => setTimeout(() => resolve(result), ms));
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

export default class ApiService {
  _manager = Flex.Manager.getInstance();
  _baseUrl = process.env.FLEX_APP_SERVERLESS_FUNCTONS_BASE_URL;

  async _fetchJsonWithReject(url, config, attempts = 0) {
    return fetch(url, config)
      .then((response) => {
        if (!response.ok) {
          throw response;
        }
        return response.json();
      })
      .catch(async (error) => {
        // Try to return proper error message from both caught promises and Error objects
        // https://gist.github.com/odewahn/5a5eeb23279eed6a80d7798fdb47fe91
        try {
          // Generic retry when calls return a 'too many requests' response
          // request is delayed by a random number which grows with the number of retries
          if (error.status === 429 && attempts < 10) {
            await delay(random(100, 750) + attempts * 100);
            return (
              (await this.fetchJsonWithReject) < T > (url, config, attempts + 1)
            );
          }
          return error.json().then((response) => {
            throw response;
          });
        } catch (e) {
          throw error;
        }
      });
  }
}
