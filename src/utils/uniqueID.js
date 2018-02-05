// https://stackoverflow.com/a/1997811/2131453
(function() {
    var id_counter = 1;
    Object.defineProperty(Object.prototype, "__uniqId", {
        writable: true
    });
    Object.defineProperty(Object.prototype, "uniqId", {
        get: function() {
            if (this.__uniqId == undefined)
                this.__uniqId = id_counter++;
            return this.__uniqId;
        }
    });
}());
