import React from 'react';
import '../../static/styles/CallWaitingPopup.css';
import avatar from '../../static/assets/avatar.png';
import { connect } from "react-redux";
import { Button } from '@material-ui/core';
import Environments from '../../services/Environments';
import { withRouter } from "react-router";
import StorageConfiguration from '../../services/StorageConfiguration';
import Loader from 'react-loader-spinner';

class CallWaitingPopup extends React.Component {

    componentDidMount() {

    }



    closePopUp() {
        this.props.closeWaitingPopup();
    }

    joinRoom() {
        let roomDetails = {
            identity: StorageConfiguration.sessionGetItem('userId'),
            room_name: this.props.roomDetails.room_name
        }
        const getAuthToken = Environments.twilioTokenAPI(roomDetails)
        getAuthToken.then(res => {
            console.log('res', res);
            let roomData = {
                roomName: roomDetails.room_name,
                token: res.data.data,
                identity: roomDetails.identity,
                type: 'caller'
            }
            this.props.closeWaitingPopup();
            this.props.history.push("/video-call", { roomData: roomData });
        }).catch(err => {
            console.log('err', err);
        });
    }

    render() {
        return (
            <div className='popup'>
                <div className='callwaitingpopupinner'>

                    <div className="modal-content">

                        <div className="modal-header">
                            <h4 className="modal-title">Connecting...</h4>
                            {/* <button onClick={this.props.closePopup} type="button" className="close" data-dismiss="modal">&times;</button> */}
                        </div>
                        {
                            this.props.data.recepientsInfo.map((data, i) => (

                                Number(this.props.data.callerInfo.callerId) !== data.userId ?
                                    <div key={i}>

                                        <div className='call-image-view'>
                                            <img className="call-image-style" src={data.profilePic ? data.profilePic : avatar} alt="Perinatal access logo" />
                                        </div>

                                        <div className='call-name-view'>
                                            <span style={{ fontSize: '12px', color: '#2c5566', fontWeight: 'bold' }}>Call with </span>
                                            <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{data.userName}</span>
                                            <Loader type="ThreeDots" color="#2c5566" height={50} width={50} timeout={80000} />

                                        </div>

                                    </div>
                                    :
                                    ''
                            ))
                        }
                    </div>

                    <div className="modal-footer">
                        {
                            this.props.callResponseType === 'attended' ?
                                <Button variant="outlined" style={{ background: '#2c5566', color: '#FFF', marginBottom: '5px' }} onClick={() => { this.joinRoom(this.props.callerInfo) }}>Join </Button>
                                : this.props.callResponseType === 'declined' ?
                                    <div>
                                        <span style={{ fontSize: '20px', fontWeight: 'bold', padding: '20px' }}>Declined the call</span>
                                        <Button variant="outlined" style={{ background: '#2c5566', color: '#FFF', marginBottom: '5px' }} onClick={this.props.closeWaitingPopup}>Cancel </Button>
                                    </div>
                                    :
                                    this.props.callResponseType === 'No Response' ?
                                        <div>
                                            <span style={{ fontSize: '20px', fontWeight: 'bold', padding: '20px' }}>No Response on the call</span>
                                            <Button variant="outlined" style={{ background: '#2c5566', color: '#FFF', marginBottom: '5px' }} onClick={this.props.closeWaitingPopup}>Cancel </Button>
                                        </div>
                                        :
                                        <span style={{ fontSize: '20px', }}>Waiting for response</span>
                        }
                    </div>

                </div>
            </div>

        );
    }
}

const mapDispachToProps = dispatch => {
    return {
        closeWaitingPopup: () => dispatch({ type: "CLOSE_WAITING_POPUP", value: false }),
    };
};

const mapStateToProps = state => {
    return {
        data: state.recepientsInfo,
        callerInfo: state.incomingCallInfo,
        callResponseType: state.callResponseType,
        roomDetails: state.roomDetails
    };
};

export default withRouter(connect(
    mapStateToProps,
    mapDispachToProps
)(CallWaitingPopup));