import {
    SIGNALR_OUTGOING_CALLS,
    SIGNALR_INCOMING_CALL_RESPONSE,
    RECEIVE_NOTIFICATIONS,
    RECEIVE_INCOMING_CALL_RESPONSE,
    SIGNALR_NOTIFY_STREAMING_URL,
    RECEIVE_STREAMING_URL,
    RE_ASSIGN_ORGANIZER,
    CHANGE_ROOM_ORGANIZER,
    USER_STATUS,
    RECEIVE_USER_STATUS,
    MISSED_CALL_NOTIFICATION,
    RECEIVE_MISSED_CALL_NOTIFICATION
} from "../actions/Types";

const signalrApiUrl = process.env.REACT_APP_SIGNALR_API_URL;

// const signalR = require("@aspnet/signalr");
// const signalRConnection = new signalR.HubConnectionBuilder().withUrl("http://103.213.192.118:5070/NotificationHub").build();


const signalR = require("@microsoft/signalr");
const signalRConnection = new signalR.HubConnectionBuilder()
    .withUrl(signalrApiUrl)
    .withAutomaticReconnect()
    .build();

export function signalRRegistrationMiddleware(store) {
    if (signalRConnection !== null) {
        signalRConnection.start().then(() => console.log("Connection Started"), () => console.log("Something went wrong"));
    }
}

export function signalRInvokeMiddleware(store) {
    return (next) => async (action) => {
        switch (action.type) {

            case SIGNALR_OUTGOING_CALLS:
                signalRConnection.invoke('SendOutGoingNotifications', action.value);
                break;

            case SIGNALR_INCOMING_CALL_RESPONSE:
                signalRConnection.invoke('SignalRIncomingcallNotifications', action.value);
                break;

            case SIGNALR_NOTIFY_STREAMING_URL:
                signalRConnection.invoke('NotifyStreamingUrl', action.value);
                break;

            case RE_ASSIGN_ORGANIZER:
                signalRConnection.invoke('ReAssignOrganizer', action.value);
                break;

            case USER_STATUS:
                signalRConnection.invoke('UserStatus', action.value);
                break;

            case MISSED_CALL_NOTIFICATION:
                signalRConnection.invoke('MissedCallNotification', action.value);
                break;

            default:
                break;
        }
        return next(action);
    }
}

export function signalRRegisterCommands(store) {

    signalRConnection.on('ReceiveIncomingNotifications', data => {
        store.dispatch({ type: RECEIVE_NOTIFICATIONS, data: data })
    });

    signalRConnection.on('ReceiveInComingCallReponse', data => {
        store.dispatch({ type: RECEIVE_INCOMING_CALL_RESPONSE, data: data })
    });

    signalRConnection.on('ReceiveStreamingUrl', data => {
        store.dispatch({ type: RECEIVE_STREAMING_URL, data: data })
    });

    signalRConnection.on('ChangeRoomOrganizer', data => {
        store.dispatch({ type: CHANGE_ROOM_ORGANIZER, data: data })
    });

    signalRConnection.on('ReceiveUserStatus', data => {
        store.dispatch({ type: RECEIVE_USER_STATUS, data: data })
    });

    signalRConnection.on('ReceiveMissedCallNotification', data => {
        store.dispatch({ type: RECEIVE_MISSED_CALL_NOTIFICATION, data: data })
    });

}