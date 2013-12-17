/**
 * Note: multiple breaks...also breaks if we require ^ngModel ?
 * @type {*}
 */
var combobox = angular.module('ui.angular-combobox', []);

combobox.directive('combobox', function ($document, $location, $log, $filter) {
        var openElement = null,
            closeMenu = angular.noop,
            COMBOBOX_ID = "_combobox_id";

        var inputEl = angular.element('<input type="text" ng-model="state.searchTerm" ng-keydown="onKeyDown"' +
            'style="margin-bottom: 0px; width:{{style.inputWidth}}px"/>');
        var dropdownEl = angular.element('<ul class="dropdown-menu" style="width:{{style.width}}px">' +
            '<li ng-class="{selected: isSelected(choice)}" ng-repeat="choice in filteredItems">' +
            '<a>{{choice.text}}</a>' +
            '</li>' +
            '</ul>');

        var multiSelectDropdownEl = angular.element('<ul class="dropdown-menu" style="width:{{style.width}}px">' +
            '<li ng-repeat="choice in filteredItems">' +
            '<input type="checkbox"/>   <a>{{choice}}</a>' +
            '</li>' +
            '</ul>');

        var link = function (scope, element, attrs) {
            console.log(scope)
            console.log(attrs);

            var width = attrs["comboboxWidth"] || 200;
            scope.style = {
                width: width,
                inputWidth: width - 12 // adjust for input's padding (2*6px padding, might want to get actual values dynamically for easier maintenance)
            };

            scope.state = {
                searchTerm: "",
                selectedIndex: -1
            };

            scope.clearFilter = function () {
                scope.filteredItems = $filter('filter')(scope.pristineItems, "");
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

            scope.getSelectedIndex = function () {
                return scope.state.selectedIndex;
            };

            scope.setSelectedIndex = function (value) {
                scope.state.selectedIndex = value;
            };

            scope.getSearchTerm = function () {
                return scope.state.searchTerm || "";
            };

            scope.setSearchTerm = function (value) {
                scope.state.searchTerm = value;
            };

            scope.selectElement = function (toSelect, preventClose) {
                // TODO handle if multiselect..
                scope.selectedElements = [toSelect];
                scope.setSelectedIndex(toSelect[COMBOBOX_ID]);

                inputEl.val(toSelect.text);
                scope.$apply(function () {
                    scope.clearFilter();
                    scope.selectedText = toSelect.text; // TODO
                    scope.select({text: toSelect.text}); // TODO fix this
                });

                // TODO pass preventClose in multiselect case
                if (!preventClose) {
                    closeMenu();
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
                        scope.selectElement(toSelect);
                    } else {
                        // clear filter ?
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

            element.bind('click', function (event) {
                $log.log("click");
                $log.log(event);

                var elementWasOpen = (element === openElement);

                event.preventDefault();
                event.stopPropagation();

                if (!!openElement) {
                    closeMenu();
                }

                if (!elementWasOpen && !element.hasClass('disabled') && !element.prop('disabled')) {
                    element.addClass('open');
                    openElement = element;
                    closeMenu = function (event) {
                        if (event) {
                            event.preventDefault();
                            event.stopPropagation();
                        }
                        $document.unbind('click', closeMenu);
                        element.removeClass('open');
                        closeMenu = angular.noop;
                        openElement = null;
                    };
                    $document.bind('click', closeMenu);
                }
            });
        };

        return {
            restrict: 'A',
            replace: true,
            scope: {
                select: "&",
                comboboxItems: "=" // TODO why doesn't this work?
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


var app = angular.module("plunker", ["ui.angular-combobox"]);

app.controller("DropdownCtrl", function ($scope) {
    $scope.items = [
        "The first choice!",
        "And another choice for you.",
        "but wait! A third!"
    ];
    $scope.selectedIndex = 2;
    $scope.selectedItem = $scope.items[$scope.selectedIndex];

    $scope.select = function (text) {
        console.log("select called");
        console.log(text);
        $scope.selected = text;
    }
});