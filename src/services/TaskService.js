import { Manager } from "@twilio/flex-ui"
import axios from "axios"

class TaskService {
  manager = Manager.getInstance()
  baseUrl = process.env.REACT_APP_TASK_CREATION_ENDPOINT
  availableActivitySid = process.env.REACT_APP_AVAILABLE_ACTIVITY_SID
  workspaceSid =
    process.env.REACT_APP_WORKSPACE_SID || "WS404509c12dcc5a8ed06d1784ddbf8515"
  workflowSid =
    process.env.REACT_APP_WORKFLOW_SID || "WW969bf9ca057aa1efcec5ff753d63fa2c"
  queueSid =
    process.env.REACT_APP_TASK_QUEUE_SID || "WQ1249a91f4f0dac50b44ccbd98d5cb6b9"

  createTask = async (toNumber, initialNotificationMessage) => {
    let data = {
      toNumber,
      targetWorkerSid: this.manager.workerClient.sid,
      initialNotificationMessage,
      Token: this.manager.store.getState().flex.session.ssoTokenPayload.token,
      workspaceSid: this.workspaceSid,
      workflowSid: this.workflowSid,
      queueSid: this.queueSid,
    }

    return axios.post(this.baseUrl, data).then((response) => {
      return response.data
    })
  }
}

const taskService = new TaskService()

export default taskService
