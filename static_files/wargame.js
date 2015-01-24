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

    function saveUser() {
      window.localStorage["username"] = $scope.userName;
      window.localStorage["tokenExpire"] = $scope.tokenExpire;
      window.localStorage["token"] = $scope.token;      
    }

		$scope.newUser = function() {
      if($scope.pass.length < 3)
        return alert("Password too sohrt");

      $scope.showCreateUser = false;
      $scope.isLoading = true;

			$http.post('/warapi/new_user', 
               {"userName": $scope.userName, 'pass': $scope.pass}, 
               {headers:{"Content-Type":"application/json"}}).
        success(function(data, status, headers, config) {
          console.log("New User");
          $scope.isLoggedIn = true;
          $scope.tokenExpire = data["expires"];
          $scope.token = data["token"];
          $scope.userName = data["user"];
          saveUser();
          $scope.isLoading = false;
        }).
        error(function(data, status, headers, config) {
          $scope.GameState = "GS_FuckUp";
        });
		}

		$scope.login = function() {
      $scope.isLoading = true;

      $http.post('/warapi/login', 
               {"userName": $scope.userName, 'pass': $scope.pass}, 
               {headers:{"Content-Type":"application/json"}}).
        success(function(data, status, headers, config) {
          console.log("Login");
          $scope.isLoggedIn = true;
          $scope.isLoading = false;
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
      $scope.isLoading = true;

      $http.post('/warapi/new_game', 
               {"userName": $scope.userName, 'token': $scope.pass}, 
               {headers:{"Content-Type":"application/json"}}).
        success(function(data, status, headers, config) {
          console.log("Login");
          $scope.isLoading = false;
          location.assign("#game" + data.gameID);
        }).
        error(function(data, status, headers, config) {
          $scope.GameState = "GS_FuckUp";
        });
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
      location.assign("/login");
      return;
    }


    $scope.isWaiting = true;
    $scope.submit = function() {
      console.log($scope.text);
      $scope.text = "";
      $scope.isWaiting = true; 
    }

    $http.get('/warapi/game', { headers:{
                "Content-Type":"application/json", 
                "userName": $scope.userName, 
                "token": $scope.token, 
                "gameID": $rootScope.gameID}}).
        success(function(data, status, headers, config) {
          $scope.game = data;
          $scope.isWaiting = false;
        }).
        error(function(data, status, headers, config) {
          $scope.GameState = "GS_FuckUp";
        });
  }]);
