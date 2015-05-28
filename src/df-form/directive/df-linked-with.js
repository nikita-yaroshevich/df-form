/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.form.directive')
  .directive('dfLinkedWith',
  function () {
    return {
      restrict: 'A',
      require: ['^ngModel', '^?form'],
      scope: false,
      link: function post(scope, element, attrs, ctrls) {
        var ngForm = ctrls[1];
        var ngModel = ctrls[0];

        scope.$watch(function(){return ngModel.$modelValue}, function(val){
          if (!ngForm[attrs.dfLinkedWith]){
            return;
          }
          ngForm[attrs.dfLinkedWith].$setDirty();
          ngForm[attrs.dfLinkedWith].$setTouched();
          ngForm[attrs.dfLinkedWith].$validate();

        });
      }
    };
  });