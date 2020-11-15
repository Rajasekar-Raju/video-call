import React from 'react';
import '../../static/styles/Loginpage.css';
import logo from '../../static/assets/logo.png';
import { Button, FormControl, Input, InputAdornment, InputLabel } from '@material-ui/core'
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import StorageConfiguration from '../../services/StorageConfiguration';
import Notify, { AlertTypes } from '../../services/Notify';
import Environments from '../../services/Environments';
import { connect } from "react-redux";

class Loginpage extends React.Component {

    constructor() {
        super();
        this.state = {
            isVisible: false,
            passwordType: 'password',
            form: {
                email: '',
                password: '',
            },
            formErrors: {
                email: null,
                password: null,
            },
            loginDisabled: false
        };
    }

    componentDidMount() {

    }


    validateField = (name, value, refValue) => {
        let errorMsg = null;
        switch (name) {
            case "email":
                if (!value) errorMsg = "Please enter email.";
                else if (
                    !/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                        value
                    )
                )
                    errorMsg = "Please enter valid email.";
                break;
            case "password":
                if (!value) errorMsg = "Please enter password.";
                break;
            default:
                break;
        }
        return errorMsg;
    };

    validateForm = (form, formErrors, validateFunc) => {
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
        this.setState({ loginDisabled: true });
        const loginModel = {
            email: form.email,
            password: form.password
        }
        const postLogin = Environments.postAPI('login', loginModel);
        postLogin.then(res => {
            console.log('res', res);
            this.setState({ loginDisabled: false });
            let loginData = res.data;
            if (loginData.msg === 'Login Successfull') {
                StorageConfiguration.sessionSetItem('role', loginData.data.user.role_id);
                StorageConfiguration.sessionSetItem('isloggedIn', true);
                StorageConfiguration.sessionSetItem('token', loginData.token);
                StorageConfiguration.sessionSetItem('userId', loginData.data.user.id);
                StorageConfiguration.sessionSetItem('userName', loginData.data.user.first_name + ' ' + loginData.data.user.last_name);
                StorageConfiguration.sessionSetItem('firstName', loginData.data.user.first_name);
                StorageConfiguration.sessionSetItem('lastName', loginData.data.user.last_name);
                StorageConfiguration.sessionSetItem('profilePic', loginData.data.user.profile_pic ? loginData.data.user.profile_pic : '');
                StorageConfiguration.sessionSetItem('audioDeviceId', '');
                StorageConfiguration.sessionSetItem('videoDeviceId', '');
                Notify.sendNotification('Login successfully.', AlertTypes.success);

                // User Status
                Environments.connectSignalR();
                let userdata = {
                    id: loginData.data.user.id,
                    status: 'online'
                }
                this.props.sendUserStatus(userdata);

                if (loginData.data.user.role_id !== 2) {
                    this.props.history.push('/my-clinic');
                }
                if (loginData.data.user.role_id === 2) {
                    this.props.history.push('/all-physicians');
                }
            }
        }).catch((error) => {
            this.setState({ loginDisabled: false });
            if (error.response) {
                console.log(error.response.data.msg);
                Notify.sendNotification(error.response.data.msg, AlertTypes.error);
            }
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

    handlePassword = () => {
        this.setState({ isVisible: !this.state.isVisible });
        if (this.state.isVisible === true) {
            this.setState({ passwordType: 'password' });
        }
        if (this.state.isVisible === false) {
            this.setState({ passwordType: 'text' });
        }
    };

    handleKeyDown = (value) => {
        if (value.keyCode === 13) {
            this.handleSubmit();
        }
    }

    render() {
        const { form, formErrors } = this.state;
        const isVisible = this.state.isVisible;
        return (
            <div>


                <div className="login-page">
                    <div className="login-view">
                        <div className="login-card">

                            <div className="login-logo-view">
                                <img src={logo} alt="Perinatal Access Logo" className="logo-image" />
                            </div>

                            <div className="login-card-view" >

                                <div className="card-header">
                                    LOGIN
                            </div>

                                <div className='form-view'>
                                    <FormControl className='form-controls' >
                                        <InputLabel className="form-label">EMAIL ID</InputLabel>
                                        <Input className='text-fields'
                                            type="text"
                                            name="email"
                                            value={form.email} required
                                            endAdornment={
                                                < InputAdornment className='field-icon' position="end">
                                                    <PersonOutlineIcon className='field-icon' />
                                                </InputAdornment>
                                            }
                                            onChange={this.handleChange}
                                            onBlur={this.handleChange}
                                        />
                                        {formErrors.email && (
                                            <span className="err">{formErrors.email}</span>
                                        )}
                                    </FormControl>

                                    <FormControl className='form-controls'>
                                        <InputLabel className="form-label">PASSWORD</InputLabel>
                                        <Input className='text-fields'
                                            type={this.state.passwordType}
                                            name="password"
                                            value={form.password} required
                                            endAdornment={
                                                < InputAdornment className='field-icon' position="end" onClick={this.handlePassword}>
                                                    {isVisible
                                                        ? <span><Visibility className='field-icon' /></span>
                                                        : <span><VisibilityOffIcon className='field-icon' /> </span>
                                                    }
                                                </InputAdornment>
                                            }
                                            onChange={this.handleChange}
                                            onBlur={this.handleChange}
                                            onKeyDown={this.handleKeyDown}
                                        />
                                        {formErrors.password && (
                                            <span className="err">{formErrors.password}</span>
                                        )}
                                    </FormControl>
                                </div>

                                <div className='forgot-link-view' >
                                    <span className="forgot-link"
                                        onClick={() => this.props.history.push('/forgot-password')}
                                    >Forgot Password?</span>
                                </div>

                                <div className="login-button-view">
                                    <Button disabled={this.state.loginDisabled} className="login-button" onClick={this.handleSubmit}>Login</Button>
                                </div>

                                <div className="signup-view">
                                    <p className="signup">Don't have an account? <span className="signup-link" onClick={() => this.props.history.push('/create-account')}
                                    >SIGN UP</span></p>
                                </div>

                            </div>

                        </div>
                    </div>

                </div >
            </div>

        )
    }
}

const mapDispachToProps = dispatch => {
    return {
        sendUserStatus: (data) => dispatch({ type: "USER_STATUS", value: data }),
    };
};
export default connect(null, mapDispachToProps)(Loginpage)
