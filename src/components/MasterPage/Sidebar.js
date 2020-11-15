import React, { Component } from 'react';
import { Typography, ListItem, List, ListItemAvatar } from '@material-ui/core';
import logo from '../../static/assets/logo.png';
import sidebar from '../../static/assets/sidebar-bg.png';
import { NavLink } from 'react-router-dom';
import '../../static/styles/Sidebar.css';
import PersonOutlineIcon from '@material-ui/icons/PersonOutline';
import AddCircleOutlineIcon from '@material-ui/icons/AddCircleOutline';
import StorageConfiguration from '../../services/StorageConfiguration';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import SearchIcon from '@material-ui/icons/Search';
import WhatsAppIcon from '@material-ui/icons/WhatsApp';

export default class Sidebar extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isloggedIn: StorageConfiguration.sessionGetItem(StorageConfiguration.isloggedIn)
        };
    }

    componentDidMount() {
        var res = window.location.href.split("/");
        if (res[3] === 'all-physicians') {
            let activeElement = document.getElementById('my-clinic');
            if (activeElement) {
                activeElement.classList.add("activeLink");
            }
        }
        if (res[3] === 'change-password') {
            let activeElement = document.getElementById('my-account');
            if (activeElement) {
                activeElement.classList.add("activeLink");
            }
        }
    }

    render() {
        var role = Number(StorageConfiguration.sessionGetItem('role'));
        return (
            <div>
                <div className="sidenav" style={{ background: '#FFF', zIndex: '1 !important', backgroundImage: `url(${sidebar})`, height: '100%', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center' }} >
                    <div className='sidebar-logo-view'>
                        <NavLink to="/my-clinic">
                            <img alt='no_image' src={logo} className="sidebar-logo"></img>
                        </NavLink>
                    </div>

                    <div >
                        <List  >
                            <div>
                                {role !== 2 ?
                                    <div>
                                        <NavLink id="my-clinic" to="/my-clinic" exact activeClassName="activeLink">
                                            <ListItem button>
                                                <div className="sidenav-card sidebar-content" >
                                                    <ListItemAvatar>
                                                        <div className="sidebar-icon-outer">
                                                            <AddCircleOutlineIcon className="not-active-link sidebar-icons" />
                                                        </div>
                                                    </ListItemAvatar>
                                                    <Typography className="sidenav-title sidebar-title" style={{ fontSize: '14px' }} variant="subtitle1"> MY CLINIC </Typography>
                                                </div>
                                            </ListItem>
                                        </NavLink>
                                        <div className="sidebar-border">
                                            <div className="sidebar-border-line"> </div>
                                        </div>
                                    </div>
                                    :
                                    ''
                                }

                                {role === 2 ?
                                    <div>
                                        < NavLink to="/all-physicians" exact activeClassName="activeLink">
                                            <ListItem button  >
                                                <div className="sidenav-card sidebar-content" >
                                                    <ListItemAvatar>
                                                        <div className="sidebar-icon-outer">
                                                            <i className="fa fa-stethoscope not-active-link sidebar-icons"></i>
                                                        </div>
                                                    </ListItemAvatar>
                                                    <Typography className="sidenav-title sidebar-title" style={{ fontSize: '14px' }} variant="subtitle1"> PHYSICIANS </Typography>
                                                </div>
                                            </ListItem>
                                        </NavLink>
                                        <div className="sidebar-border">
                                            <div className="sidebar-border-line"> </div>
                                        </div>
                                    </div>
                                    :
                                    ''
                                }

                                {role === 4 || role === 7 ?
                                    <div>
                                        <NavLink to="/external-clinic" exact activeClassName="activeLink">
                                            <ListItem button>
                                                <div className="sidenav-card sidebar-content" >
                                                    <ListItemAvatar>
                                                        <div className="sidebar-icon-outer">
                                                            <SearchIcon className="not-active-link sidebar-icons" />
                                                        </div>
                                                    </ListItemAvatar>
                                                    <Typography className="sidenav-title sidebar-title" style={{ fontSize: '14px' }} variant="subtitle1"> SEARCH CLINICS </Typography>
                                                </div>
                                            </ListItem>
                                        </NavLink>
                                        <div className="sidebar-border">
                                            <div className="sidebar-border-line"> </div>
                                        </div>
                                    </div>
                                    :
                                    ''
                                }

                                {role === 4 || role === 7 ?
                                    <div>
                                        <NavLink to="/request-list" exact activeClassName="activeLink">
                                            <ListItem button>
                                                <div className="sidenav-card sidebar-content" >
                                                    <ListItemAvatar>
                                                        <div className="sidebar-icon-outer">
                                                            <ImportExportIcon className="not-active-link sidebar-icons" />
                                                        </div>
                                                    </ListItemAvatar>
                                                    <Typography className="sidenav-title sidebar-title" style={{ fontSize: '14px' }} variant="subtitle1"> REQUEST LIST </Typography>
                                                </div>
                                            </ListItem>
                                        </NavLink>
                                        <div className="sidebar-border">
                                            <div className="sidebar-border-line"> </div>
                                        </div>
                                    </div>
                                    :
                                    ''
                                }

                                <NavLink to="/call-history" exact activeClassName="activeLink">
                                    <ListItem button>
                                        <div className="sidenav-card sidebar-content" >
                                            <ListItemAvatar>
                                                <div className="sidebar-icon-outer">
                                                    <WhatsAppIcon className="not-active-link sidebar-icons" />
                                                </div>
                                            </ListItemAvatar>
                                            <Typography className="sidenav-title sidebar-title" style={{ fontSize: '14px' }} variant="subtitle1"> CALL HISTORY </Typography>
                                        </div>
                                    </ListItem>
                                </NavLink>
                                <div className="sidebar-border">
                                    <div className="sidebar-border-line"> </div>
                                </div>


                                <NavLink id="my-account" to="/my-account" exact activeClassName="activeLink">
                                    <ListItem button>
                                        <div className="sidenav-card sidebar-content" >
                                            <ListItemAvatar>
                                                <div className="sidebar-icon-outer">
                                                    <PersonOutlineIcon className="not-active-link sidebar-icons" />
                                                </div>
                                            </ListItemAvatar>
                                            <Typography className="sidenav-title sidebar-title" style={{ fontSize: '14px' }} variant="subtitle1"> MY ACCOUNT </Typography>
                                        </div>
                                    </ListItem>
                                </NavLink>
                                <div className="sidebar-border">
                                    <div className="sidebar-border-line"> </div>
                                </div>

                            </div>
                        </List>
                    </div>
                </div>
            </div >
        )
    }
}
