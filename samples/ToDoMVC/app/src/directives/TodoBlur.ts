import * as ng from "angular";
import * as JQuery from "jquery";

/*
    Directive that executes an expression when the element it is applied to loses focus.
*/
export function todoBlur(): ng.IDirective {
    return {
        link: ( $scope: ng.IScope, element: JQuery, attributes: any ) => {
            element.bind( 'blur', () => { $scope.$apply( attributes.todoBlur ); });
            $scope.$on( '$destroy', () => { element.unbind( 'blur' ); });
        }
    };
}