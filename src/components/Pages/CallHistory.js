import React, { Component } from 'react'
import { Card, Avatar } from '@material-ui/core';
import avatar from '../../static/assets/avatar.png';
import Header from '../MasterPage/Header';
import Sidebar from '../MasterPage/Sidebar';
import Pagination from '@material-ui/lab/Pagination';
import Environments from '../../services/Environments';
import Footer from '../MasterPage/Footer';
import Progressbar from '../../services/Progressbar';
import '../../static/styles/CallHistory.css';
import StorageConfiguration from '../../services/StorageConfiguration';
import closeicon from '../../static/assets/call-history-close.png';

export default class CallHistory extends Component {

    constructor() {
        super();
        this.state = {
            callHistoryList: [],
            participantsList: [],
            show: true,
            showParticipantsPopup: false,
            pageSize: 0,
            currentPage: 1,
            totalRecords: 0
        };
    }

    componentDidMount() {
        this.getCallHistoryList();
    }

    getCallHistoryList() {
        let userId = StorageConfiguration.sessionGetItem('userId');
        const getCallHistoryApi = Environments.getAPI('user-call-history/' + userId + '?perpage=10');
        getCallHistoryApi.then(res => {
            this.updateState(res);
        }, err => {
            console.log('err', err);
            this.setState({ show: false });
        });
    }

    updateState(res) {
        const data = res.data.result;
        let callHistory = [];
        if (data.length > 0) {
            for (const element of data) {
                if (element.participant_details !== undefined) {
                    const participantDetails = element.participant_details;
                    var len = element.participant_details.length,
                        i = 0;
                    for (i = 0; i < len; i++) {
                        let totalSeconds = Number(participantDetails[i].total_duration);
                        participantDetails[i].total_duration = this.secondsToHms(totalSeconds);
                    }
                    callHistory.push({
                        roomId: element.room_id,
                        startTime: new Date(element.created_at.date).toDateString() + ' ' + this.formatAMPM(new Date(element.created_at.date)),
                        endTime: new Date(element.end_at).toDateString() + ' ' + this.formatAMPM(new Date(element.end_at)),
                        totalHours: this.secondsToHms(element.duration),
                        totalParticipants: element.participant_count,
                        participants: participantDetails
                    });
                }
            }
            this.setState({
                callHistoryList: callHistory,
                pageSize: Math.ceil(Number(res.data.total_count / 10)),
                totalRecords: res.data.total_count
            });
        }
        this.setState({ show: false });
    }

    nextPage = (event, value) => {
        this.setState({ currentPage: value });
        let userId = StorageConfiguration.sessionGetItem('userId');
        var page = String(value);
        var result = `user-call-history/${userId}?page=${page}&perpage=10`;
        const getCallHistoryApi = Environments.getAPI(result);
        getCallHistoryApi.then(res => {
            this.updateState(res);
        });
    }

    showMeetinDetails = (value) => {
        let selectedMeeting = this.state.callHistoryList.filter(x => x.roomId === value.roomId);
        let participants = [];
        // console.log('participants', selectedMeeting[0].participants);
        for (const element of selectedMeeting[0].participants) {
            let joinAt = (element.call_activity)[0];
            let leftAt = (element.call_activity).slice(-1)[0];
            participants.push({
                name: element.name,
                user_pic: element.user_pic,
                startDate: new Date(joinAt.join_at).toDateString() + ' ',
                endDate: new Date(leftAt.left_at).toDateString() + ' ',
                startTime: this.formatAMPM(new Date(joinAt.join_at)),
                endTime: this.formatAMPM(new Date(leftAt.left_at)),
                totalHours: element.total_duration
            });
        }

        this.setState({ participantsList: participants });
        this.setState({ showParticipantsPopup: true });
    }

    handleClose = () => {
        this.setState({ showParticipantsPopup: false });
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

    secondsToHms(d) {
        d = Number(d);
        let h = Math.floor(d / 3600);
        let m = Math.floor((d % 3600) / 60);
        // let s = Math.floor((d % 3600) % 60);

        let hDisplay = (h <= 9 ? '0' : '') + h;
        let mDisplay = (m <= 9 ? '0' : '') + m;
        // let sDisplay = (s <= 9 ? '0' : '') + s;
        return hDisplay + ':'
            + mDisplay;
    }

    render() {
        let show = this.state.show;
        let listCount = this.state.callHistoryList.length;
        let pageSize = this.state.pageSize;
        let currentPage = this.state.currentPage;
        let totalRecords = this.state.totalRecords;

        return (

            <div>
                <Sidebar />

                <div className='call-history-view-style'>

                    <Header />
                    {!show ?
                        <div className='call-history-view'>
                            <div>
                                <span className='call-history-header-text'>CALL HISTORY</span>
                            </div>

                            {listCount > 0 ?
                                <div>
                                    <div className="row">
                                        {
                                            this.state.callHistoryList.map((data, index) => (
                                                <div className="col-md-12 col-sm-12 col-lg-6 col-xl-4" id='call-history-card-view' key={index}>
                                                    <Card style={{ height: '370px' }} className='call-history-card' >
                                                        <div className="row" id='call-history-sub-view' >

                                                            <div className="col-8" >
                                                                <h6 style={{ fontWeight: '300', color: '#2C5566' }} className='call-history-name'>MEETING ID : {data.roomId}</h6>
                                                            </div>

                                                            <div className="col-4" id='call-history-button-view' onClick={() => { this.showMeetinDetails(data) }}>
                                                                <span title="View Participant Details" style={{ cursor: 'pointer' }} className="fas fa-ellipsis-v"></span>
                                                            </div>

                                                        </div>
                                                        <div className='card-divider' />

                                                        <div className="container">
                                                            <div className="row">
                                                                <div className="col-sm">
                                                                    <span style={{ color: '#92B7BC' }}> Start Date</span><br />
                                                                    <span style={{ color: '#2C5566' }}>{data.startTime}</span>
                                                                </div>
                                                                <div style={{ textAlign: 'end' }} className="col-sm">
                                                                    <span style={{ color: '#92B7BC' }}>End Date</span><br />
                                                                    <span style={{ color: '#2C5566' }}>{data.endTime} </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div style={{ textAlign: 'center' }} className="container">
                                                            <div className="row">
                                                                <div className="col-sm">
                                                                    <span style={{ color: '#92B7BC' }}> Total Hours</span> <br />
                                                                    <span style={{ color: '#2C5566', fontWeight: 'bold' }}>{data.totalHours}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row" id='call-history-view' >

                                                            <div className="col-sm-12" >
                                                                <p className='call-history-text' >Participants </p>
                                                            </div>

                                                            <div id='call-history-image-view' className="row" >

                                                                <div>
                                                                    {data.participants.length <= 3 ?
                                                                        data.participants.map((res, element) => (
                                                                            <span key={element} style={{ float: 'left' }}>
                                                                                <span className="mr-2" style={{ display: 'block' }}>
                                                                                    <Avatar title={res.name ? res.name : ''} aria-label="clinic" className='sonographer-image' src={res.user_pic ? res.user_pic : avatar}> SL</Avatar>
                                                                                </span><br />
                                                                                <span className="meeting-hours">{res.total_duration}</span>
                                                                            </span>
                                                                        ))
                                                                        :
                                                                        <span style={{ float: 'left' }}>
                                                                            <span className="mr-2" style={{ display: 'block' }}>
                                                                                <img title={data.participants[0].name ? data.participants[0].name : ''} alt="clinic" className='sonographer-avatars' src={data.participants[0].user_pic ? data.participants[0].user_pic : avatar} /><br />
                                                                                <span className="meeting-hours">{data.participants[0].total_duration}</span>
                                                                            </span>

                                                                            <span className="mr-2" style={{ display: 'block' }}>
                                                                                <img title={data.participants[1].name ? data.participants[1].name : ''} alt="clinic" className='sonographer-avatars' src={data.participants[1].user_pic ? data.participants[1].user_pic : avatar} /><br />
                                                                                <span className="meeting-hours">{data.participants[0].total_duration}</span>
                                                                            </span>

                                                                            <span className="mr-2" style={{ display: 'block' }}>
                                                                                <img title={data.participants[2].name ? data.participants[2].name : ''} alt="clinic" className='sonographer-avatars' src={data.participants[2].user_pic ? data.participants[2].user_pic : avatar} /><br />
                                                                                <span className="meeting-hours">{data.participants[0].total_duration}</span>
                                                                            </span>

                                                                            <span className="mr-2" style={{ display: 'block' }}>
                                                                                <img title={data.participants[3].name ? data.participants[3].name : ''} alt="clinic" className='sonographer-avatars' src={data.participants[3].user_pic ? data.participants[3].user_pic : avatar} /><br />
                                                                                <span className="meeting-hours">{data.participants[0].total_duration}</span>
                                                                            </span>

                                                                            <div style={{ float: 'right' }} className="member-chip logo-icon1" id='sonographer-count'>
                                                                                <div className="number" id='sonographer-number' >
                                                                                    +{data.participants.length - 4}
                                                                                </div>
                                                                            </div>

                                                                        </span>
                                                                    }
                                                                </div>

                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            ))
                                        }
                                    </div>

                                    <div>
                                        <span style={{ paddingTop: '20px', display: 'inline-block', color: '#808080' }}>
                                            {currentPage} - {pageSize} of {totalRecords} items
                                        </span>
                                        <div className='call-history-pagination mb-5'>
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


                    <div>
                        {
                            this.state.showParticipantsPopup ?
                                <div className='logout-popup'>
                                    <div className='call-history-popup'>
                                        <div style={{ fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }} className="modal-content call-history-modal-content">
                                            <div className="modal-header call-history-modal-header">
                                                <span style={{ textAlign: 'left' }}>PARTICIPANTS</span>
                                                <img onClick={this.handleClose} className="close-icon" src={closeicon} alt="Perinatal access logo" />
                                            </div>

                                            <div className="modal-body" style={{ paddingBottom: '20px' }}>
                                                {this.state.participantsList.length > 0 ?
                                                    <div style={{ overflowY: 'scroll', height: '400px' }}>
                                                        <table>
                                                            <thead style={{ color: '#537381' }}>
                                                                <tr>
                                                                    <th>S.No</th>
                                                                    <th>Profile</th>
                                                                    <th>Name</th>
                                                                    <th>Call Join Time</th>
                                                                    <th>Call End Time</th>
                                                                    <th>Total Duration</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody style={{ color: '#2C5566' }}>
                                                                {
                                                                    this.state.participantsList.map((data, i) => (
                                                                        <tr style={{ textTransform: 'capitalize', borderBottom: '1px solid lightgrey' }} key={i}>
                                                                            <td> {i + 1}. </td>
                                                                            <td> <img className="add-call-image-style" src={data.user_pic ? data.user_pic : avatar} alt="Perinatal access logo" /> </td>
                                                                            <td style={{ fontWeight: 'bold' }}> {data.name}</td>
                                                                            <td>
                                                                                <span>{data.startDate}</span>
                                                                                <span style={{ textTransform: 'uppercase' }}>{data.startTime}</span>
                                                                            </td>
                                                                            <td>
                                                                                <span>{data.endDate}</span>
                                                                                <span style={{ textTransform: 'uppercase' }}>{data.endTime}</span>
                                                                            </td>
                                                                            <td> {data.totalHours}</td>
                                                                        </tr>
                                                                    ))
                                                                }
                                                            </tbody>
                                                        </table>
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
                <Footer />
            </div >
        )
    }
}
