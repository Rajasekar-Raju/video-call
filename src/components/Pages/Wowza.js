import React, { Component } from 'react'
import ReactPlayer from 'react-player';

export default class Wowza extends Component {

    constructor() {
        super();
        this.state = {
        };
    }

    componentDidMount() {
        console.log(this.props);
        console.log(localStorage.getItem('wowza'));
    }


    render() {

        return (

            <div className='main-view'>

                <ReactPlayer width='inherit' height='fit-content' url={localStorage.getItem('wowza')} controls autoPlay />

            </div >
        )
    }
}
