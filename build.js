import 'whatwg-fetch';//fetch polifill
import 'promise-polyfill/src/polyfill';
import './src/findIndex';
import BesAjaxRequest from './src/ajax.js';
window.BesAjaxRequest = BesAjaxRequest;