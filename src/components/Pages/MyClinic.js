import React, { Component } from 'react'
import { Card, CardHeader, Button, Avatar } from '@material-ui/core';
import avatar from '../../static/assets/avatar.png';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import PhoneIcon from '@material-ui/icons/Phone';
import Header from '../MasterPage/Header';
import Sidebar from '../MasterPage/Sidebar';
import '../../static/styles/MyClinic.css';
import Pagination from '@material-ui/lab/Pagination';
import Environments from '../../services/Environments';
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import Footer from '../MasterPage/Footer';
import Progressbar from '../../services/Progressbar';

export default class MyClinic extends Component {

    constructor(props) {
        super(props);
        this.state = {
            clinicList: [],
            pageSize: 0,
            searchValue: '',
            show: true,
            currentPage: 0,
            totalRecords: 0
        };
    }

    componentDidMount() {
        this.getClinicList();
    }

    getClinicList() {
        var perpage = String(12);
        var result = `list-clinics?perpage=${perpage}`;
        const getMyClinic = Environments.getAPI(result);
        getMyClinic.then(res => {
            const clinics = res.data.data.clinics.data;
            var len = clinics.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = clinics[i].user_meta[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                clinics[i].user_meta[0].contact_no = phone;
            }
            this.setState({
                clinicList: clinics,
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
        var result = `list-clinics?page=${page}&perpage=12`;
        const getMyClinic = Environments.getAPI(result);
        getMyClinic.then(res => {
            const clinics = res.data.data.clinics.data;
            var len = clinics.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = clinics[i].user_meta[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                clinics[i].user_meta[0].contact_no = phone;
            }
            this.setState({
                clinicList: clinics,
                pageSize: Math.ceil(Number(res.data.data.clinics.total / 12)),
                currentPage: res.data.data.clinics.current_page,
                totalRecords: res.data.data.clinics.total
            });
        });
    }

    searchClinicList = () => {
        var getMyClinic = Environments.getAPI('list-clinics?search=' + this.state.searchValue + '&perpage=12')
        getMyClinic.then(res => {
            const clinics = res.data.data.clinics.data;
            var len = clinics.length,
                i = 0;
            for (i = 0; i < len; i++) {
                var mobile = clinics[i].user_meta[0].contact_no;
                var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
                clinics[i].user_meta[0].contact_no = phone;
            }
            this.setState({
                clinicList: clinics,
                pageSize: Math.ceil(Number(res.data.data.clinics.total / 12)),
                currentPage: res.data.data.clinics.current_page,
                totalRecords: res.data.data.clinics.total
            });
        });
    }

    onClinicSearch(value) {
        this.setState({
            searchValue: value
        });
    }

    viewSonographer = (event) => {
        this.props.history.push("/all-physicians",
            {
                clinicId: event.id,
                clinicName: event.first_name + ' ' + event.last_name
            });
    };

    render() {
        let listCount = this.state.clinicList.length;
        let show = this.state.show;
        let pageSize = this.state.pageSize;
        let currentPage = this.state.currentPage;
        let totalRecords = this.state.totalRecords;

        return (

            <div className='main-view'>
                <Sidebar />

                <div className='content-view-style'>

                    <Header />

                    {!show ?
                        <div className='header-view'>
                            <div>
                                <span className='header-text'>MY CLINIC</span>

                                <input className="form-control form-control-sm search-design search-clinic-filter" style={{ width: '32%', marginTop: '-6px' }} type="text" placeholder="Search My Clinic"
                                    value={this.state.searchValue}
                                    onChange={e => this.onClinicSearch(e.target.value)}
                                    onKeyUp={this.searchClinicList}
                                    aria-label="Search" />

                            </div>

                            {listCount > 0 ?
                                <div style={{ marginTop: '10px' }}>
                                    <div className="row">
                                        {
                                            this.state.clinicList.map((data, index) => (
                                                <div className="col-md-12 col-sm-12 col-lg-6 col-xl-4" id='card-view' key={index}>
                                                    <Card style={{ height: '300px' }} className='clinic-card' >
                                                        <div className="row" id='card-sub-view' >
                                                            <div className="col-8" >
                                                                <h6 className='clinic-name'>{data.first_name} {data.last_name}</h6>
                                                            </div>
                                                            <div className="col-4" id='button-view' >
                                                                {data.sonographer_details !== undefined ?
                                                                    <Button onClick={() => { this.viewSonographer(data) }} size="large" className='view-button'>View All</Button>
                                                                    :
                                                                    ''
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className='card-divider' />
                                                        <div className='card-content'>
                                                            <div>
                                                                <CardHeader avatar={
                                                                    <img src={data.profile_pic ? data.profile_pic : avatar} alt="Perinatal Access Logo" className="card-logo" />
                                                                }
                                                                />
                                                            </div>
                                                            <div className='card-detail-view' >
                                                                <span className='card-text' > <MailOutlineIcon className='card-text-icon' />
                                                                    <span style={{ fontSize: '14px' }}> {data.email}</span> </span> <br />
                                                                <span className='card-text'> <LocationOnIcon className='card-text-icon' /></span>
                                                                <span style={{ fontSize: '14px', marginLeft: '4px' }}>{data.user_meta[0].location_name ? data.user_meta[0].location_name : ''}</span>  <br />

                                                                <span className='card-text' >
                                                                    <PhoneIcon className='card-text-icon' />
                                                                    <span style={{ fontSize: '14px' }}> {data.user_meta[0].contact_no}</span>
                                                                </span>

                                                            </div>
                                                        </div>

                                                        <div className='card-divider' />
                                                        <div className="row" id='sonographer-view' >
                                                            <div className="col-sm-12" >
                                                                <p onClick={() => { this.viewSonographer(data) }} className='sonographer-text' >Number of Sonographers: <span className='sonographer-count'>{data.sonographer_details !== undefined ? data.sonographer_count : 'NIL'}</span></p>
                                                            </div>
                                                            <div id='sonographer-image-view' onClick={() => { this.viewSonographer(data) }} className="row" >

                                                                {data.sonographer_details !== undefined ?
                                                                    <div>
                                                                        {data.sonographer_details.length <= 3 ?
                                                                            data.sonographer_details.map((res, element) => (
                                                                                <span key={element} style={{ float: 'left' }}>
                                                                                    <Avatar title={res.first_name ? res.first_name : ''} aria-label="clinic" className='sonographer-image' src={res.profile_pic ? res.profile_pic : avatar}> SL</Avatar>
                                                                                </span>
                                                                            ))
                                                                            :
                                                                            <span style={{ float: 'left' }}>
                                                                                <img title={data.sonographer_details[0].first_name ? data.sonographer_details[0].first_name : ''} alt="clinic" className='sonographer-avatars' src={data.sonographer_details[0].profile_pic ? data.sonographer_details[0].profile_pic : avatar} />
                                                                                <img title={data.sonographer_details[1].first_name ? data.sonographer_details[1].first_name : ''} alt="clinic" className='sonographer-avatars' src={data.sonographer_details[1].profile_pic ? data.sonographer_details[1].profile_pic : avatar} />
                                                                                <img title={data.sonographer_details[2].first_name ? data.sonographer_details[2].first_name : ''} alt="clinic" className='sonographer-avatars' src={data.sonographer_details[2].profile_pic ? data.sonographer_details[2].profile_pic : avatar} />
                                                                                <img title={data.sonographer_details[3].first_name ? data.sonographer_details[3].first_name : ''} alt="clinic" className='sonographer-avatars' src={data.sonographer_details[3].profile_pic ? data.sonographer_details[3].profile_pic : avatar} />

                                                                                <div style={{ float: 'right' }} className="member-chip logo-icon1" id='sonographer-count'>
                                                                                    <div className="number" id='sonographer-number' >
                                                                                        +{data.sonographer_details.length - 4}
                                                                                    </div>
                                                                                </div>

                                                                            </span>
                                                                        }
                                                                    </div>
                                                                    :
                                                                    ''
                                                                }

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
                                        <div className='pagination-view mb-5'>
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
            </div >
        )
    }
}
