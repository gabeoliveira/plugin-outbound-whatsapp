import { parse } from 'url';
import { Manager } from '@twilio/flex-ui';
import ApiService from './ApiService';

class GetTemplatesService extends ApiService {
  #flex_service_instance_sid =
    Manager.getInstance().serviceConfiguration.flex_service_instance_sid;
  STORAGE_KEY = `FLEX_TEMPLATES_${this.#flex_service_instance_sid}`;
  EXPIRY = 3600000; // 1 hour
  PAGE_SIZE = 50;

  _url = process.env.REACT_APP_GET_TEMPLATES_ENDPOINT;

  getAllTemplates = async () => {
    var cachedResult = JSON.parse(
      localStorage.getItem(this.STORAGE_KEY) || '{}'
    );
    // if storage value has expired, discard
    if (cachedResult.expiry < new Date().getTime())
      cachedResult.success = false;
    // if we have a valid storage value use it, otherwise get from backend.
    const result = cachedResult.success
      ? cachedResult.templates
      : await this.#findAll();
    return result;
  };

  #findAll = async () => {
    const templates = [];

    let page = 0;
    let pageSize = this.PAGE_SIZE;
    let pageToken = null;
    let nextPage = null;

    do {
      const response = await this.#getPage(page, pageSize, pageToken);
      templates.push(...response.whatsapp_templates);

      nextPage = response.meta.next_page_url;
      if (nextPage) {
        const { query } = parse(nextPage, true);
        page = query.Page;
        pageSize = query.PageSize;
        pageToken = query.PageToken;
      }
    } while (nextPage != null);

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify({
        templates,
        success: true,
        expiry: new Date().getTime() + this.EXPIRY,
      })
    );

    return templates;
  };

  #getPage = async (page, pageSize, pageToken) => {
    const body = new URLSearchParams();
    body.append('Token', this._manager.user.token);
    body.append('pageSize', pageSize);
    body.append('page', page);
    body.append('pageToken', pageToken);

    return await this._fetchJsonWithReject(this._url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
  };
}

const getTemplatesService = new GetTemplatesService();
export default getTemplatesService;
