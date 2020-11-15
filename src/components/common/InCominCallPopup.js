import React from 'react';
import '../../static/styles/InCominCallPopup.css';
import CallEndIcon from '@material-ui/icons/CallEnd';
import CallIcon from '@material-ui/icons/Call';
import avatar from '../../static/assets/avatar.png';
import { connect } from "react-redux";
import { withRouter } from "react-router";
import Environments from '../../services/Environments';
import StorageConfiguration from '../../services/StorageConfiguration';
import { IconButton } from '@material-ui/core';
import Loader from 'react-loader-spinner';
import soundfile from '../../static/assets/organfinale.mp3';
import Notify, { AlertTypes } from '../../services/Notify';

class InCominCallPopup extends React.Component {

    constructor(props) {
        super();
        this.state = {
            timeout: null,
            isPlay: false
        };
    }

    async componentDidMount() {
        this.setState({ isPlay: true });
        this.timer();
    }

    componentDidUpdate() {
        if (this.state.isPlay === true) {
            this.playAudio();
        }
    }

    playAudio() {
        let audioElement = document.getElementById('call-audio');
        audioElement.muted = false;
        var playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise
                .then(_ => {
                    // Automatic playback started!
                    // Show playing UI.
                    console.log("audio played auto");
                })
                .catch(error => {
                    // Auto-play was prevented
                    // Show paused UI.
                    console.log("playback prevented");
                });
        }
    }

    timer() {
        this.setState({
            timeout: setTimeout(res => {
                console.log('this.state.isReponsed', this.state.isReponsed);
                this.closePopUp();
            }, 60000)
        });
    }

    closePopUp() {
        let roomDetails = {
            identity: StorageConfiguration.sessionGetItem('userId'),
            room_name: this.props.roomDetails.roomName,
        }
        let responseData = {
            type: 'No Response',
            userId: Number(StorageConfiguration.sessionGetItem('userId')),
            userName: StorageConfiguration.sessionGetItem('userName'),
            profilePic: StorageConfiguration.sessionGetItem('profilePic'),
        }
        this.props.incomingCallResponse(this.props.data, responseData, roomDetails);
        this.props.closeIncomingPopup(this.props.data, responseData, roomDetails);

        let notification = {
            from_id: Number(this.props.data.callerId),
            to_id: Number(StorageConfiguration.sessionGetItem('userId')),
            message: this.props.data.callerName + ' tried you calling',
        }
        this.props.sendMissedCallNotification(notification);
    }

    callEvent = async (event, type) => {

        let audioDevices = [];
        let videoDevices = [];
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        let devices = await navigator.mediaDevices.enumerateDevices();
        for (const device of devices) {
            if (device.kind === 'audioinput') {
                audioDevices.push({
                    label: device.label,
                    value: device.deviceId
                });
            }
            if (device.kind === 'videoinput') {
                videoDevices.push({
                    label: device.label,
                    value: device.deviceId
                });
            }
        }
        if (videoDevices.length > 0) {
            if (audioDevices.length > 0) {
                const { timeout } = this.state;
                clearTimeout(timeout);
                let roomDetails = {
                    identity: StorageConfiguration.sessionGetItem('userId'),
                    room_name: this.props.roomDetails.roomName,
                }
                let responseData = {
                    type: type,
                    userId: Number(StorageConfiguration.sessionGetItem('userId')),
                    userName: StorageConfiguration.sessionGetItem('userName'),
                    profilePic: StorageConfiguration.sessionGetItem('profilePic'),
                }
                console.log('this.state.isReponsed', this.state.isReponsed);
                this.props.closeIncomingPopup(event, responseData, roomDetails);
                this.props.incomingCallResponse(event, responseData, roomDetails);
                if (type === 'attended') {
                    const getAuthToken = Environments.twilioTokenAPI(roomDetails)
                    getAuthToken.then(res => {
                        console.log('res', res);
                        let roomData = {
                            roomName: roomDetails.room_name,
                            token: res.data.data,
                            identity: roomDetails.identity,
                            type: 'receiver'
                        }
                        this.props.history.push("/video-call", { roomData: roomData });
                    }).catch(err => {
                        console.log('err', err);
                    });
                }
                if (type === 'declined') {
                    this.props.incomingCallResponse(event, responseData, roomDetails);
                }
            }
            else {
                Notify.sendNotification('Audio device not found', AlertTypes.success);
            }
        }
        else {
            Notify.sendNotification('Video device not found', AlertTypes.success);
        }

    }

    render() {
        return (
            <div className='incoming-popup'>
                <div className='popupinner'>

                    <div className="modal-content">

                        <audio id="call-audio" loop>
                            <source src={soundfile} type="audio/ogg" />
                            <source src={soundfile} type="audio/mpeg" />
                        </audio>

                        <div className="modal-body">
                            <span style={{ display: 'flex', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>{this.props.data.callerName}</span>
                            <span style={{ display: 'flex', justifyContent: 'center', fontWeight: '500' }}>is calling you</span>
                            <span style={{ display: 'flex', justifyContent: 'center' }}><img className="call-image-style" src={this.props.data.profilePic ? this.props.data.profilePic : avatar} alt="Perinatal access logo" /></span>
                        </div>
                        <Loader style={{ display: 'flex', justifyContent: 'center' }} type="ThreeDots" color="#2c5566" height={30} width={30} timeout={80000} />

                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', paddingBottom: '10px' }}>
                            <IconButton onClick={() => { this.callEvent(this.props.data, 'attended') }} style={{ display: 'flex', justifyContent: 'center', background: 'green', width: '55px', height: '55px', margin: '10px' }}>
                                <CallIcon style={{ color: '#FFF' }} />
                            </IconButton>

                            <IconButton onClick={() => { this.callEvent(this.props.data, 'declined') }} style={{ display: 'flex', justifyContent: 'center', background: 'red', width: '55px', height: '55px', margin: '10px' }}>
                                <CallEndIcon style={{ color: '#FFF' }} />
                            </IconButton>
                        </div>

                    </div>

                </div>
            </div>

        );
    }
}


const mapDispachToProps = dispatch => {
    return {
        closeIncomingPopup: (data, responseData, roomDetails) => dispatch({ type: "CLOSE_INCOMING_POPUP", value: { data: data, responseData: responseData, roomDetails: roomDetails } }),
        incomingCallResponse: (data, responseData, roomDetails) => dispatch({ type: "SIGNALR_INCOMING_CALL_RESPONSE", value: { data: data, responseData: responseData, roomDetails: roomDetails } }),
        sendMissedCallNotification: (data) => dispatch({ type: "MISSED_CALL_NOTIFICATION", value: data })
    };
};

const mapStateToProps = state => {
    return {
        data: state.incomingCallInfo,
        roomDetails: state.roomDetails
    };
};

export default withRouter(connect(
    mapStateToProps,
    mapDispachToProps
)(InCominCallPopup));