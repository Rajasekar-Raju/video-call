
import AxiosInstance from './Interceptor'
const apiUrl = process.env.REACT_APP_API_URL
const twilioTokenApiUrl = process.env.REACT_APP_TWILIO_TOKEN_API_URL;
const signalrApiUrl = process.env.REACT_APP_SIGNALR_API_URL;

const signalR = require("@microsoft/signalr");
const signalRConnection = new signalR.HubConnectionBuilder()
    .withUrl(signalrApiUrl)
    .withAutomaticReconnect()
    .build();

const Environments = {

    async getAPI(path) {
        let api = await AxiosInstance.get(apiUrl + path)
        return api;
    },

    async getAPIById(path, model) {
        let api = await AxiosInstance.get(apiUrl + path, {
            params: {
                search: model.search
            }
        })
        return api;
    },

    postAPI(path, dataModel) {
        let api = AxiosInstance.post(apiUrl + path, dataModel)
        return api;
    },

    twilioTokenAPI(dataModel) {
        let api = AxiosInstance.post(twilioTokenApiUrl, dataModel)
        return api;
    },

    connectSignalR() {
        if (signalRConnection !== null) {
            signalRConnection.start().then((res) => {
                console.log("Connection Started");
            }).catch(err => {
                console.log("Something went wrong")
            });
        }
    }

}

export default Environments;