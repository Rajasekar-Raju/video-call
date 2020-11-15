import React, { Component } from 'react'
import { Card, CardHeader, Button } from '@material-ui/core';
import avatar from '../../static/assets/avatar.png';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import PhoneIcon from '@material-ui/icons/Phone';
import Header from '../MasterPage/Header';
import Sidebar from '../MasterPage/Sidebar';
import '../../static/styles/ExternalClinic.css';
import Pagination from '@material-ui/lab/Pagination';
import Notify, { AlertTypes } from '../../services/Notify';
import Environments from '../../services/Environments';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import Footer from '../MasterPage/Footer';
import Progressbar from '../../services/Progressbar';

export class ExternalClinic extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchClinicList: [],
            pageSize: 0,
            searchValue: '',
            show: true,
            currentPage: 0,
            totalRecords: 0
        };
    }

    componentDidMount() {
        this.getSearchClinicList();
    }

    getSearchClinicList() {
        var perpage = String(12);
        var result = `list-other-clinics?perpage=${perpage}`;
        const getOtherClinic = Environments.getAPI(result)
        getOtherClinic.then(res => {
            const clinics = res.data.data.clinics.data;
            var len = clinics.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = clinics[i].user_meta[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                clinics[i].user_meta[0].contact_no = phone;
            }
            this.setState({
                searchClinicList: clinics,
                pageSize: Math.ceil(Number(res.data.data.clinics.total / 12)),
                currentPage: res.data.data.clinics.current_page,
                totalRecords: res.data.data.clinics.total
            });
            this.setState({ show: false });
        }).catch(err => {
            this.setState({ show: false });
        });
    }

    nextPage = (event, value) => {
        var page = String(value);
        var result = `list-other-clinics?page=${page}&perpage=12`;
        var searchModel = {
            search: this.state.searchValue
        }
        const getOtherClinic = Environments.getAPIById(result, searchModel);
        getOtherClinic.then(res => {
            const clinics = res.data.data.clinics.data;
            var len = clinics.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = clinics[i].user_meta[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                clinics[i].user_meta[0].contact_no = phone;
            }
            this.setState({
                searchClinicList: clinics,
                pageSize: Math.ceil(Number(res.data.data.clinics.total / 12)),
                currentPage: res.data.data.clinics.current_page,
                totalRecords: res.data.data.clinics.total
            });
        });
    }

    inviteClinic = (id) => {
        const postInviteClinic = Environments.postAPI('send-request', { 'id': id })
        postInviteClinic.then(res => {
            const message = res.data.msg
            Notify.sendNotification(message, AlertTypes.success);
            console.log(res);
        }, err => {
            const message = err.data.error.send_request
            Notify.sendNotification(message, AlertTypes.error);
            console.log(err);
        });
    };

    searchClinicList = () => {
        var searchModel = {
            search: this.state.searchValue
        }
        const getOtherClinic = Environments.getAPIById('list-other-clinics?perpage=12', searchModel);
        getOtherClinic.then(res => {
            const clinics = res.data.data.clinics.data;
            var len = clinics.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = clinics[i].user_meta[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                clinics[i].user_meta[0].contact_no = phone;
            }
            this.setState({
                searchClinicList: clinics,
                pageSize: Math.ceil(Number(res.data.data.clinics.total / 12)),
                currentPage: res.data.data.clinics.current_page,
                totalRecords: res.data.data.clinics.total
            });
        });
    }

    onTodoChange(value) {
        this.setState({
            searchValue: value
        });
    }

    render() {
        let listCount = this.state.searchClinicList.length;
        let show = this.state.show;
        let pageSize = this.state.pageSize;
        let currentPage = this.state.currentPage;
        let totalRecords = this.state.totalRecords;

        return (
            <div className="external-clinic">
                <Sidebar />

                <div className="external-clinic-sidebar">

                    <Header />

                    {!show ?
                        <div className="external-clinic-header">

                            <div>
                                <span className="search-clinic-title">SEARCH CLINICS</span>

                                <input className="form-control form-control-sm search-design search-clinic-filter" style={{ width: '32%', marginTop: '-6px' }} type="text" placeholder="Search Clinic"
                                    value={this.state.searchValue}
                                    onChange={e => this.onTodoChange(e.target.value)}
                                    onKeyUp={this.searchClinicList}
                                    aria-label="Search" />
                            </div>

                            {listCount > 0 ?
                                <div style={{ marginTop: '10px' }}>
                                    <div className="row">
                                        {
                                            this.state.searchClinicList.map((data, index) => (
                                                <div className="col-md-12 col-sm-12 col-lg-6 col-xl-4 search-clinic-card-outer" key={index}>
                                                    <Card className="search-clinic-card">

                                                        <div className="row header-content">

                                                            <div className="col-9" >
                                                                <h6 variant="subtitle1" className="search-clinic-name">{data.first_name} {data.last_name}</h6>
                                                            </div>

                                                            <div className="col-3 invite-button-outer">
                                                                <Button onClick={() => { this.inviteClinic(data.id) }} size="large" className="invite-button">Invite</Button>
                                                            </div>

                                                        </div>

                                                        <div className="search-clinic-divider" />

                                                        <div className="external-clinic-content">

                                                            <div>
                                                                <CardHeader avatar={
                                                                    <img src={data.profile_pic ? data.profile_pic : avatar} alt="Perinatal Access Logo" className="clinic-logo-image" />
                                                                } />
                                                            </div>

                                                            <div>
                                                                <div className="external-clinic-icons">
                                                                    <span className="icon-size">
                                                                        <MailOutlineIcon className="content-icons" />
                                                                        {data.email} </span> <br />
                                                                    <span className="icon-size">
                                                                        <LocationOnIcon className="content-icons" />
                                                                        {data.user_meta[0].address ? data.user_meta[0].address : 'Puducherry'} </span>  <br />
                                                                    <span className="icon-size">
                                                                        <PhoneIcon className="content-icons" />
                                                                        {data.user_meta[0].contact_no}
                                                                    </span>

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
                                        <div className="search-clinic-pagination mb-5">
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

export default ExternalClinic
