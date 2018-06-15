import EventListener from './event';
import log from './log';
import np from './np';
import {Task} from './task';

function BesRequest(fetchopt, opt) {
    EventListener.call(this);
    this.fetchoptions = fetchopt || {};
    this.options = opt || {};
    this.fetchoptions.headers = new Headers((fetchopt) ? fetchopt.headers : {})
    this._onsuccess = function(res) {};
    this._onerror = function(res) {};
    this.validateUrl();
    Object.defineProperties(this, {
        'onsuccess': {
            get: function() { return this._onsuccess },
            set: function(fn) {
                let origin = this._onsuccess;
                let newone = function(res) {
                    origin.call(this, res);
                    fn.call(this, res)
                }
                this._onsuccess = newone;
            }
        },
        'onerror': {
            get: function() { return this._onerror },
            set: function(fn) {
                let origin = this._onerror;
                let newone = function(res) {
                    origin.call(this, res);
                    fn.call(this, res)
                }
                this._onerror = newone;
            }
        },
    })
}
BesRequest.prototype = Object.create(EventListener.prototype);
BesRequest.prototype.constructor = BesRequest;
//clone 會copy原先的options,產生新的BesRequest物件
BesRequest.prototype.clone = function() {
    let originFetchOpt = {};
    let originOpt = {};
    for (let i in this.fetchoptions) {
        originFetchOpt[i] = this.fetchoptions[i]
    }
    for (let i in this.options) {
        originOpt[i] = this.options[i]
    }
    let clone = new BesRequest(originFetchOpt, originOpt);
    clone.onsuccess = this.onsuccess;
    clone.onerror = this.onerror;
    return clone;
}
BesRequest.prototype.validateUrl = function() {
    if (!this.fetchoptions)
        return;
    if (this.fetchoptions.host) {
        var lre = /\/$/;
        if (!lre.test(this.fetchoptions.host))
            this.fetchoptions.host += '/'
    }
    if (this.fetchoptions.path) {
        var lre = /\/$/;
        var fre = /^\//;
        if (fre.test(this.fetchoptions.path))
            this.fetchoptions.path = this.fetchoptions.path.slice(1, this.fetchoptions.length)
        if (lre.test(this.fetchoptions.path))
            this.fetchoptions.path = this.fetchoptions.path.slice(0, this.fetchoptions.length - 1)
    }
    if (this.fetchoptions.query) {
        var fre = /^\?/;
        if (!fre.test(this.fetchoptions.query))
            this.fetchoptions.query = '?' + this.fetchoptions.query;
    }
}
//extend : 先clone, 加上新的options或修改舊的options
BesRequest.prototype.extend = function(newfetchopt, newopt) {
    let clone = this.clone();
    if (newfetchopt) {
        for (let i in newfetchopt) {
            if (i !== 'headers')
                clone.fetchoptions[i] = newfetchopt[i]
        }
        for (let h in newfetchopt.headers) {
            clone.fetchoptions.headers.append(h, newfetchopt.headers[h])
        }
    }
    if (newopt) {
        for (let i in newopt) {
            clone.options[i] = newopt[i]
        }
    }
    clone.validateUrl()
    return clone
}
BesRequest.prototype.send = function() {
    log('BesRequest', 'Besrequest.send()')
    const task = new Task(this.fetchoptions, this.options);
    const me = this;
    np.taskPool.addTask(task)
    return new Promise(function(resolve, reject) {
        task.on('done', function(status, res) {
            task.status = 'done'
            if (status === 'success') {
                //if 共同成功回呼...
                np.successHandler(res, task.options.name)
                me._onsuccess(res)
                resolve(res)
            } else if (status === 'fail') {
                //共同失敗處理
                np.errorHandler(res, task.options.name)
                me._onerror(res)
                reject(res)
            }
            log('Task', 'task ' + task.options.name + ' done.')
            if (task.atWaitingPool) {
                let index = np.taskPool.waitingPool.findIndex(function(t) {
                    return t.id === task.id;
                })
                np.taskPool.waitingPool.splice(index, 1)
            } else {
                np.taskPool.clean(task.id, task.options.name)
            }
        })
    })
}

export default BesRequest;