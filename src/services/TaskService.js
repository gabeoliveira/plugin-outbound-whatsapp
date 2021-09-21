import { Manager  } from '@twilio/flex-ui';
import axios from 'axios';

class TaskService {

    manager = Manager.getInstance();
    baseUrl = process.env.REACT_APP_TASK_CREATION_ENDPOINT;

    createTask = (toNumber) => {
        let data = {
            toNumber: 'whatsapp:' + toNumber,
            worker: this.manager.user.identity
        }
        
        axios.post(this.baseUrl,data)
            .then(response => console.log(response.data))
            .catch(err => console.log(err));

    }

      
    
}

const taskService = new TaskService();

export default taskService;