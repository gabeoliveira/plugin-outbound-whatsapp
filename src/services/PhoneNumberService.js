import { Manager } from '@twilio/flex-ui';
import ApiService from './ApiService';

class PhoneNumberService extends ApiService {
  #flex_service_instance_sid =
    Manager.getInstance().serviceConfiguration.flex_service_instance_sid;
  STORAGE_KEY = `FLEX_PHONE_NUMBERS_${this.#flex_service_instance_sid}`;
  EXPIRY = 86400000; // 1 day

  findAll = async () => {
    var cachedResult = JSON.parse(
      localStorage.getItem(this.STORAGE_KEY) || '{}'
    );
    // if storage value has expired, discard
    if (cachedResult.expiry < new Date().getTime())
      cachedResult.success = false;
    // if we have a valid storage value use it, otherwise get from backend.
    const result = cachedResult.success ? cachedResult : await this.#findAll();
    return result;
  };

  #findAll = async () => {
    const body = new URLSearchParams();
    body.append('Token', this._manager.user.token);

    const response = await this._fetchJsonWithReject(
      `${this._baseUrl}/common/flex/phone-numbers/list-phone-numbers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      }
    );

    // if response from service was successful, store it
    if (response.success) {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify({
          ...response,
          expiry: new Date().getTime() + this.EXPIRY,
        })
      );
    }

    return response;
  };
}

const phoneNumberService = new PhoneNumberService();
export default phoneNumberService;
