import React from 'react';
import { Route, BrowserRouter as Router, Switch } from 'react-router-dom'
import Loginpage from '../components/Auth/Loginpage';
import ForgotPassword from '../components/Auth/ForgotPassword';
import CreateAccount from '../components/Auth/CreateAccount';
import ChangePassword from "../components/Pages/ChangePassword";
import MyClinic from "../components/Pages/MyClinic";
import AllPhysician from "../components/Pages/AllPhysician";
import MyAccount from "../components/Pages/MyAccount";
import VideoComponent from "../components/Pages/VideoComponent";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import Notify, { AlertTypes } from '../services/Notify';
import ExternalClinic from '../components/Pages/ExternalClinic';
import RequestList from '../components/Pages/RequestList';
import CallHistory from '../components/Pages/CallHistory';
import GuardedRoute from '../routes/GuardedRoute'
import ResetPassword from '../components/Auth/ResetPassword';
import InCominCallPopup from '../components/common/InCominCallPopup';
import CallWaitingPopup from '../components/common/CallWaitingPopup';
import { connect } from "react-redux";
import IdleTimer from 'react-idle-timer';
import StorageConfiguration from '../services/StorageConfiguration';
import Wowza from '../components/Pages/Wowza';

class Routes extends React.Component {

    constructor(props) {
        super(props);
        this.idleTimer = null
        this.handleOnAction = this.handleOnAction.bind(this)
        this.handleOnActive = this.handleOnActive.bind(this)
        this.handleOnIdle = this.handleOnIdle.bind(this)
    }

    componentDidMount() {
        Notify.notifications.subscribe((alert) => alert instanceof Function && alert());

        // Browser offline event
        window.addEventListener("offline", (ev) => {
            var res = window.location.href.split("/");
            if (res[3] !== 'video-call') {
                Notify.sendNotification('Your internet connection lost', AlertTypes.success);
            }
        });
    }

    handleOnAction(event) {
        // console.log('user did something', event);
    }

    handleOnActive(event) {
        // console.log('user is active', event);
        // console.log('time remaining', this.idleTimer.getRemainingTime());

        // User Status
        let isloggedIn = StorageConfiguration.sessionGetItem('isloggedIn');
        if (isloggedIn === 'true') {
            let id = Number(StorageConfiguration.sessionGetItem('userId'));
            let userdata = {
                id: id,
                status: 'online'
            }
            this.props.sendUserStatus(userdata);
        }
    }

    handleOnIdle(event) {
        // console.log('user is idle', event);
        // console.log('last active', this.idleTimer.getLastActiveTime());
        // console.log('isIdle', this.idleTimer.isIdle());

        // User Status
        let isloggedIn = StorageConfiguration.sessionGetItem('isloggedIn');
        if (isloggedIn === 'true') {
            let id = Number(StorageConfiguration.sessionGetItem('userId'));
            let userdata = {
                id: id,
                status: 'away'
            }
            this.props.sendUserStatus(userdata);
        }
    }

    render() {
        return (
            <div>
                <Router basename="/perinatalaccess/frontend">
                    <Switch>
                        <Route path="/" name="Login" exact component={Loginpage} />
                        <Route path="/login" name="Login" exact component={Loginpage} />
                        <Route path="/forgot-password" name="Forgot Password" exact component={ForgotPassword} />
                        <Route path="/create-account" name="Create Account" exact component={CreateAccount} />
                        <Route path="/change-password" name="Change Password" exact component={ChangePassword} />
                        <Route path="/reset-password" name="Reset Password" exact component={ResetPassword} />
                        <GuardedRoute path="/my-clinic" name="My Clinic" exact component={MyClinic} />
                        <GuardedRoute path="/my-account" name="My Account" exact component={MyAccount} />
                        <GuardedRoute path="/all-physicians" name="All Physicians" exact component={AllPhysician} />
                        <GuardedRoute path="/external-clinic" name="External Clinic" exact component={ExternalClinic} />
                        <GuardedRoute path="/request-list" name="Request List" exact component={RequestList} />
                        <GuardedRoute path="/call-history" name="Call History" exact component={CallHistory} />
                        <GuardedRoute path="/video-call" name="Video Call" exact component={VideoComponent} />
                        <GuardedRoute path="/wowza" name="Wowza" exact component={Wowza} />
                    </Switch>

                    <div>
                        <div>
                            {
                                this.props.showWaitingPopup ?
                                    <CallWaitingPopup
                                        text='Click "Hide popup'
                                    />
                                    : null
                            }
                        </div>

                        <div>
                            {
                                this.props.showCallingPopup ?
                                    <InCominCallPopup
                                        text='Click "Hide popup'
                                    />
                                    : null
                            }
                        </div>

                        <IdleTimer
                            ref={ref => { this.idleTimer = ref }}
                            timeout={300000}
                            onActive={this.handleOnActive}
                            onIdle={this.handleOnIdle}
                            onAction={this.handleOnAction}
                            debounce={250}
                        />
                    </div>

                </Router>

                <div>
                    <ToastContainer autoClose={3000} />
                </div>

            </div>
        )
    }
}

const mapDispachToProps = dispatch => {
    return {
        sendUserStatus: (data) => dispatch({ type: "USER_STATUS", value: data })
    };
};

const mapStateToProps = state => {
    return {
        showCallingPopup: state.isOpenIncomingPopUp,
        showWaitingPopup: state.isOpenWaitingPopUp
    };
};

export default connect(
    mapStateToProps,
    mapDispachToProps
)(Routes);