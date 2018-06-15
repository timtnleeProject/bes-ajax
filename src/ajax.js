import 'whatwg-fetch';//fetch polifill
import EventListener from './event';
import { Task, TaskPool } from './task';
import BesRequest from './request';
import log from './log';
import np from './np'; //glob Object (BesAjaxObject)

function BesAjaxRequest(glob_arg) {
    if (!glob_arg)
        glob_arg = {}
    np.log = glob_arg.log || false;
    np.poolSize = glob_arg.poolSize || 5;
    np.resolveFirst = glob_arg.resolveFirst || false;
    np.canAbort = (window.AbortController)?true:false;
    np.taskPool = new TaskPool();
    np.errorHandler = function(e) {};
    np.successHandler = function(res) {};
    np.createRequest = function(fetchopt, opt) {
        return new BesRequest(fetchopt, opt);
    }
    np._abort = glob_arg.abort || false;
    Object.defineProperty(np,'abort',{
        get: function(){
            return np._abort
        },
        set:function(val){
            np._abort=val;
            if(np._abort===true&&np.canAbort===false)
                log('BesAjaxRequest','Waring: Your browser doesn\' support Fetch Abortion! BesAjaxRequest will not use abortion.')
        }
    })
    return np;
}

export default BesAjaxRequest;