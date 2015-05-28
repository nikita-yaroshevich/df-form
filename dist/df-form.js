(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('df.form.config', [])
      .value('df.form.config', {
          debug: true
      });

  // Modules
  angular.module('df.form.directive', []);
  angular.module('df.form.service', []);
  angular.module('df.form',
      [
          'df.form.config',
          'df.form.directive',
          'df.form.service',
          'df.validator',
          'ngSanitize'
      ]);

})(angular);

/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.form.directive')
    .directive('dfButton', function (dfFormUtils, $parse, validator) {
        return {
            restrict: 'E',
            require: '^?form',

            priority: -1,
            scope: {
                text: '@label',
                icon: '@?',
                iconSize: '@?',
                disableOnInvalid: '@?',
                classes: '@',
                ngDisabled: '='
            },
            templateUrl: function (element, attr) {
                return attr.icon ? 'formBundle/templates/df-icon-button.html' : 'formBundle/templates/df-button.html';
            },
            link: function (scope, element, attrs, formCtrl) {
                scope.iconSize = scope.iconSize || 24;
                scope.isDisabled = false;
                scope.buttonClass = [];
                scope.buttonClass.push('pp-btn');

                if (scope.classes) {
                    scope.buttonClass.push(scope.classes);
                }

                //var disabledParsed = $parse(attrs.ngDisabled);
                //scope.isDisabled = function () {
                //    return disabledParsed(scope.$parent);
                //};
                if (scope.$eval(attrs.primary)) {
                    scope.buttonClass.push('lgreen');
                }
                if (scope.$eval(attrs.warn)) {
                    scope.buttonClass.push('red');
                }
                if (scope.$eval(attrs.secondary)) {
                    scope.buttonClass.push('blue');
                }

                if (formCtrl && scope.disableOnInvalid) {
                    var model = formCtrl;
                    if (angular.isString(scope.disableOnInvalid) && formCtrl[scope.disableOnInvalid]) {
                        model = formCtrl[scope.disableOnInvalid];
                    }
                    scope.$watch(function () {
                        return model.$invalid;
                    }, function (val) {
                        scope.isDisabled = !!val;
                    });
                }

            }
        };
    });
/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.form.directive')
  .directive('dfDatepicker', function (dfFormUtils, $parse, validator, $q) {
    return {
      restrict: 'EA',
      require: ['^ngModel', '^?form', '^?dfField'],
      scope: {
        fid: '@?fid',
        tabindex: '@?',
        placeholder: '@?',
        value: '=ngModel',
        name: '@?',
        format: '@',
        initDate: '=?',
        minDate: '=?',
        maxDate: '=?'
      },
      templateUrl: 'formBundle/templates/df-datepicker.html',
      compile: function (element, attr) {
        if (angular.isUndefined(attr.fid)) {
          attr.fid = dfFormUtils.nextUid();
        }
        return {
          pre: function (scope, element, attrs, ctrls) {
            var ngModel = ctrls[0];
            var form = ctrls[1];
            var disabledParsed = $parse(attrs.ngDisabled);
            ngModel.isDisabled = scope.isDisabled = function () {
              return (form && form.dfDisabled) || disabledParsed(scope.$parent);
            };
            scope.type = attrs.type || 'text';
            scope.name = scope.name || attrs.ngModel;
          },
          post: function (scope, element, attrs, ctrls) {
            angular.element(element).addClass('pp-datepicker');
            scope.options = {};
            scope.open = function ($event) {
              $event.stopPropagation();
              $event.preventDefault();
              if (scope.isDisabled()){
                return;
              }
              var datepicker = angular.element(element).find('datepicker')[0];
              var divs = angular.element(datepicker).find('div');

              angular.forEach(divs, function (e) {
                e = angular.element(e);
                if (e.hasClass('_720kb-datepicker-calendar')) {
                  e.toggleClass('_720kb-datepicker-open');
                }
              });
            };

            var dfField = ctrls[2];
            var ngModel = ctrls[0];
            if (dfField){
              dfField.onWidgetAdded(scope.fid, ngModel.$name, 'dfDatepicker');
            }
            dfFormUtils.applyValidation(ctrls[0], ctrls[1], scope);
          }
        };
      }
    };
  });
/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.form.directive')
  .directive('dfError', function (dfFormUtils) {
    return {
      restrict: 'EA',
      require: ['^?form', '^?ngModel'],
      scope: true,
      templateUrl: 'formBundle/templates/df-error.html',
      compile: function () {
        return {
          post: function post(scope, element, attrs, ctrl) {
            scope.errors = [];
            var ngmodel = ctrl[1] || {};
            var errorsCount = attrs.count || 1;
            if (attrs.forName && ctrl[0] && ctrl[0][attrs.forName]) {
              ngmodel = ctrl[0][attrs.forName];
            }

            scope.$watch(function () {
              var error = false;

              if (ngmodel.$invalid) {
                if (ngmodel.$dirty) {
                  error = true;
                } else if (ngmodel.$modelValue !== ('' || undefined) && ngmodel.$modelValue.length !== 0) {
                  error = true;
                }
              }

              return error;

            }, function (newVal) {
              if (newVal) {
                var errors = [];

                var i = 0;
                angular.forEach(ngmodel.$error, function (val, validatorName) {
                  if (i < errorsCount && !ngmodel.$errorMessages[validatorName]) {
                    i++;
                    errors.push(dfFormUtils.getMessageForError(validatorName));
                  }
                });
                angular.forEach(ngmodel.$errorMessages, function (msg, vName) {
                  if (msg && i < errorsCount) {
                    i++;
                    errors.push(msg);
                  }
                });

                scope.errors = errors;
              } else {
                scope.errors = [];
              }

            });
          }
        };
      }
    };
  });
/**
 * Created by Artyom on 2/16/2015.
 */

angular.module('df.form.directive')
  .controller('df.formBundle')
  .directive('dfField', function (dfFormUtils) {
    return {
      restrict: 'E',
      transclude: true,
      require: ['^?form', 'dfField'],
      scope: false,
      templateUrl: 'formBundle/templates/df-field.html',
      compile: function () {
        return {
          post: function (scope, element, attrs, ctrls, transclude) {
            var e = angular.element(element).find('widget');
            var vm = ctrls[1];
            transclude(scope, function (clone, scope) {
              //vm.label = attrs.label;
              //vm.tooltip = attrs.tooltip;
              //vm.required = attrs.required;
              e.append(clone);
            });
          }
        };

      },
      controller: function ($scope, $element, $attrs, $compile, $interpolate,$templateCache) {
        this.onWidgetAdded = function (fid, name, type) {
          this.fid = fid;
          this.field_name = name;
          //add error element
          $compile(angular.element('<df-error for-name="'+name+'"></df-error>'))($scope, function(clonedElement, scope) {
            angular.element($element).append(clonedElement);
          });
          //add label
          if ($attrs.label){
            var template = $interpolate($templateCache.get('formBundle/templates/df-field-label.html'))({label: $attrs.label, tooltip: $attrs.tooltip, required: $attrs.required, fid: fid, name: name});
            $compile(angular.element(template))($scope, function(labelElement, scope){
              angular.element($element).prepend(labelElement);
            });
          }


        };
      }
    };
  });
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
/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.form.directive')
  .directive('dfInput', function (dfFormUtils, $parse, $compile, validator, $q) {
    return {
      restrict: 'EA',
      require: ['^ngModel', '^?form', '^?dfField'],
      scope: {
        fid: '@?fid',
        value: '=ngModel',
        type: '@?',
        //isDisabled: '=ngDisabled',
        tabindex: '@?',
        placeholder: '@?',
        symbol: '@?',
        inputValue: '@?'
      },
      templateUrl: function (element, attrs) {
        return attrs.hasOwnProperty('textarea') && attrs.textarea !== 'false' ? 'formBundle/templates/df-textarea.html' : 'formBundle/templates/df-input.html';
      },
      //templateUrl: 'formBundle/templates/df-input.html',
      compile: function (element, attr) {
        if (angular.isUndefined(attr.fid)) {
          attr.fid = dfFormUtils.nextUid();
        }
        return {
          pre: function (scope, element, attrs, ctrls) {
            var disabledParsed = $parse(attrs.ngDisabled);
            var ngModel = ctrls[0];
            var ngForm = ctrls[1];
            ngModel.isDisabled = scope.isDisabled = function () {
              return (ngForm && ngForm.dfDisabled) || disabledParsed(scope.$parent);
            };
            var type = attrs.type || 'text';
            scope.textarea = attrs.hasOwnProperty('textarea') && attrs.textarea !== 'false';
            if (!scope.textarea) {
              var inputVal = '';
              if (scope.inputValue) {
                inputVal = 'value="'+scope.inputValue+'"';
              }
              var inputHtml = '<input id="{{::fid}}" ' +
                'type="' + type + '"' +
                'ng-class="{symbol: symbol}" ' +
                'tabindex="{{::tabIndex}}" ' +
                'placeholder="{{::placeholder}}" ' +
                inputVal +
                'ng-model="value" ' +
                'ng-model-options="{ updateOn: \'default blur\', debounce: {\'default\': 500, \'blur\': 0} }" ' +
                'ng-disabled="isDisabled()" ' +
                'ng-change="onValueChanged()"/>';

              $compile(angular.element(inputHtml))(scope, function (clonedElement, scope) {
                angular.element(element).append(clonedElement);
              });
            }
            //angular.element(element).find('input').attr('type', scope.type);
            //scope.$watch('value', function (val) {
            //  ngModel.$setViewValue(val);
            //});
//						ctrl.$asyncValidators
          },
          post: function (scope, element, attrs, ctrls) {
            var dfField = ctrls[2];
            var ngModel = ctrls[0];
            if (dfField) {
              dfField.onWidgetAdded(scope.fid, ngModel.$name, 'dfInput');
            }
            dfFormUtils.applyValidation(ctrls[0], ctrls[1], scope);
          }
        };
      }
    };
  });
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
/**
 * Created by Artyom on 2/13/2015.
 */
/**
 * Created by Artyom on 2/12/2015.
 */
angular.module('df.form.directive')
  .directive('dfSelect', function (dfFormUtils, $parse) {
    return {
      restrict: 'E',
      require: ['^ngModel', '^?form', '^?dfField'],
      scope: {
        fid: '@?fid',
        value: '=ngModel',
        options: '=',
        name: '@?',
        tabindex: '@?'
      },
      templateUrl: 'formBundle/templates/df-select.html',
      link: function(scope, element, attrs, ctrl) {
        var dfField = ctrl[2];
        var ngModel = ctrl[0];

        var disabledParsed = $parse(attrs.ngDisabled);
        var ngForm = ctrl[1];
        ngModel.isDisabled = scope.isDisabled = function () {
          return (ngForm && ngForm.dfDisabled) || disabledParsed(scope.$parent);
        };

        if (dfField){
          dfField.onWidgetAdded(scope.fid, ngModel.$name, 'dfDatepicker');
        }
        dfFormUtils.applyValidation(ctrl[0], ctrl[1], scope);
      }
//      compile: function (element, attr) {
//        if (angular.isUndefined(attr.fid)) {
//          attr.fid = dfFormUtils.nextUid();
//        }
//        return {
//          pre: function (scope, element, attrs, ctrls) {
//            var ngModel = ctrls[0];
//            var form = ctrls[1];
//            var disabledParsed = $parse(attrs.ngDisabled);
//            scope.isDisabled = function () {
//              return disabledParsed(scope.$parent);
//            };
//            scope.type = attrs.type || 'text';
//            scope.name = scope.name || attrs.ngModel;
//
////						ctrl.$asyncValidators
//          },
//          post: function(scope, element, attrs, ctrls){
//            dfFormUtils.applyValidation(scope, ctrls[0], ctrls[1]);
//          }
//        };
//      }
    };
  });
/**
 * Created by Artyom on 2/13/2015.
 */

angular.module('df.form.directive')
  .directive('dfSelectbox', function (dfFormUtils, $timeout, $parse) {
    return {
      restrict: 'E',
      require: ['^ngModel', '^?form', '^?dfField'],
      transclude: true,
      controllerAs: 'vm',
      templateUrl: 'formBundle/templates/df-selectbox.html',
      scope: {
        value: '=ngModel',
        filter: '=?filter',
        onFilterChanged: '&',
        onItemSelected: '&',
        allowIcon: '=?',
        iconClass: '@?'
      },
      link: {
        pre: function (scope, element, attr, ctrl) {
          var disabledParsed = $parse(attr.ngDisabled);
          var ngModel = ctrl[0];
          var ngForm = ctrl[1];
          ngModel.isDisabled = scope.isDisabled = function () {
            return (ngForm && ngForm.dfDisabled) || disabledParsed(scope.$parent);
          };
          /**
           *
           * @type {
         * {
         *  show: boolean,
         *  selectElement: IAugmentedJQuery,
         *  listElement: IAugmentedJQuery,
         *  instanceId: string,
         *  type: ('selectbox' | 'multi' | undefined ),
         *  placeholder: string
         *  }
         * }
           */
          scope.view = {
            show: false,
            selectElement: angular.element(element)[0],
            listElement: angular.element(element).find('ng-transclude')[0],
            instanceId: 'inst-' + Date.now(), //what is this and why it necessary?????,
            type: attr.type || 'selectbox',
            placeholder: attr.placeholder,
            isEmptyAllowed: scope.$eval(attr.allowEmpty) === true,
            isFilterEnabled: scope.$eval(attr.allowFilter) === true,
            disabled: scope.disable
          };

          //if (scope.view.type === 'multi') {
          //}
          if (scope.view.isFilterEnabled) {
            scope.view.searhElement = angular.element(element).find('input')[0];
            scope.$watch('view.search', function (val) {
              scope.filter = val;
              scope.onFilterChanged({criteria: val});
            });
          }

          element.addClass('pp-selectbox');
          if (!attr.id) {
            element.attr('id', scope.view.instanceId);
          }

          for (var i = 0, elements = angular.element(element).children(); i < elements.length; i++) {
            if (angular.element(elements[i]).hasClass('select-input')) {
              scope.view.selectElement = elements[i];
              break;
            }
          }
        },
        post: function (scope, element, attrs, ctrl) {
          var dfField = ctrl[2];
          scope.ngModel = ctrl[0];
          if (dfField) {
            dfField.onWidgetAdded(scope.fid, scope.ngModel.$name, 'dfSelectbox');
          }
          dfFormUtils.applyValidation(ctrl[0], ctrl[1], scope);
        }
      },
      controller: function ($scope, $element, $document) {
        var vm = this;
        this.itemsList = {};
        $scope.selectedItems = {};

        function isInside(element) {
          if (element.length === 0) {
            return false;
          }
          return $scope.view.selectElement === element[0] ? true : isInside(element.parent());
        }

        $scope.$watch('value', function (value, oldValue) {
          if (undefined === value || value === oldValue) {
            return;
          }
          var selectedVals = vm.getValue();
          var tmpValue = [].concat(value);

          if (selectedVals.length === tmpValue.length && _.intersection(tmpValue, selectedVals).length === selectedVals.length) {
            vm.updateLabel();
            //$scope.ngModel.$validate();
            updateListControl();
            return;
          }

          $scope.selectedItems = {};

          angular.forEach(vm.itemsList, function (item, key) {
            var value = angular.element(item).scope().getItemValue();
            if (tmpValue.indexOf(value) !== -1) {
              selectItem(item);
            }
          });
          vm.updateLabel();
          updateListControl();
          //$scope.ngModel.$validate();

          //var idx = itemsValuesList.indexOf(value);
          //if (idx === -1) {
          //  $scope.selectedItems = {};
          //} else {
          //  selectItem(idx, value, itemsLabelList[idx]);
          //}
        });

        var clickHandler = function (e) {
          var $element = angular.element(e.target);
          var targetId = $element.attr('id');
          var isMulti = $scope.view.type === 'multi';
          if (targetId === $scope.view.instanceId || (isInside($element) && isMulti)) {
            return false;
          }
          $scope.view.show = false;
          $scope.$apply();
          unbindEvents();
        };

        var unbindEvents = function () {
          $scope.view.focus = -1;
          $document.unbind('click', clickHandler);
          $element.off('keydown', keyHandler);
          updateListControl();
        };

        /**
         * Handle keyboard key press
         * - if enter or space do the selection of the focused item form the list
         * - if down or up key arrow focus the appropriate item from the list
         *
         * @param e
         * @returns {boolean}
         */
        function keyHandler(e) {

          // enter
          if ([13].indexOf(e.keyCode) !== -1 && $scope.view.focus !== undefined) {

            //brutal hack goes here
            //angular.element(angular.element($scope.view.listElement).children()[$scope.view.focus]).click();

            selectItem(angular.element($scope.view.listElement).children()[$scope.view.focus]);
            updateListControl();
            vm.updateValue();
            //selectItem($scope.view.focus);


            //if ($scope.view.type !== 'multi') {
            //  unbindEvents();
            //  $scope.view.show = false;
            //}

            $scope.$apply();

            return false;
          }

          if ([38, 40].indexOf(e.keyCode) === -1) {
            return false;
          }

          var min = 0;
          var max = vm.getCurrentItemsLength() - 1;

          $scope.view.focus = $scope.view.focus !== undefined ? $scope.view.focus : -1;
          angular.element($scope.view.listElement).children().removeClass('focused');
          // key arrow down
          if (e.keyCode === 40) {
            if ($scope.view.focus === max) {
              $scope.view.focus = min;
            } else {
              $scope.view.focus += 1;
            }
          }
          // key arrow up
          if (e.keyCode === 38) {
            if ($scope.view.focus <= min) {
              $scope.view.focus = max;
            } else {
              $scope.view.focus -= 1;
            }
          }
          if ($scope.view.focus >= 0) {
            angular.element(angular.element($scope.view.listElement).children()[$scope.view.focus]).addClass('focused');
          }
          $scope.$apply();

          var $container = $scope.view.listElement;
          var $focus = angular.element($scope.view.listElement).children()[$scope.view.focus];
          var containerHeight = $container.offsetHeight;
          var currentOffset = $focus.offsetHeight * ($scope.view.focus + 1);

          if (currentOffset >= containerHeight) {
            $container.scrollTop = currentOffset;
          } else if (currentOffset <= $container.scrollTop) {
            $container.scrollTop = 0;
          }


        }

        this.isItemSelected = function (el) {
          return _.findWhere($scope.selectedItems, {value: angular.element(el).scope().getItemValue()});
        };

        this.toggleList = function () {
          if ($scope.isDisabled()) {
            return;
          }
          updateListControl();
          $scope.view.show = !$scope.view.show;
          if ($scope.view.show) {
            $timeout(function () {
              $document.bind('click', clickHandler);
              //angular.element($scope.view.selectElement).on('keydown', keyHandler);
            }, 0);
            if ($scope.view.isFilterEnabled) {
              $timeout(function () {
                $scope.view.searhElement.focus();
              });
            }
          } else {
            unbindEvents();
          }
        };

        this.getCurrentItemsLength = function () {
          return Object.keys(vm.itemsList).length;
        };

        function selectItem(el) {
          var elementScope = angular.element(el).scope();
          $scope.selectedItems[elementScope.getItemIndex()] = {
            label: elementScope.getItemLabel(),
            value: elementScope.getItemValue(),
            element: el
          };
        }

        this.deselectById = function (id) {
          if ($scope.isDisabled()) {
            return;
          }
          delete $scope.selectedItems[id];
          vm.updateValue();
          //deselectItem($scope.selectedItems[id].element);
        };

        function deselectItem(el) {
          if ($scope.isDisabled()) {
            return;
          }
          var elementScope = angular.element(el).scope();
          delete $scope.selectedItems[elementScope.getItemIndex()];
          if (Object.keys($scope.selectedItems).length === 0 && !$scope.view.isEmptyAllowed) {
            if ($scope.view.type === 'multi' && $scope.view.default) {
              elementScope = angular.element($scope.view.default.element).scope();
            }
            $scope.selectedItems[elementScope.getItemIndex()] = {
              label: elementScope.getItemLabel(),
              value: elementScope.getItemValue(),
              element: el
            };
          }
        }

        function updateListControl() {
          angular.element($scope.view.listElement).find('option-item').removeClass('selected');
          //var labels = [];
          angular.forEach($scope.selectedItems, function (item, idx) {
            var e = angular.element(item.element);
            if (e.length > 0) {
              angular.element(e).addClass('selected');
              //labels.push(e.scope().getItemLabel());
            }
          });

          //$scope.label = $scope.type === 'multi' ? labels : labels[0];

        }

        this.getValue = function () {
          return _.map($scope.selectedItems, function (i) {
            var el = angular.element(i.element);
            if (el.scope && el.scope()) {
              return el.scope().getItemValue();
            } else {
              return i.value;
            }
          });
        };

        this.updateLabel = function () {
          if ($scope.view.type === 'multi') {
            return;
          }
          var keys = Object.keys($scope.selectedItems);
          $scope.label = keys.length > 0 ? $scope.selectedItems[keys[0]].label : undefined;
        };

        this.updateValue = function () {
          var value = this.getValue();
          value = $scope.view.type === 'multi' ? value : value[0];
          $scope.ngModel.$setViewValue(value);
          //$scope.ngModel.$validate();
        };

        this.onItemClicked = function (el, index) {
          if ($scope.view.type !== 'multi') {
            $scope.selectedItems = {};
            selectItem(el, index);
          } else {
            if (this.isItemSelected(el, index)) {
              deselectItem(el, index);
            } else {
              selectItem(el, index);
            }
          }
          updateListControl();


          $scope.$apply(function () {
            vm.updateValue();
            if ($scope.onValueChanged) {
              $scope.onValueChanged();
            }
            $scope.onItemSelected($scope.view.type !== 'multi' ?
              {
                index: angular.element(el).scope().getItemIndex(),
                value: angular.element(el).scope().getItemValue(),
                label: angular.element(el).scope().getItemLabel()
              } : {
                values: _.map($scope.selectedItems, function (i) {
                  return i.value;
                }),
                items: _.map($scope.selectedItems, function (item, key) {
                  return {index: key, label: item.label, value: item.value};
                })
              }
            );
          });
        };

        this.setDefault = function () {
          if ($scope.value === undefined) {
            selectItem($scope.default.element);
            updateListControl();
            vm.updateValue();
          }
        };

        this.onItemAdded = function (el, index, isDefault) {
          var elementScope = angular.element(el).scope();
          var value = elementScope.getItemValue();
          var label = elementScope.getItemLabel();
          index = index || elementScope.getItemIndex();
          vm.itemsList[index] = el;


          if (undefined !== value && [].concat($scope.value).indexOf(value) !== -1) {
            var selectedItem = this.isItemSelected(el);
            if (selectedItem) {
              if (selectedItem.element && angular.element(selectedItem.element).parent().length !== 0) {
                selectItem(el);
              } else {
                selectedItem.element = el;
              }
            } else {
              selectItem(el);
            }
            angular.element(el).addClass('selected');
          }

          if (isDefault || (index === 0 && !$scope.view.isEmptyAllowed)) {
            if ($scope.value === undefined) {
              $scope.value = $scope.view.type === 'multi' ?
                [angular.element(el).scope().getItemValue()]
                : angular.element(el).scope().getItemValue();
            }

            $scope.view.default = {index: index, element: el};
          }
          //itemsValuesList[index] = value;
          //itemsLabelList[index] = label;
          vm.updateLabel();
          return this.getCurrentItemsLength();
        };

        this.onItemRemoved = function (el, index) {
          delete vm.itemsList[index];
          if ($scope.selectedItems[index]) {
            delete $scope.selectedItems[index].element;
          }


          if ($scope.view.default && $scope.view.default.index === index) {
            if ($scope.view.isEmptyAllowed) {
              delete $scope.view.default;
            } else {
              var key = Object.keys(vm.itemsList)[0];
              $scope.view.default = {index: key, element: vm.itemsList[key]};
            }
          }
        };


        //this.getItemComponent = function () {
        //  var itemComponent = scope.$eval(attr.itemComponent);
        //  if (itemComponent) {
        //   return itemComponent;
        //  }
        //  return false;
        //};
      }
    };
  })

  .directive('optionItem', function () {
    return {
      restrict: 'EA',
      //requires: true,
      require: '^dfSelectbox',
      scope: true,
      link: function post(scope, element, attrs, selectboxCtrl) {
        var el = angular.element(element);

        el.addClass('select-item');


        scope.onItemSelected = function (element) {
          selectboxCtrl.onItemClicked(element, scope.getItemIndex());
        };

        angular.element(element).on('click', function (event) {
          if (angular.element(element).attr('ignore')) {
            event.stopPropagation();
            return;
          }
          scope.onItemSelected(element);
        });

        scope.getItemValue = function () {
          try{
            return scope.$eval(attrs.value) || attrs.value;
          } catch (e){
            return attrs.value;
          }
        };

        scope.getItemLabel = function () {
          if (attrs.label !== undefined ){
            try {
              return scope.$eval(attrs.label) || attrs.label;
            } catch (e){
              return attrs.label;
            }
          } else {
            //return scope.getItemValue();
            return angular.element(element).html();
          }
        };
        scope.getItemIndex = function () {
          return scope.$index || scope.index || scope.$id;
        };

        scope.$on('$destroy', function () {
          selectboxCtrl.onItemRemoved(element, scope.getItemIndex());
        });

        selectboxCtrl.onItemAdded(
          element,
          scope.getItemIndex(),
          scope.$eval(attrs.default) === true
        );
      }
    };
  });
/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.form.directive')
  .directive('dfValidator',
  /**
   *
   * @param dfFormUtils
   * @param $parse
   * @param {ValidatorRulesCollection} validatorRulesCollection
   */
  function (dfFormUtils, $parse, validatorRulesCollection, $q) {
    function isPromiseLike(obj) {
      return obj && angular.isFunction(obj.then);
    }

    return {
      restrict: 'EA',
      require: ['^ngModel', '^?form'],
      scope: false,
      link: function post(scope, element, attrs, ctrls) {
        var ngForm = ctrls[1];
        var ngModel = ctrls[0];

        ngModel.$errorMessages = ngModel.$errorMessages || {};
        angular.forEach(attrs, function (options, key) {
          if (key.indexOf('df') !== 0) {
            return;
          }

          var validatorName = key.replace('df', '');
          validatorName = validatorName.substr(0, 1).toLowerCase() + validatorName.substr(1);
          if (!validatorRulesCollection.has(validatorName)){
            if (validatorName === 'linkedWith'){

            }
            return;
          }

          var validator = validatorRulesCollection.get(validatorName);

          ngModel.$asyncValidators[validatorName] = function (modelValue, viewValue) {
            var context = ngForm && ngForm.object ? ngForm.object : ngModel;
            if (ngModel.isDisabled && ngModel.isDisabled()){
              delete ngModel.$errorMessages[validatorName];
              return $q.resolve();
            }
            var result;
            try {
              result = validator.validate(viewValue, context, scope.$eval(options));
            } catch (e) {
              ngModel.$errorMessages[validatorName] = e.toString();
              return $q.reject(e.toString());
            }

            if (isPromiseLike(result)) {
              return result.then(function(){
                delete ngModel.$errorMessages[validatorName];
                return $q.resolve();
              }).catch(function(e){
                ngModel.$errorMessages[validatorName] = e.toString();
                return $q.reject(e.toString());
              });
            }

            if (result){
              delete ngModel.$errorMessages[validatorName];
              return $q.resolve();
            } else {
              ngModel.$errorMessages[validatorName] = result.toString();
              return $q.reject();
            }
          };

        });
      }
    };
  });
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
/**
 * Created by nikita
 */

(function () {
  'use strict';
  /**
   * Some of the code below was filched from https://github.com/angular/material
   */
  /*
   * This var has to be outside the angular factory, otherwise when
   * there are multiple apps on the same page, each app
   * will create its own instance of this array and the app's IDs
   * will not be unique.
   */
  var nextUniqueId = ['0', '0', '0'];
  angular.module('df.form.service')
    .service('dfFormUtils', function (validator, $q) {
      function DfFormUtils() {

      }

      DfFormUtils.prototype = {

        /**
         * nextUid, from angular.js.
         * A consistent way of creating unique IDs in angular. The ID is a sequence of alpha numeric
         * characters such as '012ABC'. The reason why we are not using simply a number counter is that
         * the number string gets longer over time, and it can also overflow, where as the nextId
         * will grow much slower, it is a string, and it will never overflow.
         *
         * @returns an unique alpha-numeric string
         */
        nextUid: function nextUid() {
          var index = nextUniqueId.length;
          var digit;

          while (index) {
            index--;
            digit = nextUniqueId[index].charCodeAt(0);
            if (digit == 57 /*'9'*/) {
              nextUniqueId[index] = 'A';
              return nextUniqueId.join('');
            }
            if (digit == 90  /*'Z'*/) {
              nextUniqueId[index] = '0';
            } else {
              nextUniqueId[index] = String.fromCharCode(digit + 1);
              return nextUniqueId.join('');
            }
          }
          nextUniqueId.unshift('0');
          return nextUniqueId.join('');
        },


        applyValidation: function (ngModel, form, scope) {
          var name = ngModel.$name;
          if (!name) {
            return;
          }
          if (scope) {
            scope.onValueChanged = function () {
              ngModel.$setDirty();
              ngModel.$setTouched();
            };
          }

          if (form && form.validationRules) {
            ngModel.$errorMessages = ngModel.$errorMessages || {};
            ngModel.$asyncValidators.dfForm = function (modelValue, viewValue) {
              if (ngModel.isDisabled && ngModel.isDisabled()){
                delete ngModel.$errorMessages.dfForm;
                return $q.resolve();
              }
              var qa = validator.validateFormField(viewValue, modelValue, form.object || form, name, form.validationRules);
              return qa.then(function () {
                delete ngModel.$errorMessages.dfForm;
                return true;
              }).catch(function (reason) {
                ngModel.$errorMessages.dfForm = reason.toString();
                return $q.reject(reason.toString());
              });
            };
          }
        },

        getMessageForError: function(name){
          var messages = {
            required: 'This field is required'
          };
          return messages[name] || 'Invalid Field';
        }
      };

      return new DfFormUtils();
    });
})();
(function (angular) {

  // Create all modules and define dependencies to make sure they exist
  // and are loaded in the correct order to satisfy dependency injection
  // before all nested files are concatenated by Gulp

  // Config
  angular.module('df.validator.config', [])
      .value('df.validator.config', {
          debug: true
      });

  // Modules
  angular.module('df.validator.services', []);
  angular.module('df.validator',
      [
          'df.validator.config',
          'df.validator.services'
      ]);

})(angular);

/**
 * Created by nikita on 12/29/14.
 */

'use strict';
angular.module('df.validator')
  .service('defaultValidationRules', function ($interpolate, $q, moment, $filter, $parse, ppEntityManager) {
    function invalid(value, object, options) {
      var msg = options.message ? options.message : this.message;
      msg = $interpolate(msg)(angular.extend({value: value, object: object}, options));
      throw msg;
      //return $q.reject(msg);
    }

    return {
      required: {
        message: 'This field is required',
        validate: function (value, object, options) {
          options = options || {};
          if (!value || value.length === 0) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      minlength: {
        message: 'Must be at least {{rule}} characters',
        validate: function (value, object, options) {
          options = angular.isObject(options) ? options : {rule: options};
          if (!value || value.length < options.rule) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      maxlength: {
        message: 'Must be fewer than {{rule}} characters',
        validate: function (value, object, options) {
          options = angular.isObject(options) ? options : {rule: options};
          if (value && value.length > options.rule) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      equal: {
        message: 'Must be equal',
        validate: function (value, context, options) {
          options = angular.isObject(options) ? options : {rule: options};
          var secondVal = angular.isObject(options.rule) &&  options.rule.field ? $parse(options.rule.field)(context) : options.rule;
          var compareByVal = options.rule.byValue || false;
          if (compareByVal && value !== secondVal){
            return invalid.apply(this, [value, context, options]);
          }
          if (!compareByVal && value != secondVal){
            return invalid.apply(this, [value, context, options]);
          }

          return true;
        }
      },
      notEqual: {
        message: 'Must be equal',
        validate: function (value, context, options) {
          options = angular.isObject(options) ? options : {rule: options};
          var secondVal = angular.isObject(options.rule) &&  options.rule.field ? $parse(options.rule.field)(context) : options.rule;
          var compareByVal = options.rule.byValue || false;
          if (compareByVal && value === secondVal){
            return invalid.apply(this, [value, context, options]);
          }
          if (!compareByVal && value == secondVal){
            return invalid.apply(this, [value, context, options]);
          }

          return true;
        }
      },
      type: {
        message: 'Must be an {{rule}}',
        validate: function (value, object, options) {
          options = angular.isObject(options) ? options : {rule: options};
          if (value) {
            var stringValue = value.toString();
          } else {
            return true;
          }
          if (options.rule === 'integer' && stringValue && !stringValue.match(/^\-*[0-9]+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'number' && stringValue && !stringValue.match(/^\-*[0-9\.]+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'negative' && stringValue && !stringValue.match(/^\-[0-9\.]+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'positive' && stringValue && !stringValue.match(/^[0-9\.]+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'email' && stringValue && !stringValue.match(/^.+@.+$/)) {
            return invalid.apply(this, [value, object, options]);
          }

          if (options.rule === 'phone' && stringValue && !stringValue.match(/^\+?[0-9\-]+\*?$/)) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      pattern: {
        message: 'Invalid format',
        validate: function (value, object, options) {
          options = angular.isObject(options) ? options : {rule: options};
          var pattern = options.rule instanceof RegExp ? options.rule : new RegExp(options.rule);

          if (value && !pattern.exec(value)) {
            return invalid.apply(this, [value, object, options]);
          }
          return true;
        }
      },
      custom: {
        message: 'Invalid value',
        validate: function (value, object, options) {
          return options.rule(value, object, options);
        }
      },
      lessThan: {
        message: 'This field should be less than {{errorField}}',
        validate: function (value, context, options) {
          options = angular.isObject(options) ? options : {rule: options};
          options.rule = angular.isString(options.rule) ? options.rule.split(/[ ,;]+/).filter(Boolean) : [options.rule];
          var parsedValue = parseFloat(value);
          var isNumber = true;
          if (isNaN(parsedValue)){
            isNumber = false;
          } else {
            value = parsedValue;
          }
          for (var i = 0; i < options.rule.length; i++){
            var errorName = null;
            var shouldBeLess = context[options.rule[i]] || options.rule[i];
            if (!shouldBeLess){
              continue;
            }
            if (isNumber) {
              if (isNaN(parseFloat(shouldBeLess))){
                continue;
              }
              errorName = shouldBeLess = parseFloat(shouldBeLess);
            }

            if (value > shouldBeLess) {

              //var tmp = $filter('humanize')($filter('tableize')(options.rule[i]));
              errorName = errorName === null ? $filter('humanize')($filter('tableize')(options.rule[i])) : errorName;
              return invalid.apply(this, [value, context, angular.extend(options, {errorField:  errorName})]);
            }
          }
          return true;

        }
      },
      dateDiff: {
        message: 'Invalid Date diff',
        validate: function (value, object, options) {
          if (!options.rule) {
            return;
          }

          var date = moment(value);
          var compareDate = moment(options.rule.field ? (object[options.rule.field].$modelValue || object[options.rule.field]): options.rule.date);

          options.rule.range = options.rule.range || 0;
          options.rule.term = options.rule.term || 'days';
          if (options.rule.more){
            if (date.diff(compareDate, options.rule.term) < options.rule.range) {
              return invalid.apply(this, [value, object, options]);
            }
          } else {
            if (date.diff(compareDate, options.rule.term) > options.rule.range) {
              return invalid.apply(this, [value, object, options]);
            }
          }
          return true;
        }
      }
    };
  });
/**
 * Created by nikita
 */

(function () {
	'use strict';
	/**
	 * Some of the code below was filched from https://github.com/bvaughn/angular-form-for
	 */
	angular.module('df.validator')
		.service('dfValidationUtils', function () {
			function dfValidationUtils() {

			}

			dfValidationUtils.prototype = {
				/**
				 * Crawls an object and returns a flattened set of all attributes using dot notation.
				 * This converts an Object like: {foo: {bar: true}, baz: true}
				 * Into an Array like ['foo', 'foo.bar', 'baz']
				 * @param {Object} object Object to be flattened
				 * @returns {Array} Array of flattened keys (perhaps containing dot notation)
				 */
				flattenObjectKeys: function (object) {
					var keys = [];
					var queue = [
						{
							object: object,
							prefix: null
						}
					];

					while (true) {
						if (queue.length === 0) {
							break;
						}

						var data = queue.pop();
						var prefix = data.prefix ? data.prefix + '.' : '';

						if (typeof data.object === 'object') {
							for (var prop in data.object) {
								var path = prefix + prop;

								keys.push(path);

								queue.push({
									object: data.object[prop],
									prefix: path
								});
							}
						}
					}

					return keys;
				}
			};

			return new dfValidationUtils();
		});
})();
/**
 * Created by nikita on 12/29/14.
 */


angular.module('df.validator')
  .service('formValidator', function ($q, dfValidationUtils, $parse, validatorRulesCollection) {
    /**
     * @class
     * @constructor
     */
    function FormValidator() {

    }

    /**
     *
     * @type {FormValidator}
     */
    FormValidator.prototype = {
      /**
       * @method
       * @description
       * Strip array brackets from field names so that object values can be mapped to rules.
       * For instance:
       * 'foo[0].bar' should be validated against 'foo.collection.fields.bar'.
       */
      $getRulesForFieldName: function (validationRules, fieldName) {
        fieldName = fieldName.replace(/\[[^\]]+\]/g, '.collection.fields');
        return $parse(fieldName)(validationRules);
      },
      /**
       * @method
       * @description
       * Validates the object against all rules in the validationRules.
       * This method returns a promise to be resolved on successful validation,
       * Or rejected with a map of field-name to error-message.
       * @param {Object} object Form-data object object is contained within
       * @param {Object} validationRules Set of named validation rules
       * @returns {Promise} To be resolved or rejected based on validation success or failure.
       */
      validateAll: function (object, validationRules) {
        throw 'Not Implemented';
        //var fields = dfValidationUtils.flattenObjectKeys(validationRules);
        //return this.validateFields(object, fields, validationRules);
      },

      /**
       * @method
       * @param {*} viewValue
       * @param {*} modelValue
       * @param {*} object
       * @param {string} fieldName
       * @param {*} validationRules
       * @return {promise}
       */
      validateField: function (viewValue, modelValue, object, fieldName, validationRules) {
        validationRules = angular.copy(validationRules);
        var rules = this.$getRulesForFieldName(validationRules, fieldName);
        var value = modelValue || viewValue;
        var validationPromises = [];
        if (angular.isString(value)) {
          value = value.replace(/\s+$/, '');
        }
        if (!rules){
          return $q.resolve();
        }
        var defer = $q.defer();



        (function shiftRule(rules) {
          var rule = rules.shift();

          function processRule(rule) {
            var returnValue;
            if (validatorRulesCollection.has(rule.name)) {
              var validationRule = validatorRulesCollection.get(rule.name);

              try {
                returnValue = validationRule.validate(value, object, rule);
              } catch (error) {
                return $q.reject(error.message || error || validationRule.message);
              }

              if (angular.isObject(returnValue) && angular.isFunction(returnValue.then)) {
                return returnValue.then(
                  function (reason) {
                    return $q.when(reason);
                  },
                  function (reason) {
                    return $q.reject(reason || validationRule.message);
                  });
              } else if (returnValue) {
                return $q.when(returnValue);
              } else {
                return $q.reject(validationRule.message);
              }
            }
            return $q.reject('Unknown validation rule with name ' + rule.name);
          }

          return processRule(rule)
            .then(function () {
              if (rules.length === 0) {
                return defer.resolve();
              }
              return shiftRule(rules);
            })
            .catch(defer.reject);


        }(rules));


        return defer.promise;
      }
    };

    return new FormValidator();
  })
;
/**
 * Created by nikita on 12/29/14.
 */


angular.module('df.validator')
  .service('objectValidator',
  /**
   *
   * @param $q
   * @param dfValidationUtils
   * @param $parse
   * @param {ValidatorRulesCollection} validatorRulesCollection
   */
  function ($q, dfValidationUtils, $parse, validatorRulesCollection) {
    /**
     * @class
     * @constructor
     */
    function ObjectValidator() {

    }

    /**
     *
     * @type ObjectValidator
     */
    ObjectValidator.prototype = {
      /**
       * @method
       * @description
       * Strip array brackets from field names so that object values can be mapped to rules.
       * For instance:
       * 'foo[0].bar' should be validated against 'foo.collection.fields.bar'.
       */
      $getRulesForFieldName: function (validationRules, fieldName) {
        fieldName = fieldName.replace(/\[[^\]]+\]/g, '.collection.fields');
        return $parse(fieldName)(validationRules);
      },
      /**
       * @method
       * @description
       * Validates the object against all rules in the validationRules.
       * This method returns a promise to be resolved on successful validation,
       * Or rejected with a map of field-name to error-message.
       * @param {Object} object Form-data object object is contained within
       * @param {Object} validationRules Set of named validation rules
       * @returns {Promise} To be resolved or rejected based on validation success or failure.
       */
      validateAll: function (object, validationRules) {
        var fields = dfValidationUtils.flattenObjectKeys(validationRules);
        return this.validateFields(object, fields, validationRules);
      },


      /**
       * @method
       * @description
       * Validates the values in object with the rules defined in the current validationRules.
       * This method returns a promise to be resolved on successful validation,
       * Or rejected with a map of field-name to error-message.
       * @param {Object} object Form-data object object is contained within
       * @param {Array} fieldNames Whitelist set of fields to validate for the given object; values outside of this list will be ignored
       * @param {Object} validationRules Set of named validation rules
       * @returns {Promise} To be resolved or rejected based on validation success or failure.
       */
      validateFields: function (object, fieldNames, validationRules) {
        validationRules = angular.copy(validationRules);
        var deferred = $q.defer();
        var promises = [];
        var errorMap = {};

        angular.forEach(fieldNames, function (fieldName) {
          var rules = this.$getRulesForFieldName(validationRules, fieldName);

          if (rules) {
            var promise;

            promise = this.validateField(object, fieldName, validationRules);

            promise.then(
              angular.noop,
              function (error) {
                $parse(fieldName).assign(errorMap, error);
              });

            promises.push(promise);
          }
        }, this);

        $q.all(promises).then(
          deferred.resolve,
          function () {
            deferred.reject(errorMap);
          });

        return deferred.promise;
      },

      /**
       * @method
       * @param object
       * @param fieldName
       * @param validationRules
       * @return {*}
       */
      validateField: function (object, fieldName, validationRules) {
        var rules = this.$getRulesForFieldName(validationRules, fieldName);
        var value = $parse(fieldName)(object);
        var validationPromises = [];
        if (angular.isString(value)) {
          value = value.replace(/\s+$/, '');
        }
        var defer = $q.defer();


        (function shiftRule(rules) {
          var rule = rules.shift();

          function processRule(rule) {
            var returnValue;
            if (validatorRulesCollection.has(rule.name)) {
              var validationRule = validatorRulesCollection.get(rule.name);
              var ruleOptions = rule;

              try {
                returnValue = validationRule.validate(value, object, ruleOptions);
              } catch (error) {
                return $q.reject(error || validationRule.message);
              }

              if (angular.isObject(returnValue) && angular.isFunction(returnValue.then)) {
                return returnValue.then(
                  function (reason) {
                    return $q.when(reason);
                  },
                  function (reason) {
                    return $q.reject(reason || validationRule.message);
                  });
              } else if (returnValue) {
                return $q.when(returnValue);
              } else {
                return $q.reject(validationRule.message);
              }
            }
            return $q.reject('Unknown validation rule with name ' + ruleName);
          }

          return processRule(rules)
            .then(function () {
              if (rules.length === 0) {
                return defer.resolve();
              }
              return shiftRule(rules);
            })
            .catch(defer.reject);


        }(rules));

        return defer.promise;
      },

      /**
       * Convenience method for determining if the specified collection is flagged as required (aka min length).
       */
      isCollectionRequired: function (fieldName, validationRules) {
        var rules = this.$getRulesForFieldName(validationRules, fieldName);

        return rules &&
          rules.collection &&
          rules.collection.min &&
          (angular.isObject(rules.collection.min) ? rules.collection.min.rule : rules.collection.min);
      },

      /**
       * Convenience method for determining if the specified field is flagged as required.
       */
      isFieldRequired: function (fieldName, validationRules) {
        var rules = this.$getRulesForFieldName(validationRules, fieldName);

        return rules &&
          rules.required &&
          (angular.isObject(rules.required) ? rules.required.rule : rules.required);
      }

    };

    return new ObjectValidator();
  })
;
/**
 * Created by nikita on 12/29/14.
 */

angular.module('df.validator')
    .provider('validator', function ($provide) {

        var schemas = {};

        this.add = function (name, schema) {
            schemas[name] = schema;
            return this;
        };

        this.addCollection = function (col) {
            var self = this;
            angular.forEach(col, function (schema, type) {
                self.add(type, schema.validators || schema);
            });
        };

        this.remove = function (name) {
            delete schemas[name];
            return this;
        };


        this.has = function (name) {
            return schemas[name] !== undefined;
        };

        this.get = function (name) {
            return schemas[name] || {};
        };

        var provider = this;


        this.$get =
          /**
           *
           * @param $q
           * @param {ObjectValidator} objectValidator
           * @param {FormValidator} formValidator
           * @param {ValidatorRulesCollection} validatorRulesCollection
           */
          function ($q, objectValidator, formValidator, validatorRulesCollection) {
            /**
             * @class
             * @constructor
             */
            function Validator() {
            }

            /**
             *
             * @type Validator
             */
            Validator.prototype = {
                add: function add(name, schema) {
                    provider.add(name, schema);
                    return this;
                },
                remove: function remove(name) {
                    provider.remove(name);
                    return this;
                },
                has: function has(name) {
                    return provider.has(name);
                },
                get: function get(name) {
                    return provider.get(name);
                },
                addRule: function addRule(name, rule) {
                    validatorRulesCollection.add(name, rule);
                    return this;
                },
                removeRule: function removeRule(name) {
                    validatorRulesCollection.remove(name);
                    return this;
                },
                hasRule: function hasRule(name) {
                    return validatorRulesCollection.has(name);
                },
                getRule: function getRule(name) {
                    return validatorRulesCollection.get(name);
                },

                getValidationRules: function getValidationRules(schema) {
                    schema = angular.isFunction(schema) ? this.get(schema.constructor.name) : schema;
                    schema = angular.isString(schema) ? this.get(schema) : schema;
                    return schema;
                },
                validate: function validate(object, schema) {
                    schema = angular.isObject(schema) ? schema : this.getValidationRules(schema || object);
                    return objectValidator.validateAll(object, schema);
                },
                validateField: function validateField(object, fields, schema) {
                    var fieldNames = angular.isString(fields) ? [fields] : fields;
                    return objectValidator.validateFields(object, fieldNames, this.getValidationRules(schema || object));
                },
                validateFormField: function (viewValue, modelValue, model, field, schema) {
                    return formValidator.validateField(viewValue, modelValue, model, field, schema);
                }
            };

            return new Validator();
        };
    });

/**
 * @ngdoc Services
 * @name ValidatorRulesCollection
 * @description
 * ValidatorRulesCollection service used by EntityBundle to manage validation rules by name.
 */
'use strict';
angular.module('df.validator')
  .service('validatorRulesCollection', function ValidatorRulesCollection($q, defaultValidationRules) {
    var validators = {};

    /**
     * Use this method to add new rule to the validation collection.
     * @memberof ValidatorRulesCollection
     */
    this.add = function (name, rule) {
      if (angular.isFunction(rule)) {
        rule = {
          message: 'Invalid value',
          validate: rule
        };
      }
      if (!angular.isFunction(rule.validate)) {
        throw 'Invalid validator object type';
      }
      validators[name] = rule;
      return this;
    };

    /**
     * Use this method to remove existed rule from the validation collection.
     * @memberof ValidatorRulesCollection
     */
    this.remove = function (name) {
      delete validators[name];
      return this;
    };

    /**
     * Use this method to check is rule existe inside the validation collection.
     * @memberof ValidatorRulesCollection
     */
    this.has = function (name) {
      return validators[name];
    };

    /**
     * Use this method to get the rule from the validation collection.
     * @memberof ValidatorRulesCollection
     */
    this.get = function (name) {
      return validators[name];
    };
//---- add pre defined validator rules to the validation collection
    var self = this;
    angular.forEach(defaultValidationRules, function (rule, name) {
      self.add(name, rule);
    });

  });