var hackScope;

/* Config */
var warApp = angular.module('warApp', [
  'ngRoute',
  'ngSanitize',
  'warControllers'
]);

warApp.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/game/:gameID', {
        templateUrl: '/_game.html',
        controller: 'MyGameController'
      }).
      when('/login', {
        templateUrl: '/_login.html',
        controller: 'MyLoginController'
      }).
      otherwise({
        redirectTo: '/login'
      });
  }]);

/* Controllers */

var warControllers = angular.module('warControllers', []);

warControllers.controller('MyLoginController', ['$scope', '$http', '$rootScope',
  function($scope, $http, $rootScope) {
    hackScope = $scope;

    $scope.userName = window.localStorage["username"] || "TestUser";
    $scope.tokenExpire = window.localStorage["tokenExpire"];
    $scope.token = window.localStorage["token"];

    if(new Date($scope.tokenExpire) > new Date(Date.now()))
    {
    	$scope.isLoggedIn = true;
    }
    else
    {
    	$scope.isLoggedIn = false;
    }

    var userName = "TestUser";

    function saveUser() {
      window.localStorage["username"] = $scope.userName;
      window.localStorage["tokenExpire"] = $scope.tokenExpire;
      window.localStorage["token"] = $scope.token;      
    }

		$scope.newUser = function() {
			$http.post('/warapi/new_user', 
               {"userName": userName}, 
               {headers:{"Content-Type":"application/json"}}).
        success(function(data, status, headers, config) {
          console.log("New User");
          $scope.isLoggedIn = true;
          $scope.tokenExpire = data["expires"];
          $scope.token = data["token"];
          $scope.userName = data["user"];
          saveUser();
        }).
        error(function(data, status, headers, config) {
          $scope.GameState = "GS_FuckUp";
        });
		}

		$scope.login = function() {
      $http.post('/warapi/login', 
               {"userName": userName}, 
               {headers:{"Content-Type":"application/json"}}).
        success(function(data, status, headers, config) {
          console.log("Login");
          $scope.isLoggedIn = true;
          $scope.tokenExpire = data["expires"];
          $scope.token = data["token"];
          $scope.userName = data["user"];
          saveUser();
        }).
        error(function(data, status, headers, config) {
          $scope.GameState = "GS_FuckUp";
        });
		}

		$scope.help = function() {

		}

    $scope.newGame = function() {
      $rootScope.gameID = "Nacho";
      location.assign("#game/" + $rootScope.gameID);
    }

    $scope.continueGame = function() {
      $rootScope.gameID = "Nacho";
      location.assign("#game" + $rootScope.gameID);
    }

  }]);

warControllers.controller('MyGameController', ['$scope', '$http', '$rootScope', '$routeParams',
  function($scope, $http, $rootScope, $routeParams) {
    hackScope = $scope;

    $rootScope.gameID = $routeParams.gameID;

    if(window.isLoggedIn == 0)
    {
    	location.assign("/login");
      return;
    }

    $scope.test = 1;
    $scope.submit = function() {
      console.log($scope.text);
      $scope.text = "";
      $scope.isWaiting = true; 
    }
  }]);
