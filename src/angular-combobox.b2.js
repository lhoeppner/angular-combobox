/**
 * TODO:
 * - allow multiple select
 * - keyboard navigation of items (up/down/return)
 * - on click outside, clear filter term
 * - height option (make scrollable inside)
 * - on focus input, clear filter text (only display selected in non-focused)
 * - multiple breaks...also breaks if we require ^ngModel ?
 * - test with themes (fix .select esp)
 *
 * @type {*}
 */
var combobox = angular.module('ui.angular-combobox', []);

combobox.factory('safeApply', [function ($rootScope) {
    return function ($scope, fn) {
        var phase = $scope.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn) {
                $scope.$eval(fn);
            }
        } else {
            if (fn) {
                $scope.$apply(fn);
            } else {
                $scope.$apply();
            }
        }
    }
}]);

combobox.directive('combobox', function ($document, $location, $log, $filter, safeApply) {
        var openElement = null,
            closeMenu = angular.noop,
            COMBOBOX_ID = "_combobox_id";

        var inputEl = angular.element('<input type="text" ng-model="state.searchTerm" ng-keydown="onKeyDown" clear-on-focus ' +
            'style="margin-bottom: 0px; width:{{style.inputWidth}}px"/>');
        var dropdownEl = angular.element('<ul class="dropdown-menu" style="width:{{style.width}}px">' +
            '<li ng-class="{selected: isSelected(item)}" ng-repeat="item in filteredItems" ng-click="selectItem(item)">' +
            '<a>{{item.text}}</a>' +
            '</li>' +
            '</ul>');

        var multiSelectDropdownEl = angular.element('<ul class="dropdown-menu" style="width:{{style.width}}px">' +
            '<li ng-repeat="item in filteredItems">' +
            '<input type="checkbox"/>   <a>{{item}}</a>' +
            '</li>' +
            '</ul>');

//        var safeApply = function(fn) {
//            var phase = this.$root.$$phase;
//            if(phase == '$apply' || phase == '$digest') {
//                if(fn && (typeof(fn) === 'function')) {
//                    fn();
//                }
//            } else {
//                this.$apply(fn);
//            }
//        };

        var link = function (scope, element, attrs) {
            console.log(scope)
            console.log(attrs);

            var width = attrs["comboboxWidth"] || 200;
            scope.style = {
                width: width,
                inputWidth: width - 12 // adjust for input's padding (2*6px padding, might want to get actual values dynamically for easier maintenance)
            };

            scope.getSearchTerm = function () {
                return scope.state.searchTerm || "";
            };

            scope.setSearchTerm = function (value) {
                scope.state.searchTerm = value;
            };

            scope.clearFilter = function () {
                safeApply(scope, function () { // TODO why do I need to $apply here?
                    inputEl.val("");
                    scope.setSearchTerm("");
                    scope.filteredItems = $filter('filter')(scope.pristineItems, "");
                });

            };

            scope.pristineItems = []; //angular.extend([], scope.items);
            // TODO only convert if not already specified by user
            for (var i = 0, max_i = scope.comboboxItems.length; i < max_i; i++) {
                scope.pristineItems[i] = {
                    text: scope.comboboxItems[i]
                };
                scope.pristineItems[i][COMBOBOX_ID] = i;
            }
            scope.clearFilter(); // initialize filtered items

            console.log("passed state");
            console.log(scope.state);

            scope.getSelectedIndex = function () {
                return scope.state.selectedIndex;
            };


            scope.selectItem = function (toSelect, preventClose) {
                // TODO handle if multiselect..
//                scope.selectedElements = [toSelect];

                console.log("selecting");
                console.log(toSelect);

                //noinspection JSUnresolvedFunction
                inputEl.val(toSelect.text);

                safeApply(scope, function () {
                    scope.clearFilter();
                    scope.state._selectedItem = toSelect; // store internal type with generated id
                    scope.state.selectedItem = toSelect.text;
                    scope.state.selectedIndex = toSelect[COMBOBOX_ID];
                    //scope.select({text: toSelect.text}); // TODO fix this
                });

                // TODO pass preventClose in multiselect case
                if (!preventClose) {
                    if (!!openElement) {
                        closeMenu();
                    }
                }
            };

            scope.isSelected = function (item) {

                return item[COMBOBOX_ID] === scope.getSelectedIndex();
            };

            var filterFunction = function (toTest, value) {
                return toTest.text.indexOf(value) !== -1;
            };

            // TODO allow custom keydown event handler
            scope.onKeyDown = function ($event) {
                console.log(scope);
                if ($event.which == 9) {
                    //$event.preventDefault();
                    // TODO autocomplete and set selected value

                    var items = scope.pristineItems;
                    var value = scope.getSearchTerm();

                    var matches = $filter('filter')(items, value, filterFunction);
                    if (matches.length) {
                        var toSelect = matches[0];
                        scope.selectItem(toSelect);
                    } else {
                        closeMenu();
                    }
                }
            };


            scope.onKeyPress = function () {
                // filter the list
                scope.filteredItems = $filter('filter')(scope.pristineItems, scope.getSearchTerm());
            };

            scope.$watch('state.searchTerm', function () {
                scope.onKeyPress()
            });

            scope.$watch('$location.path', function () {
                closeMenu();
            });

            element.parent().bind('click', function () {
                closeMenu();
            });

            scope.openMenu = function () {
                element.addClass('open');
                openElement = dropdownEl;
                closeMenu = function (event) {
                    if (event) {
                        event.preventDefault();
                        event.stopPropagation();
                    }
                    $document.unbind('click', closeMenu);
                    element.removeClass('open');
                    closeMenu = angular.noop;
                    openElement = null;

                    scope.clearFilter();
                };

                $document.bind('click', closeMenu);
            };

            inputEl.bind('click', function (event) {
                $log.log("click");
                $log.log(event);


                event.preventDefault();
                event.stopPropagation();

                var elementWasOpen = (element === openElement);

                if (!!openElement) {
                    closeMenu();
                }

                if (!elementWasOpen && !element.hasClass('disabled') && !element.prop('disabled')) {
                    scope.openMenu();
                }
            });
        };

        return {
            restrict: 'A',
            replace: true,
            scope: {
                state: "=",
                comboboxItems: "="
            },
            template: '<div class="dropdown"/>',
            compile: function (templateEl, attributes) {
                templateEl.append(inputEl);

                if (attributes.hasOwnProperty("combobox-multi")) {
                    templateEl.append(multiSelectDropdownEl);

                } else {
                    templateEl.append(dropdownEl);

                }

                return link;
            }
        };
    }
);

combobox.directive('clearOnFocus', function () {
    return {
        restrict: 'A',
        link: function (scope, elem) {
            elem.bind('focus', function () {
                elem.val("");
            });
        }
    };
});

combobox.directive('ngKeydown', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            elem.bind('keydown', function (e) {
                scope[attrs.ngKeydown](e);
            });
        }
    };
});