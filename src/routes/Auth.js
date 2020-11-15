import StorageConfiguration from '../services/StorageConfiguration'

class Auth {

  login() {
    // this.props.history.push('/all-physicians');
    console.log('login page');
  }

  isAuthenticated() {
    return JSON.parse(StorageConfiguration.sessionGetItem('isloggedIn'));
  }

}

const auth = new Auth()

export default auth;
