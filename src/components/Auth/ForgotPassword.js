import React from 'react';
import '../../static/styles/ForgotPassword.css';
import logo from '../../static/assets/logo.png';
import { FormControl, Input, InputAdornment, InputLabel, Button } from '@material-ui/core'
import MailOutlineIcon from '@material-ui/icons/MailOutline';
import Notify, { AlertTypes } from '../../services/Notify';
import Environments from '../../services/Environments';

class ForgotPassword extends React.Component {

    constructor() {
        super();
        this.state = {
            form: {
                email: '',
            },
            formErrors: {
                email: null,
            }
        };
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
            default:
                break;
        }
        return errorMsg;
    };

    validateForm = (form, formErrors, validateFunc) => {
        const errorObj = {};
        Object.keys(formErrors).map(x => {
            let refValue = null;
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
        let forgotPasswordModel = {
            email: form.email,
        }
        const postLogin = Environments.postAPI('forgot-password', forgotPasswordModel)
        postLogin.then(res => {
            let message = res.data.msg;
            if (res.data.error) {
                Notify.sendNotification(message, AlertTypes.error);
            }
            else {
                Notify.sendNotification(message, AlertTypes.success);
            }
        }).catch(err => {
            console.log('err', err);
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
            const errorMsg = this.validateField(
                name,
                value
            );
            formErrorsObj = { ...formErrors, [name]: errorMsg };
            this.setState({ formErrors: formErrorsObj });
        });
    };

    handleKeyDown = (value) => {
        if (value.keyCode === 13) {
            this.handleSubmit();
        }
    }

    render() {
        const { form, formErrors } = this.state;
        return (
            <div className="login-page">
                <div className="login-view">
                    <div className="forgot-card">

                        <div className="forgot-logo-view">
                            <img src={logo} alt="Perinatal Access Logo" className="logo-image" />
                        </div>

                        <div className="forgot-view">

                            <div>
                                <div className="card-header">
                                    FORGOT PASSWORD
                                </div>
                            </div>

                            <div className='form-view'>
                                <FormControl className='form-controls'>
                                    <InputLabel className="form-label">EMAIL ADDRESS</InputLabel>
                                    <Input className='text-fields'
                                        name="email"
                                        value={form.email} required
                                        endAdornment={
                                            <InputAdornment position="end">
                                                <span>
                                                    <MailOutlineIcon className='field-icon' />
                                                </span>
                                            </InputAdornment>
                                        }
                                        onChange={this.handleChange}
                                        onBlur={this.handleChange}
                                        onKeyDown={this.handleKeyDown}
                                    />
                                    {formErrors.email && (
                                        <span className="err">{formErrors.email}</span>
                                    )}
                                </FormControl>

                            </div>


                            <div className='forgot-link-view' >
                                <span className="forgot-link"
                                    onClick={() => this.props.history.push('/reset-password')}
                                >Reset Password?</span>
                            </div>

                            <div className="button-view">
                                <Button className="forgot-button" onClick={this.handleSubmit}>Submit</Button>
                            </div>
                            <div className="signin-view" onClick={() => this.props.history.push('/login')}>
                                <p className="signin">Back to <span className="signin-link" >SIGN IN</span></p>
                            </div>

                        </div>

                    </div>
                </div>
            </div>
        )
    }
}

export default ForgotPassword
