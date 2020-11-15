import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import './index.css';
import App from './app/App'
import * as serviceWorker from './serviceWorker';
import configureStore from './store/configureStore';
import { signalRRegistrationMiddleware, signalRRegisterCommands } from './store/middleware/SignalRegisteration';


const store = configureStore();

signalRRegistrationMiddleware(store);
signalRRegisterCommands(store);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root")
);

serviceWorker.unregister();
