var NameGenerator = (function () {
    function NameGenerator() {
        // Base64 char set: 26 lowercase letters + 26 uppercase letters + '$' + '_' + 10 digits                                          
        this.base64Chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$_0123456789";
        this.index = 0;
    }
    NameGenerator.prototype.getName = function () {
        // 2 and 3 letter reserved words that cannot be used in identifier names
        var RESERVED_KEYWORDS = ["do", "if", "in", "for", "int", "let", "new", "try", "var"];
        var name;
        while (true) {
            name = this.generateName();
            if (RESERVED_KEYWORDS.indexOf(name) > 0) {
                continue;
            }
            else {
                return name;
            }
        }
    };
    NameGenerator.prototype.reset = function () {
        this.index = 0;
    };
    NameGenerator.prototype.generateName = function () {
        var id = this.index;
        // The first 54 chars of the base64 char set are used for the first char of the identifier
        var name = this.base64Chars[id % 54];
        id = Math.floor(id / 54);
        while (id > 0) {
            // The full base64 char set is used after the first char of the identifier
            name += this.base64Chars[id % 64];
            id = Math.floor(id / 64);
        }
        this.index++;
        return name;
    };
    return NameGenerator;
})();
exports.NameGenerator = NameGenerator;
//# sourceMappingURL=NameGenerator.js.map