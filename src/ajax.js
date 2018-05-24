require('whatwg-fetch');

function BesAjaxRequest(glob_arg) {
    const np = new Object();

    function log(title, mes) {
        if (np.log)
            console.log('[' + title + ']:', mes);
    }

    function EventListener() {
        this.listener = {}
    }
    EventListener.prototype.on = function(event, fn) {
        this.listener[event] = fn;
    }
    EventListener.prototype.emit = function() {
        let args = [];
        for (let a in arguments) {
            if (a != 0)
                args.push(arguments[a])
        }
        let fName = arguments[0];
        if (this.listener[fName])
            this.listener[fName].apply(this, args);
    }

    function TaskPool() {
        EventListener.call(this)
        this.exePool = [];
        this.waitingPool = [];
        this.idList = {};

        let me = this;
        this.on('update', function() { //update exe timer
            log('TaskPool', 'Timer update')
            if (me.timer) {
                clearTimeout(me.timer)
            }
            me.timer = setTimeout(function() {
                me.execute();
            }, 0)
        })
    }
    TaskPool.prototype = Object.create(EventListener.prototype);
    TaskPool.prototype.constructor = TaskPool;
    TaskPool.prototype.execute = function() {
        log('TaskPool', 'Execute exePool');
        this.exePool.forEach(function(task) {
            let status = task.status
            if (status === 'init') {
                task.run();
            } else if (status === 'pause') {
                task.run();
            } else if (status === 'ready') {
                task.resolve()
            }
        })
    }
    TaskPool.prototype.getId = function(num) {
        const char = 'qwertasdfgzxcvb1234567890';
        let id = '';
        for (let i = 0; i < num; i++) {
            let index = Math.floor(Math.random() * char.length)
            id += char[index];
        }
        return id;
    }
    TaskPool.prototype.getUniqueId = function(num) {
        let id = this.getId(num);
        while (this.idList[id]) {
            id = this.getId(num)
        }
        this.idList[id] = true
        return id;
    }
    TaskPool.prototype.releaseId = function(id) {
        delete this.idList[id]
    }
    TaskPool.prototype.addTask = function(task) {
        let maxSize = np.poolSize;
        let me = this;
        if (task.id === null) {
            let id = this.getUniqueId(5);
            task.id = id
        }
        //檢查pool大小，加入pool,pool已滿 查看是否primary task 
        if (this.exePool.length < maxSize) {
            this.exePool.push(task)
            log('TaskPool', 'put ' + task.options.name + ' to exePool')
            this.emit('update')
            this.emit('pool')
        } else {
            this.exePool.sort(function(a, b) {
                return b.primary - a.primary;
            })
            if (this.exePool[0].primary > task.primary) {
                let lessPrimaryTask = this.exePool.shift();
                lessPrimaryTask.pause()
                this.waitingPool.push(lessPrimaryTask);
                this.exePool.push(task)
                log('TaskPool', 'put ' + lessPrimaryTask.options.name + ' from exePool to waitingPool')
                log('TaskPool', 'put ' + task.options.name + ' to exePool')
                this.emit('update')
                this.emit('pool')
            } else {
                log('TaskPool', 'put ' + task.options.name + ' to waitingPool')
                this.waitingPool.push(task)
                this.emit('pool')
            }
        }
    }
    TaskPool.prototype.clean = function(id, name) {
        let index = this.exePool.findIndex(function(t) {
            return t.id === id
        })
        // if (index < 0)
        //     console.log('NOT FOUND xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ' + name)
        this.exePool.splice(index, 1)
        this.emit('pool')
        this.releaseId(id)
        this.checkWaiting()
    }
    TaskPool.prototype.checkWaiting = function() {
        log('TaskPool', 'checkWaiting')
        if (this.waitingPool.length > 0) {
            this.waitingPool.sort(function(a, b) {
                return a.primary - b.primary;
            })

            while (this.exePool.length < np.poolSize) {
                let task = this.waitingPool.shift()
                log('TaskPool', 'put ' + task.options.name + ' from waitingPool to exePool')
                this.exePool.push(task)
                this.emit('update')
                this.emit('pool')
            }
        } else {
            log('TaskPool', 'waitingPool is empty')
        }
    }

    function BesRequest(fetchopt, opt) {
        EventListener.call(this);
        this.fetchoptions = fetchopt;
        this.options = opt;
        this.fetchoptions.headers = new Headers(fetchopt.headers)
        this._onsuccess = function() {};
        this._onerror = function() {};
        this.validateUrl();
        Object.defineProperties(this, {
            'onsuccess': {
                get: function() { return this._onsuccess },
                set: function(fn) {
                    let origin = this._onsuccess;
                    let newone = function() {
                        origin.call(this);
                        fn.call(this)
                    }
                    this._onsuccess = newone;
                }
            },
            'onerror': {
                get: function() { return this._onerror },
                set: function(fn) {
                    let origin = this._onerror;
                    let newone = function() {
                        origin.call(this);
                        fn.call(this)
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
                    me._onsuccess()
                    resolve(res)
                } else if (status === 'fail') {
                    //共同失敗處理
                    np.errorHandler(res, task.options.name)
                    me._onerror()
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

    function Task(fetchoptions, options) {
        EventListener.call(this);
        this.fetchoptions = fetchoptions;
        this.options = options;
        this.primary = (options.primary) ? options.primary : 1;
        this.type = options.responseType;
        this.count = 0;
        this.status = 'init';
        this.stop = false;
        this.id = null;
        this.timer = null;
        this.retry = (options.retry) ? options.retry : 0;
        this.sleep = (options.sleep) ? options.sleep : 100;
        this.expofn = options.expofn;
    }
    Task.prototype = Object.create(EventListener.prototype);
    Task.prototype.constructor = Task;
    Task.prototype.resolve = function() {
        this.presolve(this.response)
    }
    Task.prototype.pause = function() {
        this.stop = true;
        clearTimeout(this.timer)
    }
    Task.prototype.run = function() {
        const me = this;
        this.status = 'proccess'
        this.stop = false;
        if (this.expofn && this.count !== 0)
            this.sleep = this.expofn(this.count, this.sleep);
        let promiseStart;
        let url;
        if (me.fetchoptions.url) {
            url = me.fetchoptions.url + (me.fetchoptions.query || '');
        } else {
            url = me.fetchoptions.host + (me.fetchoptions.path || '') + (me.fetchoptions.query || '');
        }
        const fetchPromise = fetch(url, me.fetchoptions);

        if (this.options.timeout) { //設置timeout
            const milsec = this.options.timeout;
            promiseStart = Promise.race([fetchPromise, new Promise(function(resolve, reject) {
                me.timer = setTimeout(function() {
                    reject(`Reject task, over timeout ${milsec}`)
                }, milsec)
            })])
        } else { //沒有timeout
            promiseStart = fetchPromise;
        }
        new Promise(function(resolve, reject) {
            promiseStart.then(function(response) {
                if (!response.ok) { //fetch won't catch 404, 500 error, etc...check response.ok
                    return Promise.reject(response.statusText)
                }
                log('Task', 'task "' + me.options.name + '" success with status ' + response.status)
                response = (me.type) ? response[me.type]() : response;
                response = (response == undefined) ? true : response;
                if (me.stop) {
                    log('Task', me.options.name + ' ready to be resolve in waitingPool.')
                    me.resolveLater(resolve, response)
                } else {
                    resolve(response);
                }
            }).catch(function(e) {
                if (++me.count <= me.retry) {
                    log('Task', 'task "' + me.options.name + '" will retry after ' + me.sleep + 'ms with statusText : ' + e + ', has tried ' + me.count + ' times')
                    setTimeout(function() {
                        if (!me.stop) {
                            me.run();
                        } else {
                            me.status = 'pause'
                            log('Task', 'task "' + me.options.name + '" stop retry due to pause.')
                        }
                    }, me.sleep)
                } else {
                    if (me.stop) {
                        log('Task', me.options.name + ' ready to be reject in waitingPool.')
                        me.resolveLater(reject, e)
                    } else {
                        log('Task', 'task "' + me.options.name + '" fail with statusText ' + e)
                        reject(e)
                    }
                }
            })
        }).then(function(response) {
            me.emit('done', 'success', response)
        }).catch(function(e) {
            me.emit('done', 'fail', e)
        })
    }
    Task.prototype.resolveLater = function(resolve, response) {
        if (np.resolveFirst) {
            this.atWaitingPool = true;
            resolve(response)
        } else {
            this.status = 'ready';
            this.presolve = resolve;
            this.response = response;
        }
    }
    if (!glob_arg)
        glob_arg = {}
    np.log = glob_arg.log || false;
    np.poolSize = glob_arg.poolSize || 5;
    np.resolveFirst = glob_arg.resolveFirst || false;
    np.taskPool = new TaskPool();
    np.task = Task;
    np.errorHandler = function(e) {};
    np.successHandler = function(res) {};
    np.createRequest = function(fetchopt, opt) {
        return new BesRequest(fetchopt, opt);
    }
    return np;
}

module.exports = BesAjaxRequest;