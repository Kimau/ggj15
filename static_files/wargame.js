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
      when('/game', {
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

warControllers.controller('MyLoginController', ['$scope', '$http', '$rootScope', '$location',
  function($scope, $http, $rootScope, $location) {
    hackScope = $scope;

    $scope.userName = window.localStorage["username"] || "TestUser";
    $scope.tokenExpire = window.localStorage["tokenExpire"];

    if($scope.tokenExpire)
    {
    	$scope.isLoggedIn = true;
    }
    else
    {
    	$scope.isLoggedIn = false;
    }

    var userName = "TestUser";

		$scope.newUser = function() {
			$http.post('/warapi/new_user', 
               {"userName": userName}, 
               {headers:{"Content-Type":"application/json"}}).
        success(function(data, status, headers, config) {
          console.log("New User");
        }).
        error(function(data, status, headers, config) {
          $scope.GameState = "GS_FuckUp";
        });
		}

		$scope.login = function() {

		}

		$scope.help = function() {

		}

  }]);

warControllers.controller('MyGameController', ['$scope', '$http', '$rootScope', '$location',
  function($scope, $http, $rootScope, $location) {
    hackScope = $scope;

    if(window.isLoggedIn == 0)
    {
    	$location.assign("/login");
      return;
    }

    $scope.test = 1;
  }]);
