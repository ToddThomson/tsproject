var EventEmitter = (function () {
    function EventEmitter() {
        this.handlers = [];
    }
    EventEmitter.prototype.on = function (handler) {
        this.handlers.push(handler);
    };
    EventEmitter.prototype.off = function (handler) {
        this.handlers = this.handlers.filter(function (h) { return h !== handler; });
    };
    EventEmitter.prototype.trigger = function (data) {
        if (this.handlers) {
            this.handlers.slice(0).forEach(function (h) { return h(data); });
        }
    };
    return EventEmitter;
})();
//# sourceMappingURL=EventEmitter.js.map