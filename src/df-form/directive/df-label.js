/**
 * Created by Artyom on 2/12/2015.
 */
angular.module('df.form.directive')
  .directive('dfLabel', function () {
    return {
      restrict: 'E',
      require: '^?form',
      scope: {
        required: '@',
        label: '@',
        tooltip: '@',
        tooltipPosition: '@',
        forAttr: '@for'
      },
      templateUrl: 'df.form/templates/df-label.html',
      link: function (scope, element, attrs) {}
    };
  });
