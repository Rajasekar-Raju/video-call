import React, { Component } from 'react'
import '../../static/styles/RequestList.css'
import avatar from '../../static/assets/avatar.png';
import { Card, Button } from '@material-ui/core'
import Header from '../MasterPage/Header'
import Sidebar from '../MasterPage/Sidebar'
import Pagination from '@material-ui/lab/Pagination';
import Environments from '../../services/Environments';
import Notify, { AlertTypes } from '../../services/Notify';
import Footer from '../MasterPage/Footer'
import Progressbar from '../../services/Progressbar';

export class RequestList extends Component {
    constructor() {
        super();
        this.state = {
            requestList: [],
            pageSize: 0,
            show: true,
            currentPage: 0,
            totalRecords: 0
        };
    }

    componentDidMount() {
        this.getRequestList();
    }

    getRequestList() {
        var perpage = String(12);
        var result = `list-requests?perpage=${perpage}`;
        const getRequests = Environments.getAPI(result)
        getRequests.then(res => {
            const request = res.data.data.requests.data;
            var len = request.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = request[i].from_user.user_meta[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                request[i].from_user.user_meta[0].contact_no = phone;
            }
            this.setState({
                requestList: request,
                pageSize: Math.ceil(Number(res.data.data.requests.total / 12)),
                currentPage: res.data.data.requests.current_page,
                totalRecords: res.data.data.requests.total
            });
            this.setState({ show: false });
        }).catch(err => {
            this.setState({ show: false });
        });
    }

    nextPage = (event, value) => {
        var page = String(value);
        var result = `list-requests?page=${page}&perpage=12`;
        const getRequests = Environments.getAPI(result)
        getRequests.then(res => {
            const request = res.data.data.requests.data;
            this.setState({
                requestList: request,
                pageSize: Math.ceil(Number(res.data.data.requests.total / 12)),
                currentPage: res.data.data.requests.current_page,
                totalRecords: res.data.data.requests.total
            });
        });
    }

    statusSubmit = (value, clinicId) => {
        let statusData = {};
        if (value === 'accept') {
            statusData = {
                status: 2,
                clinic_id: clinicId
            }
        }
        if (value === 'reject') {
            statusData = {
                status: 3,
                clinic_id: clinicId
            }
        }
        const postStatus = Environments.postAPI('change-request-status', statusData)
        postStatus.then(res => {
            const message = res.data.msg
            Notify.sendNotification(message, AlertTypes.success);
        });
    };

    render() {
        let listCount = this.state.requestList.length;
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
                            <div>
                                <p className="page-title">REQUEST LIST</p>
                            </div>

                            {listCount > 0 ?
                                <div>
                                    <div className="row">
                                        {
                                            this.state.requestList.map((data, i) => (

                                                <div className="col-12 col-md-12 col-sm-12 col-lg-6 col-xl-4 card-outer-content" key={i}>
                                                    <Card className="card-style">

                                                        <div className="card-inner-content">
                                                            <div className="col-12 card-content-style">
                                                                <div style={{ padding: '0px' }} className="col-md-2 col-sm-2">
                                                                    <img className="request-image-style" src={data.from_user.profile_pic ? data.from_user.profile_pic : avatar} alt="Perinatal access logo" />
                                                                </div>
                                                                <div style={{ padding: '0px', paddingLeft: '10px' }} className="col-md-5 col-sm-5 text-content">
                                                                    <span className="request-name">{data.from_user.first_name + ' ' + data.from_user.last_name}</span><br />
                                                                    <span>
                                                                        <i className="fas fa-phone-alt phone-icon"></i>
                                                                        <span className="phone-number">{data.from_user.user_meta[0].contact_no}</span>
                                                                    </span>
                                                                </div>
                                                                <div style={{ padding: '0px', paddingLeft: '10px', marginLeft: '12px' }} className="col-md-5 col-sm-5 request-button-style">
                                                                    <Button className="accept-button" onClick={() => { this.statusSubmit('accept', data.from_user.user_meta[0].user_clinic_id) }} size="large">Accept</Button>
                                                                    <Button className="reject-button" onClick={() => { this.statusSubmit('reject', data.from_user.user_meta[0].user_clinic_id) }} size="large">Reject</Button>
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

export default RequestList
