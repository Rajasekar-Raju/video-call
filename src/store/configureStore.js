import {createStore, applyMiddleware} from 'redux';
import {createLogger} from 'redux-logger';
import appReducer from './reducer/AppReducer';
import{ signalRInvokeMiddleware } from './middleware/SignalRegisteration';

var logger = createLogger({
    collapsed : true
});

const configureStore = () => 
    createStore(
    appReducer, 
    applyMiddleware(logger,signalRInvokeMiddleware)
    );

export default configureStore;