// depend on "ui.angular-combobox"
var app = angular.module("plunker", ["ui.angular-combobox"]);

// create a controller for your data
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