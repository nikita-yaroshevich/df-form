/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.form.directive')
    .directive('dfFormDisabled', function (dfFormUtils, $parse, validator) {
        return {
            restrict: 'A',
            require: '^form',
            link: function (scope, element, attrs, formCtrl) {
                attrs.$observe('dfFormDisabled', function(val){
                    formCtrl.dfDisabled = $parse(val)();
                });
            }
        };
    });
