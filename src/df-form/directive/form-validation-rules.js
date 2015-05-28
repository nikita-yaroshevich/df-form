/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.form.directive')
  .directive('validationRules', function (dfFormUtils, $parse) {
    return {
      restrict: 'EA',
      require: '^form',
      scope: {
        object: '=',
        rules: '=validationRules'
      },
      link: function post(scope, element, attrs, ctrl) {
        ctrl.validationRules = scope.rules;// scope.$eval(attrs.);
        //ctrl.object = scope[attrs.object];
        scope.$watch('object', function(val){
          ctrl.object = val;
        });
      }
    };
  });