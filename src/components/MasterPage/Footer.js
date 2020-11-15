import React, { Component } from 'react'
import '../../static/styles/Footer.css'

export default class Footer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            today: new Date()
        };
    }
    render() {
        return (
            <div>

                <div className="footer">Copyright &copy; {this.state.today.getFullYear()} Perinatal Access, Inc. </div>

            </div>
        )
    }
}

