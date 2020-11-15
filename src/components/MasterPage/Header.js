import React, { Component } from 'react'
import { IconButton, Badge, FormControl } from '@material-ui/core'
import '../../static/styles/Header.css'
import profile from '../../static/assets/avatar.png'
import NotificationsNoneIcon from '@material-ui/icons/NotificationsNone';
import { Link } from 'react-router-dom';
import Notify, { AlertTypes } from '../../services/Notify';
import Environments from '../../services/Environments';
import StorageConfiguration from '../../services/StorageConfiguration';
import avatar from '../../static/assets/avatar.png';
import { connect } from "react-redux";
import closeicon from '../../static/assets/call-history-close.png';
import Pagination from '@material-ui/lab/Pagination';

class Header extends Component {

    constructor() {
        super();
        this.state = {
            profileImage: '',
            firstName: '',
            lastName: '',
            logoutPopup: false,
            notificationList: [],
            notificationCount: 0,
            showNotification: false,
            pageSize: 0,
            unReadNotifications: []
        };
    }

    componentDidMount() {
        this.getProfilePic();
        this.getNotifications();
    }

    componentDidUpdate() {
        if (this.props.isNotifications !== false) {
            this.getNotifications();
            this.props.updateNotifications();
        }
        if (this.props.isProfilePictureUpdated !== false) {
            this.getProfilePic();
            this.props.updateProfilePicture();
        }
    }

    getNotifications() {
        let userId = StorageConfiguration.sessionGetItem('userId');
        const getNotificationApi = Environments.getAPI('user-call-notification-list/' + userId + '?perpage=10');
        getNotificationApi.then(res => {
            this.updateState(res);
        }, err => {
            console.log('err', err);
        });
    }

    nextPage = (event, value) => {
        let userId = StorageConfiguration.sessionGetItem('userId');
        var page = String(value);
        var result = `user-call-notification-list/${userId}?page=${page}&perpage=10`;
        const getNotificationApi = Environments.getAPI(result);
        getNotificationApi.then(res => {
            this.updateState(res);
        });
    }

    updateState(res) {
        let notifcations = [];
        let unReadNotifications = [];
        const data = res.data.result;
        if (data.length > 0) {
            for (const element of data) {
                notifcations.push({
                    notifcationId: element.id,
                    fromId: element.from_user.from_id,
                    fromUserProfilePic: element.from_user.profile_pic,
                    toId: element.to_user.to_id,
                    message: element.message,
                    profilePic: '',
                    date: (new Date(element.created_at)).toDateString(),
                    time: this.formatAMPM(new Date(element.created_at)),
                    isRead: element.is_read
                });
                if (element.is_read === 0) {
                    unReadNotifications.push(String(element.id));
                }
            }
        }
        this.setState({
            notificationList: notifcations,
            notificationCount: Number(res.data.total_count),
            pageSize: Math.ceil(Number(res.data.total_count / 10)),
            unReadNotifications: unReadNotifications
        });
    }

    updateNotifications() {
        let notifcationModal = {
            id: this.state.unReadNotifications
        }
        const postMyAccount = Environments.postAPI('change-read-status', notifcationModal)
        postMyAccount.then(res => {
        }).catch(err => {
            console.log('err', err);
        });
    }

    openLogoutModel = () => {
        this.setState({ logoutPopup: true });
    }

    handleSubmit = () => {
        Notify.sendNotification('Logout successfully.', AlertTypes.success);
        StorageConfiguration.sessionSetItem('isloggedIn', false);
        const getTokenExpire = Environments.getAPI('list-clinics');
        getTokenExpire.then(res => {
            localStorage.clear();
        }, err => {
            console.log('err', err);
            localStorage.clear();
        });
        // User Status
        const currentUserId = Number(StorageConfiguration.sessionGetItem('userId'));
        let userdata = {
            id: currentUserId,
            status: 'offline'
        }
        this.props.sendUserStatus(userdata);
    };

    handleClose = () => {
        this.setState({ logoutPopup: false });
    }

    getProfilePic() {
        const getMyAccount = Environments.getAPI('physician/edit-profile')
        getMyAccount.then(res => {
            let accountDetails = res.data.data.personal_details;
            this.setState({ profileImage: accountDetails.profile_pic, firstName: accountDetails.first_name, lastName: accountDetails.last_name });
        }).catch(err => {
            console.log('err', err);
        });
    }

    openNotificationModal = () => {
        if (this.state.notificationList !== null) {
            this.setState({ showNotification: true });
            this.updateNotifications();
        }
    }

    closeNotificationModal = () => {
        this.setState({ showNotification: false });
        this.getNotifications();
    }

    formatAMPM(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    }

    render() {
        // let profilePic = this.state.profileImage !== null ? this.state.profileImage : '';
        let profilePic = StorageConfiguration.sessionGetItem('profilePic');
        let firstName = this.state.firstName;
        let lastName = this.state.lastName;
        return (
            <div>
                <nav style={{ paddingRight: '0px' }} className="navbar navbar-expand-lg navbar-light bg-light toolbar-header-view">
                    <div className="collapse navbar-collapse" id="navbarTogglerDemo02">
                        <FormControl className="col-sm toolbar-form-field">
                            <div className="input-group toolbar-width">
                                {/* <input type="text" className="form-control toolbar-search-input" placeholder="Type your text here" />
                                <div className="input-group-append">
                                    <button className="btn btn-secondary toolbar-search-button" type="button">
                                        <i className="fa fa-search toolbar-search-icon"></i>
                                    </button>
                                </div> */}
                            </div>
                        </FormControl>
                        <span onClick={this.openNotificationModal} className="navbar-brand">
                            <IconButton color="inherit">
                                <Badge badgeContent={this.state.notificationCount} color="secondary">
                                    <NotificationsNoneIcon className="notification-icon" />
                                </Badge>
                            </IconButton>
                        </span>
                        <div className="dropdown">
                            <button onClick={this.openLogoutModel} className="btn btn-secondary toolbar-button" type="button" id="dropdownMenu2" aria-haspopup="true" aria-expanded="false">
                                {
                                    profilePic !== '' ?
                                        <img src={profilePic} className="toolbar-image" alt="Perinatal Access Logo"></img>
                                        :
                                        <img src={profile} className="toolbar-image" alt="Perinatal Access Logo"></img>
                                }
                                <span title={firstName + ' ' + lastName} className="toolbar-username">{StorageConfiguration.sessionGetItem('firstName')}</span>
                                <span title="Logout" className="fa fa-sign-out ml-3 logout-button"></span>
                            </button>
                        </div>

                    </div>
                </nav>


                {
                    this.state.logoutPopup ?
                        <div className='logout-popup'>
                            <div className='logoutPopupInner'>
                                <div style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }} className="modal-content">
                                    <div className="modal-header call-history-modal-header">
                                        <h4 className="modal-title">Logout</h4>
                                        <img onClick={this.handleClose} className="close-icon" src={closeicon} alt="Perinatal access logo" />
                                    </div>

                                    <div style={{ padding: '25px' }} className="modal-body">
                                        <span style={{ textAlign: 'center', display: 'block' }}>Are you sure you want to logout?</span>
                                    </div>

                                    <div className="modal-footer">
                                        <button style={{ background: '#92B7BC' }} type="button" className="btn btn-secondary" data-dismiss="modal" onClick={this.handleClose}>No</button>
                                        <Link to="/login" onClick={this.handleSubmit}>
                                            <button style={{ background: '#2c5566', marginLeft: '15px' }} type="button" className="btn btn-primary">Yes</button>
                                        </Link>
                                    </div>

                                </div>
                            </div>
                        </div>
                        :
                        ''
                }

                <div>
                    {
                        this.state.showNotification ?
                            <div className='logout-popup'>
                                <div className='notification-popup'>
                                    <div style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }} className="modal-content">
                                        <div className="modal-header call-history-modal-header">
                                            <span style={{ textAlign: 'left' }}>NOTIFICATIONS</span>
                                            <img onClick={this.closeNotificationModal} className="close-icon" src={closeicon} alt="Perinatal access logo" />
                                        </div>

                                        <div className="modal-body" style={{ paddingBottom: '20px' }}>
                                            {this.state.notificationList.length > 0 ?
                                                <div style={{ overflowY: 'scroll', height: '420px' }}>
                                                    <table>
                                                        <tbody style={{ color: '#2C5566' }}>
                                                            {
                                                                this.state.notificationList.map((data, i) => (
                                                                    <tr style={{ textTransform: 'capitalize', borderBottom: '1px solid lightgrey' }} key={i}>
                                                                        <td> {i + 1}. </td>
                                                                        <td> <img className="add-call-image-style" src={data.fromUserProfilePic ? data.fromUserProfilePic : avatar} alt="Perinatal access logo" /> </td>
                                                                        <td> {data.message}</td>
                                                                        <td> {data.date} <span style={{ textTransform: 'uppercase' }}>{data.time}</span></td>
                                                                        <td><span className="fa fa-check" aria-hidden="true"></span> </td>
                                                                    </tr>
                                                                ))
                                                            }
                                                        </tbody>
                                                    </table>

                                                    <div className='call-history-pagination mt-3'>
                                                        <Pagination count={this.state.pageSize} variant="outlined" onChange={this.nextPage} />
                                                    </div>

                                                </div>
                                                :
                                                <div className="no-data">
                                                    No Records Found
                                                </div>
                                            }
                                        </div>

                                    </div>
                                </div>
                            </div>
                            :
                            ''
                    }
                </div>

            </div>
        )
    }
}

const mapStateToProps = state => {
    return {
        isNotifications: state.isNotifications,
        isProfilePictureUpdated: state.isProfilePictureUpdated
    };
};

const mapDispachToProps = dispatch => {
    return {
        updateNotifications: () => dispatch({ type: "UPDATE_NOTIFICATIONS", value: false }),
        updateProfilePicture: () => dispatch({ type: "UPDATE_PROFILE_PICTURE", value: false }),
        sendUserStatus: (data) => dispatch({ type: "USER_STATUS", value: data })
    };
};
export default connect(
    mapStateToProps,
    mapDispachToProps
)(Header)