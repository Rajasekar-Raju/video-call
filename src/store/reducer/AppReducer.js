import StorageConfiguration from '../../services/StorageConfiguration';
import Notify, { AlertTypes } from '../../services/Notify';
import {
    RECEIVE_NOTIFICATIONS,
    CLOSE_DIALOG,
    RECEIVE_INCOMING_CALL_RESPONSE,
    OPEN_WAITING_POPUP,
    CLOSE_INCOMING_POPUP,
    CLOSE_WAITING_POPUP,
    CLINIC_ID,
    SAVE_RECIPIENTS,
    REMOVE_PARTICIPANTS,
    RECEIVE_STREAMING_URL,
    CHANGE_ROOM_ORGANIZER,
    RECEIVE_USER_STATUS,
    UPDATE_REFRESH_PHYSICIANS,
    UPDATE_NOTIFICATIONS,
    UPDATE_PROFILE_PICTURE,
    RECEIVE_MISSED_CALL_NOTIFICATION
} from "../actions/Types";

const initialState = {
    isOpenIncomingPopUp: false,
    isOpenWaitingPopUp: false,
    userLoginUserId: StorageConfiguration.sessionGetItem('userId'),
    incomingCallInfo: {},
    recepientsInfo: {},
    callResponseInfo: {},
    callResponseType: '',
    roomDetails: {},
    clinicId: '',
    receipientsList: [],
    streamingData: {},
    isRefreshPhyscians: false,
    isNotifications: false,
    isProfilePictureUpdated: false
};

export const appReducer = (state = initialState, action = {}) => {
    switch (action.type) {
        case RECEIVE_NOTIFICATIONS:
            let receipientsList = action.data.recepientsInfo;
            let currentUserId = Number(StorageConfiguration.sessionGetItem('userId'));
            let isForCurrentUser = receipientsList.filter(res => res.userId === currentUserId && res.status === 'Calling');
            let roomParticipants = receipientsList.filter(res => res.userId === currentUserId && res.status !== 'Calling');
            // state['receipientsList'] = receipientsList;
            if (isForCurrentUser.length > 0) {
                return Object.assign({}, state, {
                    isOpenIncomingPopUp: true,
                    incomingCallInfo: action.data.callerInfo,
                    roomDetails: action.data.room,
                    receipientsList: receipientsList
                });
            }
            if (roomParticipants.length > 0) {
                return Object.assign({}, state, {
                    receipientsList: receipientsList
                });
            }
            return state;
        case RECEIVE_INCOMING_CALL_RESPONSE:
            let currentUser = Number(StorageConfiguration.sessionGetItem('userId'));
            let currentRoomName = action.data.roomDetails.room_name;
            let currentParticipants = state.receipientsList.filter(x => x.roomId === currentRoomName);
            let isCurrentParticipant = currentParticipants.findIndex(x => Number(x.userId) === currentUser);
            if ((Number(action.data.data.callerId) === currentUser || isCurrentParticipant !== -1) && action.data.responseData.type === 'attended') {
                //Find index of specific object using findIndex method.    
                let objIndex = state.receipientsList.findIndex((obj => obj.userId === action.data.responseData.userId));
                state.receipientsList[objIndex].status = action.data.responseData.type;

                return Object.assign({}, state, {
                    callResponseInfo: action.data,
                    incomingCallInfo: action.data.data,
                    callResponseType: action.data.responseData.type,
                    roomDetails: action.data.roomDetails,
                    receipientsList: currentParticipants
                });
            }
            if ((Number(action.data.data.callerId) === currentUser || isCurrentParticipant !== -1) && action.data.responseData.type === 'declined') {
                //Find index of specific object using findIndex method.    
                let objIndex = state.receipientsList.findIndex((obj => obj.userId === action.data.responseData.userId));
                state.receipientsList[objIndex].status = action.data.responseData.type;

                return Object.assign({}, state, {
                    isOpenIncomingPopUp: false,
                    callResponseInfo: action.data,
                    callResponseType: action.data.responseData.type,
                    roomDetails: action.data.roomDetails,
                    receipientsList: currentParticipants
                });
            }
            if ((Number(action.data.data.callerId) === currentUser || isCurrentParticipant !== -1) && action.data.responseData.type === 'No Response') {
                //Find index of specific object using findIndex method.    
                let objIndex = state.receipientsList.findIndex((obj => obj.userId === action.data.responseData.userId));
                state.receipientsList[objIndex].status = action.data.responseData.type;

                return Object.assign({}, state, {
                    isOpenIncomingPopUp: false,
                    callResponseInfo: action.data,
                    callResponseType: action.data.responseData.type,
                    roomDetails: action.data.roomDetails,
                    receipientsList: currentParticipants
                });
            }
            return state;
        case OPEN_WAITING_POPUP:
            return Object.assign({}, state, {
                isOpenWaitingPopUp: true,
                recepientsInfo: action.value,
                callResponseType: ''
            });
        case CLOSE_INCOMING_POPUP:
            //Find index of specific object using findIndex method.
            let objIndex = state.receipientsList.findIndex((obj => obj.userId === action.value.responseData.userId));
            state.receipientsList[objIndex].status = action.value.responseData.type;
            return Object.assign({}, state, {
                isOpenIncomingPopUp: false,
                receipientsList: state.receipientsList,
            });
        case CLOSE_WAITING_POPUP:
            return Object.assign({}, state, {
                isOpenWaitingPopUp: false,
            });
        case SAVE_RECIPIENTS:
            let currentUserLoginId = Number(StorageConfiguration.sessionGetItem('userId'));
            let activeParticipants = action.value.filter(res => res.userId === currentUserLoginId && res.status !== 'Calling');
            if (activeParticipants.length > 0) {
                return Object.assign({}, state, {
                    receipientsList: action.value,
                });
            }
            return state;
        case REMOVE_PARTICIPANTS:
            let removeData = action.value;
            let removeIndex = state.receipientsList.findIndex(obj => obj.userId === removeData.userId && obj.roomId === removeData.roomId);
            let currentRecipients = []
            if (removeIndex > -1) {
                currentRecipients = [...state.receipientsList.slice(0, removeIndex), ...state.receipientsList.slice(removeIndex + 1)];
            }
            return Object.assign({}, state, {
                receipientsList: currentRecipients,
            });
        case CLINIC_ID:
            return Object.assign({}, state, {
                clinicId: action.value,
            });
        case RECEIVE_STREAMING_URL:
            let userLoginId = Number(StorageConfiguration.sessionGetItem('userId'));
            let currentUserRoomId = action.data.roomId;
            let currentRoomParticipants = state.receipientsList.filter(x => x.roomId === currentUserRoomId);
            let isForCurrentParticipant = currentRoomParticipants.findIndex(x => Number(x.userId) === userLoginId);
            if (Number(action.data.initiatedById) === userLoginId || isForCurrentParticipant !== -1) {
                Notify.sendNotification('Live streaming enabled', AlertTypes.success);
                return Object.assign({}, state, {
                    streamingData: action.data,
                });
            }
            return state;
        case CHANGE_ROOM_ORGANIZER:
            let userId = Number(StorageConfiguration.sessionGetItem('userId'));
            let currentRoom = action.data.room.roomName;
            let participants = state.receipientsList.filter(x => x.roomId === currentRoom);
            let isForCurrentRoomParticipant = participants.findIndex(x => Number(x.userId) === userId);
            if (isForCurrentRoomParticipant !== -1) {
                Notify.sendNotification('Host changed', AlertTypes.success);
                return Object.assign({}, state, {
                    receipientsList: action.data.recepientsInfo,
                });
            }
            return state;
        case RECEIVE_USER_STATUS:
            console.log('RECEIVE_USER_STATUS', action);
            return Object.assign({}, state, {
                isRefreshPhyscians: true
            });
        case RECEIVE_MISSED_CALL_NOTIFICATION:
            let toId = Number(StorageConfiguration.sessionGetItem('userId'));
            if (toId === action.data.to_id) {
                return Object.assign({}, state, {
                    isNotifications: true
                });
            }
            return state;
        case UPDATE_REFRESH_PHYSICIANS:
            return Object.assign({}, state, {
                isRefreshPhyscians: action.value,
            });
        case UPDATE_NOTIFICATIONS:
            return Object.assign({}, state, {
                isNotifications: action.value,
            });
        case UPDATE_PROFILE_PICTURE:
            return Object.assign({}, state, {
                isProfilePictureUpdated: action.value,
            });
        case CLOSE_DIALOG:
            return Object.assign({}, state, {
                isOpenIncomingPopUp: false
            });
        default:
            return state;
    }
};

export default appReducer;