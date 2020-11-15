import React from 'react';
import '../../static/styles/CreateAccount.css';
import logo from '../../static/assets/logo.png';
import { FormControl, Button } from '@material-ui/core'
import Notify, { AlertTypes } from '../../services/Notify';
import Environments from '../../services/Environments';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOffIcon from '@material-ui/icons/VisibilityOff';
import ReactSelect from "react-select";

class CreateAccount extends React.Component {

    constructor() {
        super();
        this.state = {
            isVisible: false,
            passwordType: 'password',
            form: {
                firstName: '',
                lastName: '',
                speciality: '',
                email: '',
                mobile: '',
                userName: '',
                location: '',
                password: '',
                type: ''
            },
            formErrors: {
                firstName: null,
                lastName: null,
                speciality: null,
                email: null,
                mobile: null,
                userName: null,
                location: null,
                password: null,
                type: ''
            }
        };
        this.roles = [
            { value: 'external', label: 'Physician' },
            { value: 'external_technician', label: 'Sonographer' }
        ];
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
                if (!value) errorMsg = "Please enter mobile number.";
                else if (
                    !/^(\+\d{1,3}[- ]?)?\d{10}$/.test(
                        value
                    )
                )
                    errorMsg = "Please enter valid 10 digit mobile number.";
                break;
            case "userName":
                if (!value) errorMsg = "Please enter user name.";
                break;
            case "location":
                if (!value) errorMsg = "Please enter location.";
                break;
            case "password":
                if (!value) errorMsg = "Please enter password.";
                break;
            case "type":
                if (!value) errorMsg = "Please enter role.";
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
        const registerModel = {
            first_name: form.firstName,
            last_name: form.lastName,
            email: form.email,
            contact_no: form.mobile,
            username: form.userName,
            password: form.password,
            confirm_password: form.password,
            type: form.type,
            speciality: form.speciality,
            lat: '',
            long: '',
            location_name: form.location
        }
        const postLogin = Environments.postAPI('register', registerModel)
        postLogin.then(res => {
            let message = res.data.msg;
            if (res.data.error !== undefined) {
                let toastvalue = 'Please Check the Followings ';
                const type = this.typeCheck(res.data.error);
                if (type === 'Array') {
                    for (const element of res.data.error) {
                        var i = 1;
                        for (const fields in element) {
                            toastvalue += i + '. ' + element[fields];
                            i++
                        }
                    }
                }
                else {
                    for (let value of Object.values(res.data.error)) {
                        toastvalue = value;
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
        });
    };

    typeCheck(Source) {
        if (Source != null) {
            if (Source.constructor === Array) {
                return 'Array';
            } else if (Source.constructor === Object) {
                return 'object';
            } else if (Source.constructor === String) {
                return 'string';
            } else if (Source.constructor === Date) {
                return 'Date';
            } else if (Source.constructor === Number) {
                return 'Number';
            }
        }
    }

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

    keyPress = (value) => {
        const pattern = /[0-9]/;
        let inputChar = String.fromCharCode(value.charCode);
        if (value.keyCode !== 8 && !pattern.test(inputChar)) {
            value.preventDefault();
        }
    }

    render() {
        const isVisible = this.state.isVisible;
        const { form, formErrors } = this.state;
        return (
            <div className="create-page">
                <div className="create-view">
                    <div className="create-card">

                        <div className="create-account-logo-view">
                            <img src={logo} alt="Perinatal Access Logo" className="create-logo-image" />
                        </div>

                        <div className="card-view-1">
                            <div className="row">
                                <div className="col-sm header-font column-view-1">
                                    CREATE ACCOUNT
                            </div>
                                <div className="col-sm header-font column-view-2">
                                    <p>Already Registered? <span className="signin-link" onClick={() => this.props.history.push('/login')}>
                                        <span className="signin-text" style={{ textDecoration: 'underline', marginRight: '12px' }}>SIGN IN</span></span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card-view-2">
                            <div className="container content-view">
                                <div className="row">
                                    <FormControl className="col-sm" id='form-fields'>
                                        <label className="create-account-label">
                                            FIRST NAME<span className="asterisk">*</span>
                                        </label>
                                        <input label="FIRST NAME"
                                            type="text"
                                            name="firstName"
                                            value={form.firstName} required
                                            onChange={this.handleChange}
                                            onBlur={this.handleChange}
                                        />
                                        {formErrors.firstName && (
                                            <span className="err">{formErrors.firstName}</span>
                                        )}
                                    </FormControl>
                                    <FormControl className="col-sm" id='form-fields'>
                                        <label className="create-account-label">
                                            LAST NAME<span className="asterisk">*</span>
                                        </label>
                                        <input label="LAST NAME"
                                            type="text"
                                            name="lastName"
                                            value={form.lastName} required
                                            onChange={this.handleChange}
                                            onBlur={this.handleChange}
                                        />
                                        {formErrors.lastName && (
                                            <span className="err">{formErrors.lastName}</span>
                                        )}
                                    </FormControl>
                                </div>

                                <div className="row">
                                    <FormControl className="col-sm" id='form-fields'>
                                        <label className="create-account-label">
                                            SPECIALITY<span className="asterisk">*</span>
                                        </label>
                                        <input label="SPECIALITY"
                                            type="text"
                                            name="speciality"
                                            value={form.speciality} required
                                            onChange={this.handleChange}
                                            onBlur={this.handleChange}
                                        />
                                        {formErrors.speciality && (
                                            <span className="err">{formErrors.speciality}</span>
                                        )}
                                    </FormControl>
                                    <FormControl className="col-sm" id='form-fields'>
                                        <label className="create-account-label">
                                            EMAIL ADDRESS<span className="asterisk">*</span>
                                        </label>
                                        <input label="EMAIL ADDRESS"
                                            type="text"
                                            name="email"
                                            value={form.email} required
                                            onChange={this.handleChange}
                                            onBlur={this.handleChange}
                                        />
                                        {formErrors.email && (
                                            <span className="err">{formErrors.email}</span>
                                        )}
                                    </FormControl>
                                </div>

                                <div className="row">
                                    <FormControl className="col-sm" id='form-fields'>
                                        <label className="create-account-label">
                                            MOBILE NUMBER<span className="asterisk">*</span>
                                        </label>
                                        <input label="MOBILE NUMBER" onKeyPress={this.keyPress}
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
                                    <FormControl className="col-sm" id='form-fields'>
                                        <label className="create-account-label">
                                            USER NAME<span className="asterisk">*</span>
                                        </label>
                                        <input label="USER NAME"
                                            type="text"
                                            name="userName"
                                            value={form.userName} required
                                            onChange={this.handleChange}
                                            onBlur={this.handleChange}
                                        />
                                        {formErrors.userName && (
                                            <span className="err">{formErrors.userName}</span>
                                        )}
                                    </FormControl>
                                </div>

                                <div className="row">
                                    <FormControl className="col-sm" id='form-fields'>
                                        <label className="create-account-label">
                                            LOCATION<span className="asterisk">*</span>
                                        </label>
                                        <input label="LOCATION"
                                            type="text"
                                            name="location"
                                            value={form.location} required
                                            onChange={this.handleChange}
                                            onBlur={this.handleChange}
                                        />
                                        {formErrors.location && (
                                            <span className="err">{formErrors.location}</span>
                                        )}
                                    </FormControl>
                                    <div className="col-sm">
                                        <FormControl className="col-sm form-field-style">
                                            <label className="create-account-label" style={{ marginTop: '9px', marginBottom: '0px' }}>
                                                CREATE PASSWORD<span className="asterisk">*</span>
                                            </label>
                                            <div className="input-group">
                                                <input label="CREATE PASSWORD" style={{ border: '0', outline: '0', borderBottom: '1px solid #2c5566', paddingLeft: '0px', borderRadius: '0px' }} className="form-control input-field-style"
                                                    type={this.state.passwordType}
                                                    name="password"
                                                    value={form.password} required
                                                    onChange={this.handleChange}
                                                    onBlur={this.handleChange}
                                                />
                                                <div className="input-group-append">
                                                    <button style={{ border: '0', outline: '0', borderBottom: '1px solid #2c5566' }} className="btn btn-secondary changepaswword-password-button" type="button" onClick={this.handlePassword}>
                                                        {isVisible
                                                            ? <span><Visibility className='changepaswword-password-icon' /></span>
                                                            : <span><VisibilityOffIcon className='changepaswword-password-icon' /> </span>
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                            {formErrors.password && (
                                                <span className="err">{formErrors.password}</span>
                                            )}
                                        </FormControl>
                                    </div>
                                </div>

                                <div className="row">
                                    <FormControl className="col-sm-6 role-dropdown">
                                        <label className="create-account-label">
                                            ROLE<span className="asterisk">*</span>
                                        </label>
                                        <ReactSelect
                                            name="type"
                                            options={this.roles}
                                            value={this.roles.find(x => x.value === form.type)}
                                            onChange={e =>
                                                this.handleChange({
                                                    target: {
                                                        name: "type",
                                                        value: e.value
                                                    }
                                                })
                                            }
                                        />
                                        {formErrors.type && (
                                            <span className="err">{formErrors.type}</span>
                                        )}
                                    </FormControl>
                                </div>

                            </div>
                            <div className="button-view button-style">
                                <Button className="register-button" onClick={this.handleSubmit}>Register</Button>
                            </div>

                        </div>

                    </div>
                </div>
            </div>

        )
    }
}

export default CreateAccount
