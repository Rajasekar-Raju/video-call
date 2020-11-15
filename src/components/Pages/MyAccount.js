import React from 'react';
import '../../static/styles/MyAccount.css';
import backgroundTitle from '../../static/assets/background-tile.png';
import avatar from '../../static/assets/avatar.png';
import { Button, FormControl } from '@material-ui/core'
import EditIcon from '@material-ui/icons/Edit';
import CallIcon from '@material-ui/icons/Call';
import Header from '../MasterPage/Header'
import Sidebar from '../MasterPage/Sidebar'
import Notify, { AlertTypes } from '../../services/Notify';
import StorageConfiguration from '../../services/StorageConfiguration';
import Environments from '../../services/Environments';
import Footer from '../MasterPage/Footer'
import { connect } from "react-redux";

class MyAccount extends React.Component {

    constructor() {
        super();
        this.state = {
            isEdit: false,
            profileImage: '',
            form: {
                firstName: '',
                lastName: '',
                speciality: '',
                email: '',
                mobile: '',
                userName: '',
                location: '',
            },
            formErrors: {
                firstName: null,
                lastName: null,
                speciality: null,
                email: null,
                mobile: null,
                userName: null,
                location: null,
            },
            phone: ''
        };
    }

    componentDidMount() {
        this.getProfile();
    }

    getProfile() {
        const getMyAccount = Environments.getAPI('physician/edit-profile')
        getMyAccount.then(res => {
            let accountDetails = res.data.data.personal_details;
            var mobile = accountDetails.user_meta[0].contact_no;
            var phone = [mobile.slice(0, 3), " ", mobile.slice(3, 6), " ", mobile.slice(6)].join('');
            this.setState({
                form: {
                    firstName: accountDetails.first_name,
                    lastName: accountDetails.last_name,
                    speciality: accountDetails.speciality,
                    email: accountDetails.email,
                    mobile: mobile,
                    userName: accountDetails.username,
                    location: accountDetails.user_meta[0].location_name
                },
                phone: phone
            });
            this.setState({ profileImage: accountDetails.profile_pic });
        }).catch(err => {

        });
    }

    validateField = (name, value, refValue) => {
        let errorMsg = null;
        switch (name) {
            case "firstName":
                if (!value) errorMsg = "Please enter first name.";
                break;
            case "lastName":
                if (!value) errorMsg = "Please enter last name.";
                break;
            case "speciality":
                if (!value) errorMsg = "Please enter speciality.";
                break;
            case "email":
                if (!value) errorMsg = "Please enter email.";
                else if (
                    !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                        value
                    )
                )
                    errorMsg = "Please enter valid email.";
                break;
            case "mobile":
                if (!value) errorMsg = "Please enter contact number.";
                else if (
                    !/^(\+\d{1,3}[- ]?)?\d{10}$/.test(
                        value
                    )
                )
                    errorMsg = "Please enter valid 10 digit contact number.";
                break;
            case "userName":
                if (!value) errorMsg = "Please enter user name.";
                break;
            case "location":
                if (!value) errorMsg = "Please enter location.";
                break;
            default:
                break;
        }
        return errorMsg;
    };

    validateForm = (form, formErrors, validateFunc) => {
        let role = Number(StorageConfiguration.sessionGetItem('role'));
        if (role === 2) {
            delete form.speciality;
            delete formErrors.speciality;
        }
        const errorObj = {};
        Object.keys(formErrors).map(x => {
            let refValue = null;
            if (x === "password") {
                refValue = form[x = "password"];
            }
            const msg = validateFunc(x, form[x], refValue);
            if (msg) errorObj[x] = msg;
            return msg;
        });
        return errorObj;
    };

    handleSubmit = () => {
        const { form, formErrors } = this.state;
        const errorObj = this.validateForm(form, formErrors, this.validateField);
        if (Object.keys(errorObj).length !== 0) {
            this.setState({ formErrors: { ...formErrors, ...errorObj } });
            Notify.sendNotification('Please enter the required fields.', AlertTypes.error);
            return false;
        }
        const role = Number(StorageConfiguration.sessionGetItem('role'));
        let myAccountModel = {
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            contact_no: form.mobile,
            username: form.userName,
            speciality: role !== 2 ? form.speciality : '***',
            location_name: form.location
        }
        const postMyAccount = Environments.postAPI('physician/update-profile', myAccountModel)
        postMyAccount.then(res => {
            console.log('res', res);
            let message = res.data.msg;
            if (res.data.error !== undefined) {
                let toastvalue = 'Please Check the Followings ';
                for (const element of res.data.error) {
                    var i = 1;
                    for (const fields in element) {
                        toastvalue += i + '. ' + element[fields];
                        i++
                    }
                }
                Notify.sendNotification(toastvalue, AlertTypes.error);
            }
            else {
                this.setState({ isEdit: !this.state.isEdit });
                Notify.sendNotification(message, AlertTypes.success);
                this.getProfile();
                this.props.updateProfilePicture();
                StorageConfiguration.sessionSetItem('firstName', form.firstName);
                StorageConfiguration.sessionSetItem('lastName', form.lastName);
            }
        }).catch(err => {
            console.log('err', err);
            Notify.sendNotification('Account updation failed.', AlertTypes.error);
        });
    };

    handleChange = e => {
        const { name, value } = e.target;
        const { form, formErrors } = this.state;
        let formObj = {};
        // handle change event text field
        formObj = {
            ...form,
            [name]: value
        };
        this.setState({ form: formObj }, () => {
            if (!Object.keys(formErrors).includes(name)) return;
            let formErrorsObj = {};
            if (name === "password") {
                let refValue = this.state.form[
                    "password"
                ];
                const errorMsg = this.validateField(name, value, refValue);
                formErrorsObj = { ...formErrors, [name]: errorMsg };
                if (!errorMsg && refValue) {
                    formErrorsObj.password = null;
                }
            }
            else {
                const errorMsg = this.validateField(
                    name,
                    value
                );
                formErrorsObj = { ...formErrors, [name]: errorMsg };
            }
            this.setState({ formErrors: formErrorsObj });
        });
    };

    profileUpload = (e) => {
        const selectedFile = e.target.files[0];
        var idxDot = selectedFile.name.lastIndexOf('.') + 1;
        var extFile = selectedFile.name.substr(idxDot, selectedFile.name.length).toLowerCase();
        if (extFile === 'jpg' || extFile === 'jpeg' || extFile === 'png' || extFile === 'jfif') {
            var formData = new FormData();
            formData.append("profile_pic", e.target.files[0]);

            const postProfilePic = Environments.postAPI('physician/update-profile-pic', formData)
            postProfilePic.then(res => {
                const message = res.data.msg
                Notify.sendNotification(message, AlertTypes.success);
                this.setState({ profileImage: res.data.data.profile_pic });
                StorageConfiguration.sessionSetItem('profilePic', res.data.data.profile_pic);
                console.log(res);
                this.props.updateProfilePicture();
            }, err => {
                const message = err.data.error.send_request
                Notify.sendNotification(message, AlertTypes.error);
                console.log(err);
            });

        }
        else {
            Notify.sendNotification('Please upload jpg, jpeg, png and jfif files only.', AlertTypes.error);
        }
    }

    keyPress = (value) => {
        const pattern = /[0-9]/;
        let inputChar = String.fromCharCode(value.charCode);
        if (value.keyCode !== 8 && !pattern.test(inputChar)) {
            value.preventDefault();
        }
    }

    render() {
        const isEdit = this.state.isEdit;
        const profile = this.state.profileImage;
        const { form, formErrors } = this.state;
        let role = Number(StorageConfiguration.sessionGetItem('role'));
        return (

            <div className="my-account-content">

                <Sidebar />

                <div className="layout-style">
                    <Header />
                    <div className="header-style">

                        <div>
                            <p className="page-title">MY ACCOUNT</p>
                        </div>

                        <div className="account-background-image">
                            <img style={{ marginLeft: '-35px' }} alt="Perinatal Access Logo" src={backgroundTitle} />
                        </div>

                        <div className="my-account-background-outer">
                            <div className="my-account-background">
                                <div className="container-fluid mb-5">
                                    <div className="row">
                                        <div className="col-sm-3 profile-card profile-card-style">
                                            <div className="user-image">

                                                <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
                                                    {profile !== '' && profile !== null ?
                                                        <img src={profile} alt="Perinatal Access Logo" className="profile-image" />
                                                        :
                                                        <img src={avatar} alt="Perinatal Access Logo" className="profile-image" />
                                                    }

                                                    <div className="image-upload">
                                                        <span>
                                                            <i className="fa fa-camera" id='upload-image' aria-hidden="true"></i>
                                                        </span>
                                                        <input id="file-input" type="file" accept=".jpg, .jpeg, .png, .jfif" onChange={this.profileUpload}
                                                        />
                                                    </div>
                                                </label>

                                            </div>

                                            <span title={this.state.form.firstName + ' ' + this.state.form.lastName}
                                                className="user-name profile-label">
                                                {this.state.form.firstName} {this.state.form.lastName}
                                            </span>

                                            <span
                                                className="mobile-number">
                                                <CallIcon className="call-icon-style" />
                                                <span className="profile-label mobile-style"> {this.state.phone}
                                                </span>
                                            </span>

                                        </div>

                                        <div className="col-sm personal-details">
                                            <div className="profile-details">
                                                <p className="personal-details-title">PERSONAL DETAILS</p>
                                                {!this.state.isEdit ?
                                                    <span title='Edit'>
                                                        <EditIcon title="Edit" className="edit-icon-style" onClick={() => { this.setState({ isEdit: !this.state.isEdit }) }} />
                                                    </span>
                                                    :
                                                    ''
                                                }
                                                <p className="change-password-title" onClick={() => this.props.history.push('/change-password')}>CHANGE PASSWORD</p>
                                            </div>

                                            <div className="divider-style" />

                                            <div className="personal-details-card-outer">
                                                <div className="container personal-details-card">

                                                    {isEdit ?
                                                        <div>
                                                            <div className="row">
                                                                <div className="col-sm">
                                                                    <FormControl className="col-sm form-control-label" variant="filled">
                                                                        <label className="field-label">
                                                                            FIRST NAME<span className="asterisk">*</span>
                                                                        </label>
                                                                        <input className="form-control input-label"
                                                                            maxLength="50"
                                                                            type="text"
                                                                            name="firstName"
                                                                            value={form.firstName}
                                                                            onChange={this.handleChange}
                                                                            onBlur={this.handleChange}
                                                                            required
                                                                        />
                                                                        {formErrors.firstName && (
                                                                            <span className="err">{formErrors.firstName}</span>
                                                                        )}
                                                                    </FormControl>
                                                                </div>
                                                                <div className="col-sm">
                                                                    <FormControl className="col-sm form-control-label">
                                                                        <label className="field-label">
                                                                            LAST NAME<span className="asterisk">*</span>
                                                                        </label>
                                                                        <input className="form-control input-label"
                                                                            maxLength="50"
                                                                            type="text"
                                                                            name="lastName"
                                                                            value={form.lastName}
                                                                            onChange={this.handleChange}
                                                                            onBlur={this.handleChange}
                                                                            required
                                                                        />
                                                                        {formErrors.lastName && (
                                                                            <span className="err">{formErrors.lastName}</span>
                                                                        )}
                                                                    </FormControl>
                                                                </div>
                                                            </div>
                                                            <div className="row">
                                                                <div className="col-sm">
                                                                    <FormControl className="col-sm form-control-label">
                                                                        <label className="field-label">
                                                                            CONTACT NUMBER<span className="asterisk">*</span>
                                                                        </label>
                                                                        <input className="form-control input-label" onKeyPress={this.keyPress}
                                                                            type="text"
                                                                            maxLength="10"
                                                                            name="mobile"
                                                                            value={form.mobile}
                                                                            onChange={this.handleChange}
                                                                            onBlur={this.handleChange}
                                                                            required
                                                                        />
                                                                        {formErrors.mobile && (
                                                                            <span className="err">{formErrors.mobile}</span>
                                                                        )}
                                                                    </FormControl>
                                                                </div>
                                                                <div className="col-sm">
                                                                    <FormControl className="col-sm form-control-label">
                                                                        <label className="field-label">
                                                                            LOCATION<span className="asterisk">*</span>
                                                                        </label>
                                                                        <input className="form-control input-label"
                                                                            maxLength="250"
                                                                            type="text"
                                                                            name="location"
                                                                            value={form.location}
                                                                            onChange={this.handleChange}
                                                                            onBlur={this.handleChange}
                                                                            required
                                                                        />
                                                                        {formErrors.location && (
                                                                            <span className="err">{formErrors.location}</span>
                                                                        )}
                                                                    </FormControl>
                                                                </div>
                                                            </div>
                                                            <div className="row">
                                                                <div className="col-sm">
                                                                    <FormControl className="col-sm form-control-label">
                                                                        <label className="field-label">
                                                                            USER NAME<span className="asterisk">*</span>
                                                                        </label>
                                                                        <input className="form-control input-label"
                                                                            maxLength="50"
                                                                            type="text"
                                                                            name="userName"
                                                                            value={form.userName}
                                                                            onChange={this.handleChange}
                                                                            onBlur={this.handleChange}
                                                                            required
                                                                        />
                                                                        {formErrors.userName && (
                                                                            <span className="err">{formErrors.userName}</span>
                                                                        )}
                                                                    </FormControl>
                                                                </div>
                                                                <div className="col-sm">
                                                                    <FormControl className="col-sm form-control-label">
                                                                        <label className="field-label">
                                                                            EMAIL ID<span className="asterisk">*</span>
                                                                        </label>
                                                                        <input className="form-control input-label"
                                                                            maxLength="50"
                                                                            type="email"
                                                                            name="email"
                                                                            value={form.email}
                                                                            onChange={this.handleChange}
                                                                            onBlur={this.handleChange}
                                                                            required
                                                                        />
                                                                        {formErrors.email && (
                                                                            <span className="err">{formErrors.email}</span>
                                                                        )}
                                                                    </FormControl>
                                                                </div>
                                                            </div>
                                                            <div className="row">
                                                                {role !== 2 ?
                                                                    <div className="col-sm-6">
                                                                        <FormControl className="col-sm form-control-label">
                                                                            <label className="field-label">
                                                                                SPECIALITY<span className="asterisk">*</span>
                                                                            </label>
                                                                            <input className="form-control input-label"
                                                                                maxLength="250"
                                                                                type="text"
                                                                                name="speciality"
                                                                                value={form.speciality}
                                                                                onChange={this.handleChange}
                                                                                onBlur={this.handleChange}
                                                                                required
                                                                            />
                                                                            {formErrors.speciality && (
                                                                                <span className="err">{formErrors.speciality}</span>
                                                                            )}
                                                                        </FormControl>
                                                                    </div>
                                                                    :
                                                                    <span></span>
                                                                }
                                                            </div>

                                                            <div className="row my-account-button-style">
                                                                <Button mat-button="true" className="update-button my-account-button" onClick={this.handleSubmit}>UPDATE </Button>
                                                            </div>
                                                        </div>

                                                        :

                                                        <div className="pl-4">
                                                            <div className="row">
                                                                <div className="p-3 col-sm personal-view-label" title={this.state.form.firstName}>
                                                                    <div><span className="font-weight-bold personal-view-data" >FIRST NAME :</span></div>
                                                                    <span className="ellipsis-style">{this.state.form.firstName}</span>
                                                                </div>
                                                                <div className="p-3 col-sm personal-view-label" title={this.state.form.lastName}>
                                                                    <div> <span className="font-weight-bold personal-view-data">  LAST NAME :</span> </div>
                                                                    <span className="ellipsis-style">{this.state.form.lastName}</span>
                                                                </div>
                                                            </div>

                                                            <div className="row">
                                                                <div className="p-3 col-sm personal-view-label" title={this.state.form.mobile}>
                                                                    <div> <span className="font-weight-bold personal-view-data">  CONTACT NUMBER :</span></div>
                                                                    <span className="ellipsis-style">{this.state.phone}</span>
                                                                </div>
                                                                <div className="p-3 col-sm personal-view-label" title={this.state.form.location}>
                                                                    <div> <span className="font-weight-bold personal-view-data">  LOCATION :</span> </div>
                                                                    <span className="ellipsis-style"> {this.state.form.location}</span>
                                                                </div>
                                                            </div>

                                                            <div className="row">
                                                                <div className="p-3 col-sm personal-view-label" title={this.state.form.email}>
                                                                    <div>  <span className="font-weight-bold personal-view-data">  EMAIL :</span> </div>
                                                                    <span className="ellipsis-style">{this.state.form.email}</span>
                                                                </div>
                                                                <div className="p-3 col-sm personal-view-label" title={this.state.form.userName}>
                                                                    <div>  <span className="font-weight-bold personal-view-data">  USER NAME: </span></div>
                                                                    <span className="ellipsis-style">{this.state.form.userName}</span>
                                                                </div>
                                                            </div>

                                                            {role !== 2 ?
                                                                <div className="row">
                                                                    <div className="p-3 col-sm personal-view-label" title={this.state.form.speciality}>
                                                                        <div>  <span className="font-weight-bold personal-view-data">  SPECIALITY :</span> </div>
                                                                        <span className="ellipsis-style">{this.state.form.speciality}</span>
                                                                    </div>
                                                                    <div className="p-3 col-sm personal-view-label">
                                                                        <div> <span className="font-weight-bold personal-view-data">  Role :</span> </div>
                                                                        {role === 2 ?
                                                                            <span>Sonographer</span>
                                                                            :
                                                                            role === 3 ?
                                                                                <span>Internal Physician</span>
                                                                                :
                                                                                role === 4 ?
                                                                                    <span>External Physician</span>
                                                                                    :
                                                                                    role === 5 ?
                                                                                        <span>Staff</span>
                                                                                        :
                                                                                        role === 7 ?
                                                                                            <span>External Sonographer</span>
                                                                                            :
                                                                                            ''
                                                                        }
                                                                    </div>
                                                                </div>
                                                                :
                                                                <div className="row">
                                                                    <div className="p-3 col-sm-6 personal-view-label">
                                                                        <div> <span className="font-weight-bold personal-view-data">  Role :</span> </div>
                                                                        {role === 2 ?
                                                                            <span>Sonographer</span>
                                                                            :
                                                                            role === 3 ?
                                                                                <span>Internal Physician</span>
                                                                                :
                                                                                role === 4 ?
                                                                                    <span>External Physician</span>
                                                                                    :
                                                                                    role === 5 ?
                                                                                        <span>Staff</span>
                                                                                        :
                                                                                        role === 7 ?
                                                                                            <span>External Sonographer</span>
                                                                                            :
                                                                                            ''
                                                                        }
                                                                    </div>
                                                                </div>
                                                            }
                                                        </div>

                                                    }

                                                </div>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <Footer />
            </div>
        )

    }

}

const mapStateToProps = state => {
    return {
        isNotifications: state.isNotifications,
    };
};

const mapDispachToProps = dispatch => {
    return {
        updateProfilePicture: () => dispatch({ type: "UPDATE_PROFILE_PICTURE", value: true })
    };
};
export default connect(
    mapStateToProps,
    mapDispachToProps
)(MyAccount)