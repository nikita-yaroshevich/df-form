/**
 * Created by Artyom on 2/12/2015.
 */
angular.module('df.form.directive')
  .directive('dfLabel', function () {
    return {
      restrict: 'E',
      require: '^form',
      scope: {
        required: '@',
        label: '@',
        tooltip: '@',
        forAttr: '@for'
      },
      templateUrl: 'formBundle/templates/df-label.html'
    };
  });