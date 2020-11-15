import axios from 'axios';
import StorageConfiguration from './StorageConfiguration'

axios.defaults.baseURL = process.env.REACT_APP_API_URL;
const AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
})

AxiosInstance.interceptors.request.use(async (config) => {
  let token = StorageConfiguration.sessionGetItem('token');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
    return config
  }
  else {
    return config
  }
})

export default AxiosInstance