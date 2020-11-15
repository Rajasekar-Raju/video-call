import React from 'react';
import { FormControl } from '@material-ui/core'
import { Button } from '@material-ui/core'
import '../../static/styles/ChangePassword.css';
import Header from '../MasterPage/Header';
import Sidebar from '../MasterPage/Sidebar';
import Notify, { AlertTypes } from '../../services/Notify';
import Environments from '../../services/Environments';
import Footer from '../MasterPage/Footer'
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';

export class ChangePassword extends React.Component {

    constructor() {
        super();
        this.state = {
            isOldVisible: false,
            isNewVisible: false,
            isConfirmVisible: false,
            oldPasswordType: 'password',
            newPasswordType: 'password',
            confirmPasswordType: 'password',
            form: {
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            },
            formErrors: {
                oldPassword: null,
                newPassword: null,
                confirmPassword: null,
            }
        };
    }


    validateField = (name, value, refValue) => {
        let errorMsg = null;
        switch (name) {
            case "oldPassword":
                if (!value) errorMsg = "Please enter old password.";
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
        let changePasswordModel = {
            old_password: form.oldPassword,
            password: form.newPassword,
            confirm_password: form.confirmPassword,
        }
        const postChangePassword = Environments.postAPI('change-password', changePasswordModel)
        if (changePasswordModel.password === changePasswordModel.confirm_password) {
            postChangePassword.then(res => {
                let message = res.data.msg;
                if (res.data.error) {
                    Notify.sendNotification(message, AlertTypes.error);
                }
                else {
                    Notify.sendNotification(message, AlertTypes.success);
                    this.props.history.push('/login');
                }
            }).catch(err => {
                console.log('err', err);
            });
        }
        else {
            Notify.sendNotification('New password and confirm password are not matched.', AlertTypes.error);
        }
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

    handleOldPassword = () => {
        this.setState({ isOldVisible: !this.state.isOldVisible });
        if (this.state.isOldVisible === true) {
            this.setState({ oldPasswordType: 'password' });
        }
        if (this.state.isOldVisible === false) {
            this.setState({ oldPasswordType: 'text' });
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

    handleConfirmPassword = () => {
        this.setState({ isConfirmVisible: !this.state.isConfirmVisible });
        if (this.state.isConfirmVisible === true) {
            this.setState({ confirmPasswordType: 'password' });
        }
        if (this.state.isConfirmVisible === false) {
            this.setState({ confirmPasswordType: 'text' });
        }
    };

    render() {
        const { form, formErrors } = this.state;
        const isOldVisible = this.state.isOldVisible;
        const isNewVisible = this.state.isNewVisible;
        const isConfirmVisible = this.state.isConfirmVisible;
        return (

            <div>
                <Sidebar />

                <div className="layout-style">
                    <Header />
                    <div className="header-style">
                        <div>
                            <p className="page-title">MY ACCOUNT / CHANGE PASSWORD</p>
                        </div>

                        <div className="page-top-content">
                            <div className="page-content">
                                <div className="row">
                                    <div className="col-sm">
                                        <FormControl className="col-sm form-field-style" variant="filled">
                                            <label>
                                                Old Password:<span className="asterisk">*</span>
                                            </label>
                                            <div className="input-group">
                                                <input className="form-control input-field-style"
                                                    type={this.state.oldPasswordType}
                                                    name="oldPassword"
                                                    value={form.oldPassword}
                                                    onChange={this.handleChange}
                                                    onBlur={this.handleChange}
                                                    required
                                                />
                                                <div className="input-group-append">
                                                    <span className="btn btn-secondary changepaswword-password-button" type="button" onClick={this.handleOldPassword}>
                                                        {isOldVisible
                                                            ? <span><Visibility className='changepaswword-password-icon' /></span>
                                                            : <span><VisibilityOffIcon className='changepaswword-password-icon' /> </span>
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            {formErrors.oldPassword && (
                                                <span className="err">{formErrors.oldPassword}</span>
                                            )}
                                        </FormControl>
                                    </div>
                                    <div className="col-sm">
                                        <FormControl className="col-sm form-field-style">
                                            <label>
                                                New Password:<span className="asterisk">*</span>
                                            </label>
                                            <div className="input-group">
                                                <input className="form-control input-field-style"
                                                    type={this.state.newPasswordType}
                                                    name="newPassword"
                                                    value={form.newPassword}
                                                    onChange={this.handleChange}
                                                    onBlur={this.handleChange}
                                                    required
                                                />
                                                <div className="input-group-append">
                                                    <span className="btn btn-secondary changepaswword-password-button" type="button" onClick={this.handleNewPassword}>
                                                        {isNewVisible
                                                            ? <span><Visibility className='changepaswword-password-icon' /></span>
                                                            : <span><VisibilityOffIcon className='changepaswword-password-icon' /> </span>
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            {formErrors.newPassword && (
                                                <span className="err">{formErrors.newPassword}</span>
                                            )}
                                        </FormControl>
                                    </div>
                                    <div className="col-sm">
                                        <FormControl className="col-sm form-field-style">
                                            <label>
                                                Confirm Password:<span className="asterisk">*</span>
                                            </label>

                                            <div className="input-group">
                                                <input className="form-control input-field-style"
                                                    type={this.state.confirmPasswordType}
                                                    name="confirmPassword"
                                                    value={form.confirmPassword}
                                                    onChange={this.handleChange}
                                                    onBlur={this.handleChange}
                                                    required
                                                />
                                                <div className="input-group-append">
                                                    <span className="btn btn-secondary changepaswword-password-button" type="button" onClick={this.handleConfirmPassword}>
                                                        {isConfirmVisible
                                                            ? <span><Visibility className='changepaswword-password-icon' /></span>
                                                            : <span><VisibilityOffIcon className='changepaswword-password-icon' /> </span>
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            {formErrors.confirmPassword && (
                                                <span className="err">{formErrors.confirmPassword}</span>
                                            )}
                                        </FormControl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="update-button-align">
                            <Button mat-button="true" className="update-button" onClick={this.handleSubmit}>UPDATE </Button>
                        </div>

                    </div>
                </div>
                <Footer />
            </div>

        )
    }
}


export default ChangePassword
