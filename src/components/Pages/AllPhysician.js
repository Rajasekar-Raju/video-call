import React from 'react';
import '../../static/styles/AllPhysician.css';
import avatar from '../../static/assets/avatar.png';
import { Card, IconButton } from '@material-ui/core';
import Header from '../MasterPage/Header';
import Sidebar from '../MasterPage/Sidebar';
import VideocamIcon from '@material-ui/icons/Videocam';
import Pagination from '@material-ui/lab/Pagination';
import StorageConfiguration from '../../services/StorageConfiguration';
import Environments from '../../services/Environments';
import Footer from '../MasterPage/Footer';
import { connect } from "react-redux";
import Notify, { AlertTypes } from '../../services/Notify';
import Progressbar from '../../services/Progressbar';

class AllPhysician extends React.Component {

    constructor() {
        super();
        this.state = {
            physiciansList: [],
            pageSize: 0,
            timeout: null,
            clinicName: '',
            searchValue: '',
            show: true,
            currentPage: 0,
            totalRecords: 0
        };
    }

    componentDidMount() {
        this.getSonographerPhysicians();
    }

    componentDidUpdate() {
        if (this.props.isRefreshPhyscians === true) {
            this.getSonographerPhysicians();
            this.props.updateRefreshPhysicians();
        }
    }

    getSonographerPhysicians() {
        let role = Number(StorageConfiguration.sessionGetItem('role'));
        if (role === 2) {
            this.getPhysicianList();
        }
        if (role !== 2 && this.props.location.state != null) {
            let clinicId = this.props.location.state.clinicId;
            let clinicName = this.props.location.state.clinicName;
            this.setState({ clinicName: clinicName });
            this.props.saveClinicId(this.props.location.state.clinicId);
            this.getSonographerList(clinicId);
        }
    }

    getPhysicianList() {
        let perpage = String(12);
        let result = `list-physician?perpage=${perpage}`;
        const getPhysicianList = Environments.getAPI(result)
        getPhysicianList.then(res => {
            const physician = res.data.data.physicians.data;
            this.props.saveClinicId(res.data.data.clinic.id);
            var len = physician.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = physician[i].meta_data[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                physician[i].meta_data[0].contact_no = phone;
            }
            this.setState({
                physiciansList: physician,
                pageSize: Math.ceil(Number(res.data.data.physicians.total / 12)),
                currentPage: res.data.data.physicians.current_page,
                totalRecords: res.data.data.physicians.total
            });
            this.setState({ show: false });
        }).catch(err => {
            this.setState({ show: false });
        });
    }

    getSonographerList(clinicId) {
        const getTechnicianList = Environments.getAPI('list-technician/' + clinicId + '?perpage=12')
        getTechnicianList.then(res => {
            const physician = res.data.data.technician.data;
            var len = physician.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = physician[i].meta_data[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                physician[i].meta_data[0].contact_no = phone;
            }
            this.setState({
                physiciansList: physician,
                pageSize: Math.ceil(Number(res.data.data.technician.total / 12)),
                currentPage: res.data.data.technician.current_page,
                totalRecords: res.data.data.technician.total
            });
            this.setState({ show: false });
        }).catch(err => {
            this.setState({ show: false });
        });
    }

    nextPage = (event, value) => {
        let role = Number(StorageConfiguration.sessionGetItem('role'));
        if (role === 2) {
            let page = String(value);
            let result = `list-physician?page=${page}&perpage=12`;
            const getPhysicianList = Environments.getAPI(result);
            getPhysicianList.then(res => {
                const physician = res.data.data.physicians.data;
                var len = physician.length,
                    i = 0;
                for (i = 0; i < len; i++) {
                    var mobile = physician[i].meta_data[0].contact_no;
                    var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                    physician[i].meta_data[0].contact_no = phone;
                }
                this.setState({
                    physiciansList: physician,
                    pageSize: Math.ceil(Number(res.data.data.physicians.total / 12)),
                    currentPage: res.data.data.physicians.current_page,
                    totalRecords: res.data.data.physicians.total
                });
            });
        }
        if (role !== 2 && this.props.location.state != null) {
            let page = String(value);
            let clinicId = this.props.location.state.clinicId;
            let result = `list-technician/${clinicId}?page=${page}&perpage=12`;
            const getTechnicianList = Environments.getAPI(result);
            getTechnicianList.then(res => {
                const physician = res.data.data.technician.data;
                var len = physician.length,
                    i = 0;
                for (i = 0; i < len; i++) {
                    var mobile = physician[i].meta_data[0].contact_no;
                    var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                    physician[i].meta_data[0].contact_no = phone;
                }
                this.setState({
                    physiciansList: physician,
                    pageSize: Math.ceil(Number(res.data.data.technician.total / 12)),
                    currentPage: res.data.data.technician.current_page,
                    totalRecords: res.data.data.technician.total
                });
            });
        }
    }

    searchSonographerList = () => {
        let clinicId = this.props.location.state.clinicId;
        const getTechnicianList = Environments.getAPI('list-technician/' + clinicId + '?search=' + this.state.searchValue + '&perpage=12')
        getTechnicianList.then(res => {
            const physician = res.data.data.technician.data;
            var len = physician.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = physician[i].meta_data[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                physician[i].meta_data[0].contact_no = phone;
            }
            this.setState({
                physiciansList: physician,
                pageSize: Math.ceil(Number(res.data.data.technician.total / 12)),
                currentPage: res.data.data.technician.current_page,
                totalRecords: res.data.data.technician.total
            });
        });
    }

    searchPhysiciansList = () => {
        const getPhysicianList = Environments.getAPI('list-physician?search=' + this.state.searchValue + '&perpage=12')
        getPhysicianList.then(res => {
            const physician = res.data.data.physicians.data;
            var len = physician.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = physician[i].meta_data[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                physician[i].meta_data[0].contact_no = phone;
            }
            this.setState({
                physiciansList: physician,
                pageSize: Math.ceil(Number(res.data.data.physicians.total / 12)),
                currentPage: res.data.data.physicians.current_page,
                totalRecords: res.data.data.physicians.total
            });
        });
    }

    onValueChange(value) {
        this.setState({
            searchValue: value
        });
    }

    handleSubmitEvent = async (event) => {

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
                let data = {};
                let callerId = StorageConfiguration.sessionGetItem('userId');
                let callerName = StorageConfiguration.sessionGetItem('userName');
                let profilePic = StorageConfiguration.sessionGetItem('profilePic');
                var roomId = String(Math.floor(Math.random() * 10000000000));

                data.room = {
                    roomName: roomId,
                }
                data.callerInfo = {
                    callerId: callerId,
                    callerName: callerName,
                    profilePic: profilePic,
                    isRoomStarted: false
                }

                let recepientsList = [
                    {
                        userId: event.id,
                        identity: event.id,
                        userName: event.first_name + ' ' + event.last_name,
                        profilePic: event.profile_pic ? event.profile_pic : avatar,
                        status: 'Calling',
                        roomId: roomId,
                        role: 'Participant',
                        isVideo: true
                    },
                    {
                        userId: Number(callerId),
                        identity: Number(callerId),
                        userName: callerName,
                        profilePic: profilePic ? profilePic : avatar,
                        status: 'attended',
                        roomId: roomId,
                        role: 'Host',
                        isVideo: true
                    },
                ];
                data.recepientsInfo = [...recepientsList];
                this.props.sendMessage(data);

                // Waiting
                this.props.openWaitingPopup(data);

                this.timer();
            }
            else {
                Notify.sendNotification('Audio device not found', AlertTypes.success);
            }
        }
        else {
            Notify.sendNotification('Video device not found', AlertTypes.success);
        }
    };

    timer() {
        this.setState({
            timeout: setTimeout(res => {
                if (this.props.callResponseType === '') {
                    Notify.sendNotification('User not available', AlertTypes.warn);
                    this.props.closeWaitingPopup();
                }
            }, 65000)
        });
    }

    render() {
        let listCount = this.state.physiciansList.length;
        let role = Number(StorageConfiguration.sessionGetItem('role'));
        let show = this.state.show;
        let pageSize = this.state.pageSize;
        let currentPage = this.state.currentPage;
        let totalRecords = this.state.totalRecords;

        return (
            <div>
                <Sidebar />

                <div className="layout-style">
                    <Header />

                    {!show ?
                        <div className="header-style">
                            {role === 2 ?
                                <div>
                                    <span className="page-title">ALL PHYSCIANS</span>

                                    <input className="form-control form-control-sm search-design search-physician-filter" style={{ width: '32%' }} type="text" placeholder="Search Physician"
                                        value={this.state.searchValue}
                                        onChange={e => this.onValueChange(e.target.value)}
                                        onKeyUp={this.searchPhysiciansList}
                                        aria-label="Search" />

                                </div>
                                :
                                <div className="mb-2">
                                    <span style={{ textTransform: 'uppercase' }} className="page-title">MY CLINIC / {this.state.clinicName} / SONOGRAPHER</span>

                                    <span title="Back" onClick={() => this.props.history.push('/my-clinic')} className="fas fa-arrow-left sonographer-back"></span>

                                    <input className="form-control form-control-sm search-design search-physician-filter search-filter" style={{ width: '30%', marginRight: '12px' }} type="text" placeholder="Search Sonographer"
                                        value={this.state.searchValue}
                                        onChange={e => this.onValueChange(e.target.value)}
                                        onKeyUp={this.searchSonographerList}
                                        aria-label="Search" />

                                </div>
                            }

                            {listCount > 0 ?
                                <div>
                                    <div className="row">
                                        {
                                            this.state.physiciansList.map((data, i) => (

                                                <div className="col-md-12 col-sm-12 col-12 col-lg-6 col-xl-4 card-outer-content" key={i}>
                                                    <Card className="card-style">

                                                        <div className="card-inner-content">
                                                            <div className="row card-content-style">
                                                                <div className="col-sm-2">
                                                                    <img className="image-style" src={data.profile_pic ? data.profile_pic : avatar} alt="Perinatal access logo" />
                                                                </div>
                                                                <div className="col-sm text-content">
                                                                    <span title={data.first_name + ' ' + data.last_name} className="physician-name">{data.first_name} {data.last_name}</span><br />
                                                                    <span>
                                                                        <i className="fas fa-phone-alt phone-icon"></i>
                                                                        <span className="contact-number">{data.meta_data[0].contact_no}</span>
                                                                    </span>
                                                                    <br />
                                                                    {data.status === null ?
                                                                        <span>
                                                                            <i className="fa fa-circle offline"></i>
                                                                            <span className="contact-number">Offline</span>
                                                                        </span>
                                                                        :
                                                                        data.status === 'online' ?
                                                                            <span>
                                                                                <i className="fa fa-circle online"></i>
                                                                                <span className="contact-number">Online</span>
                                                                            </span>
                                                                            :
                                                                            data.status === 'offline' ?
                                                                                <span>
                                                                                    <i className="fa fa-circle offline"></i>
                                                                                    <span className="contact-number">Offline</span>
                                                                                </span>
                                                                                :
                                                                                data.status === 'busy' ?
                                                                                    <span>
                                                                                        <i className="fa fa-circle busy"></i>
                                                                                        <span className="contact-number">Busy</span>
                                                                                    </span>
                                                                                    :
                                                                                    data.status === 'away' ?
                                                                                        <span>
                                                                                            <i className="fa fa-circle away"></i>
                                                                                            <span className="contact-number">Away</span>
                                                                                        </span>
                                                                                        :
                                                                                        ''
                                                                    }

                                                                    <br />
                                                                    <span>
                                                                        {data.role_id === 2 ?
                                                                            <span className="sonographer">Sonographer</span>
                                                                            :
                                                                            data.role_id === 3 ?
                                                                                <span className="internal-physician">Internal Physician</span>
                                                                                :
                                                                                data.role_id === 4 ?
                                                                                    <span className="external-physician">External Physician</span>
                                                                                    :
                                                                                    data.role_id === 5 ?
                                                                                        <span className="staff">Staff</span>
                                                                                        :
                                                                                        data.role_id === 7 ?
                                                                                            <span className="external-sonographer">External Sonographer</span>
                                                                                            :
                                                                                            ''
                                                                        }
                                                                    </span>
                                                                </div>
                                                                <div className="col-sm-3 button-style">
                                                                    <IconButton style={{ padding: '9px' }} onClick={() => { this.handleSubmitEvent(data) }} className="video-icon">
                                                                        <VideocamIcon className="icon-color" />
                                                                    </IconButton>
                                                                </div>
                                                            </div>
                                                        </div>

                                                    </Card>
                                                </div>
                                            ))}
                                    </div>

                                    <div>
                                        <span style={{ paddingTop: '20px', display: 'inline-block', color: '#808080' }}>
                                            {currentPage} - {pageSize} of {totalRecords} items
                                        </span>
                                        <div className="pagination-style mb-5">
                                            <Pagination count={this.state.pageSize} variant="outlined" showFirstButton showLastButton onChange={this.nextPage} />
                                        </div>
                                    </div>

                                </div>
                                :
                                <div className="no-data">
                                    No Records Found
                            </div>
                            }

                        </div>
                        :
                        <div className="no-data">
                            <Progressbar show={this.state.show} />
                        </div>
                    }
                </div>
                <Footer />
            </div>

        )
    }
}

const mapStateToProps = state => {
    return {
        callResponseType: state.callResponseType ? state.callResponseType : '',
        isRefreshPhyscians: state.isRefreshPhyscians,
    };
};

const mapDispachToProps = dispatch => {
    return {
        sendMessage: (data) => dispatch({ type: "SIGNALR_OUTGOING_CALLS", value: data }),
        openWaitingPopup: (recepientsInfo) => dispatch({ type: "OPEN_WAITING_POPUP", value: recepientsInfo }),
        saveClinicId: (clinicId) => dispatch({ type: "CLINIC_ID", value: clinicId }),
        closeWaitingPopup: () => dispatch({ type: "CLOSE_WAITING_POPUP", value: false }),
        updateRefreshPhysicians: () => dispatch({ type: "UPDATE_REFRESH_PHYSICIANS", value: false }),
    };
};
export default connect(
    mapStateToProps,
    mapDispachToProps
)(AllPhysician)