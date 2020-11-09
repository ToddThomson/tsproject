"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.todoBlur = void 0;
/*
    Directive that executes an expression when the element it is applied to loses focus.
*/
function todoBlur() {
    return {
        link: function ($scope, element, attributes) {
            element.bind('blur', function () { $scope.$apply(attributes.todoBlur); });
            $scope.$on('$destroy', function () { element.unbind('blur'); });
        }
    };
}
exports.todoBlur = todoBlur;
//# sourceMappingURL=todoBlur.js.map