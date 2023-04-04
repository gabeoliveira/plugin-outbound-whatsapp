import { Manager } from '@twilio/flex-ui';
import axios from 'axios';

class TaskService {
  manager = Manager.getInstance();
  baseUrl = process.env.REACT_APP_TASK_CREATION_ENDPOINT;
  availableActivitySid = process.env.REACT_APP_AVAILABLE_ACTIVITY_SID;
  workspaceSid = process.env.REACT_APP_WORKSPACE_SID;
  workflowSid = process.env.REACT_APP_WORKFLOW_SID;
  queueSid = process.env.REACT_APP_TASK_QUEUE_SID;

  createTask = async (fromNumber, toNumber, initialNotificationMessage) => {
    let data = {
      fromNumber,
      toNumber,
      targetWorkerSid: this.manager.workerClient.sid,
      initialNotificationMessage,
      Token: this.manager.store.getState().flex.session.ssoTokenPayload.token,
      workspaceSid: this.workspaceSid,
      workflowSid: this.workflowSid,
      queueSid: this.queueSid,
    };

    return axios.post(this.baseUrl, data).then((response) => {
      return response.data;
    });
  };
}

const taskService = new TaskService();

export default taskService;
