import EventListener from './event';
import log from './log';
import np from './np'

function Task(fetchoptions, options) {
    EventListener.call(this);
    this.fetchoptions = fetchoptions;
    this.options = options;
    this.primary = (options.primary) ? options.primary : 1;
    this.type = options.responseType;
    this.errType = options.errorType;
    this.count = 0;
    /* 4個狀態 
        init: 一開始 
        proccess: 在TaskPool裡執行(run)
        pause:  從exe被放到waiting 暫停
        ready: 完成了，但是在waiting pool
        abort: 被abort 不會算retry次數
    */
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
    if(this.status==='proccess'){
        clearTimeout(this.timer)
        if(np.abort&&np.canAbort){
            this.abort()
        }
    }
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
    /*abortion*/
    if(np.canAbort){
        this.controller = new AbortController();
        me.fetchoptions.signal = this.controller.signal;
    }
    /*--------*/
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
                return Promise.reject(response)
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
            if(me.status==='abort'){
                me.status ='init'
            } else if (++me.count <= me.retry) {
                log('Task', 'task "' + me.options.name + '" failed, status: '+e.status+' will retry after ' + me.sleep + 'ms , has tried ' + me.count + ' times')
                setTimeout(function() {
                    if (!me.stop) {//在exePool裡
                        me.run();
                    } else {//在waitingPool裡
                        me.status = 'pause'
                        log('Task', 'task "' + me.options.name + '" stop retry due to pause.')
                    }
                }, me.sleep)
            } else {
                if (me.stop) {
                    log('Task', me.options.name + ' ready to be reject in waitingPool.')
                    me.resolveLater(reject, e)
                } else {
                    log('Task', 'task "' + me.options.name + '" failed, status: '+e.status)
                    reject(e)
                }
            }
        })
    }).then(function(response) {
        me.emit('done', 'success', response)
    }).catch(function(e) {
        e = (me.errType)?e[me.errType]():e
        e = (e==undefined) ? true : e;
        e.then((res)=>{
            me.emit('done', 'fail', res)
        })
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
Task.prototype.abort = function(){
    this.status = 'abort';
    this.controller.abort();
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
        if (status === 'init') { //還未執行過 執行他
            task.run();
        } else if (status === 'pause') {//之前被丟到waitingPool暫停了，現在回到exePool執行
            task.run();
        } else if (status === 'ready') {//之前在waitingPool已經完成了，現在回到exePool後resolve
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

export {Task, TaskPool}