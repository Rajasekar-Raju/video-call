import React, { Component } from 'react'
import '../../static/styles/ResetPassword.css';
import logo from '../../static/assets/logo.png';
import { Button, FormControl, Input, InputAdornment, InputLabel } from '@material-ui/core'
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import Notify, { AlertTypes } from '../../services/Notify';
import Environments from '../../services/Environments';

export class ResetPassword extends Component {
    constructor() {
        super();
        this.state = {
            isConfirmVisible: false,
            isNewVisible: false,
            newPasswordType: 'password',
            confirmPasswordType: 'password',
            form: {
                code: '',
                newPassword: '',
                confirmPassword: ''
            },
            formErrors: {
                code: null,
                newPassword: null,
                confirmPassword: null
            }
        };
    }

    validateField = (name, value, refValue) => {
        let errorMsg = null;
        switch (name) {
            case "code":
                if (!value) errorMsg = "Please enter secret code.";
                break;
            case "newPassword":
                if (!value) errorMsg = "Please enter new password.";
                break;
            case "confirmPassword":
                if (!value) errorMsg = "Please enter confirm password.";
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
            if (x === "newPassword") {
                refValue = form[x = "newPassword"];
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
        const resetModel = {
            code: form.code,
            password_confirmation: form.newPassword,
            password: form.confirmPassword
        }
        const postLogin = Environments.postAPI('reset-password', resetModel)
        postLogin.then(res => {
            let message = res.data.msg;
            if (res.data.error !== undefined) {
                let toastvalue = 'Please check the followings ';
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
                this.props.history.push('/login');
                Notify.sendNotification(message, AlertTypes.success);
            }
        }).catch(err => {
            console.log('err', err);
            Notify.sendNotification('Invalid credentials.', AlertTypes.error);
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
            if (name === "newPassword" || name === "confirmPassword") {
                let refValue = this.state.form[
                    "newPassword"
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

    handleConfirmPassword = () => {
        this.setState({ isConfirmVisible: !this.state.isConfirmVisible });
        if (this.state.isConfirmVisible === true) {
            this.setState({ confirmPasswordType: 'password' });
        }
        if (this.state.isConfirmVisible === false) {
            this.setState({ confirmPasswordType: 'text' });
        }
    };

    handleNewPassword = () => {
        this.setState({ isNewVisible: !this.state.isNewVisible });
        if (this.state.isNewVisible === true) {
            this.setState({ newPasswordType: 'password' });
        }
        if (this.state.isNewVisible === false) {
            this.setState({ newPasswordType: 'text' });
        }
    };

    handleKeyDown = (value) => {
        if (value.keyCode === 13) {
            this.handleSubmit();
        }
    }

    render() {
        const { form, formErrors } = this.state;
        const isConfirmVisible = this.state.isConfirmVisible;
        const isNewVisible = this.state.isNewVisible;
        return (
            <div className="login-page">
                <div className="login-view">
                    <div className="reset-card">

                        <div className="reset-logo-view">
                            <img src={logo} alt="Perinatal Access Logo" className="logo-image" />
                        </div>

                        <div className="reset-card-view" >

                            <div className="card-header">
                                RESET PASSWORD
                        </div>

                            <div className='form-view'>

                                <FormControl className='form-controls' >
                                    <InputLabel className="form-label">SECRET CODE</InputLabel>
                                    <Input className='text-fields'
                                        type="text"
                                        name="code"
                                        value={form.code} required

                                        onChange={this.handleChange}
                                        onBlur={this.handleChange}
                                    />
                                    {formErrors.code && (
                                        <span className="err">{formErrors.code}</span>
                                    )}
                                </FormControl>


                                <FormControl className='form-controls'>
                                    <InputLabel className="form-label">NEW PASSWORD</InputLabel>
                                    <Input className='text-fields'
                                        type={this.state.newPasswordType}
                                        name="newPassword"
                                        value={form.newPassword} required
                                        endAdornment={
                                            < InputAdornment position="end" onClick={this.handleNewPassword} className='field-icon'>
                                                {isNewVisible
                                                    ? <span><Visibility className='field-icon' /></span>
                                                    : <span><VisibilityOffIcon className='field-icon' /> </span>
                                                }
                                            </InputAdornment>
                                        }
                                        onChange={this.handleChange}
                                        onBlur={this.handleChange}
                                    />
                                    {formErrors.newPassword && (
                                        <span className="err">{formErrors.newPassword}</span>
                                    )}
                                </FormControl>

                                <FormControl className='form-controls'>
                                    <InputLabel className="form-label">CONFIRM PASSWORD</InputLabel>
                                    <Input className='text-fields'
                                        type={this.state.confirmPasswordType}
                                        name="confirmPassword"
                                        value={form.confirmPassword} required
                                        onChange={this.handleChange}
                                        onBlur={this.handleChange}
                                        onKeyDown={this.handleKeyDown}
                                        endAdornment={
                                            <InputAdornment position="end" onClick={this.handleConfirmPassword} className='field-icon'>
                                                {isConfirmVisible
                                                    ? <span><Visibility className='field-icon' /></span>
                                                    : <span><VisibilityOffIcon className='field-icon' /> </span>
                                                }
                                            </InputAdornment>
                                        }
                                    />
                                    {formErrors.confirmPassword && (
                                        <span className="err">{formErrors.confirmPassword}</span>
                                    )}
                                </FormControl>

                            </div>

                            <div className="button-view button-style">
                                <Button className="reset-button" onClick={this.handleSubmit}>Submit</Button>
                            </div>

                            <div className="signup-view">
                                <p className="signup">Back to <span className="signup-link" onClick={() => this.props.history.push('/login')}
                                >SIGN IN</span></p>
                            </div>

                        </div>

                    </div>
                </div>
            </div >
        )
    }
}

export default ResetPassword
