import { Manager } from '@twilio/flex-ui';
import axios from 'axios';

class TwilioService {
    manager = Manager.getInstance();
    baseUrl = process.env.REACT_APP_GET_TEMPLATES_ENDPOINT;

    getTemplates = (pageSize, page, pageToken) => {
        const data = {
            pageSize,
            page,
            pageToken,
            Token: this.manager.store.getState().flex.session.ssoTokenPayload.token
        }

        return axios.post(this.baseUrl, data)
            .then(response => {
                return response.data.whatsapp_templates;
            })
            .catch(err => console.log(err));
    }
}

const twilioService = new TwilioService();
export default twilioService;