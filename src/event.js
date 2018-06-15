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

export default EventListener;