import { Manager  } from '@twilio/flex-ui';
import axios from 'axios';

class TaskService {

    manager = Manager.getInstance();
    baseUrl = process.env.REACT_APP_TASK_CREATION_ENDPOINT;
    availableActivitySid = process.env.REACT_APP_AVAILABLE_ACTIVITY_SID;

     createTask = (toNumber, initialNotificationMessage) => {
        let data = {
            toNumber,
            targetWorkerSid: this.manager.workerClient.sid,
            initialNotificationMessage,
            Token: this.manager.store.getState().flex.session.ssoTokenPayload.token
        }
        
       return axios.post(this.baseUrl,data)
            .then(response => {
                return response.data;
            })
    }

      
    
}

const taskService = new TaskService();

export default taskService;