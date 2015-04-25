(function () {
	var appName = ''; //Your firebase app name
	var app = angular.module("app", ['firebase', 'ipCookie', 'ui.router']);
	app.config(function config($stateProvider) {
		$stateProvider.state("index", {
			url: "",
		})
	});

	//COOKIE CONTROLLER----------------------------------
	app.controller('NavController', ['$scope', '$document', 'ipCookie', '$firebase', function ($scope, $document, ipCookie, $firebase) {
		{
			$scope.appName = appName;
			$scope.currentID = ipCookie('checkAuth');
			//Get UserData, set $scope.userName
			var accountRef = new Firebase('https://' + appName + '.firebaseio.com/accounts/createdAccounts/' + $scope.currentID + '/accountDetails/');
			var syncAccount = $firebase(accountRef);
			var accountDetails = syncAccount.$asObject();
			//get current object data, store current userName
			if ($scope.currentID === undefined || $scope.currentID === 'Guest') {
				$scope.userName = 'Guest';
				$scope.currentID = 'Guest';
			} else {
				accountDetails.$loaded(function (accData) {
					$scope.userName = accData.userName;
				});
			}
		} //get cookie, set currentID and $scope.userName

		var setMessage = function (message, messageStyle) {
			$scope.message = message ? message : null;
			$scope.messageStyle = messageStyle ? messageStyle : 'success';
		};
		var checkAccount = function (email, pass) {
			setMessage();
			var ref = new Firebase('https://' + appName + '.firebaseio.com/');
			ref.authWithPassword({
				email: email,
				password: pass
			}, function (error, authData) {
				if (error) {
					alert('invalid username/password');
				} else {
					alert("Successfully logged in! Credentials saved for 24 hours.");
					$scope.currentID = authData.uid;
					saveCookie();
					setTimeout(function () {
						location.reload();
					}, 500);
				}
			});
		};
		$scope.createAccount = function (userName, email, pass) {
			var ref = new Firebase('https://' + appName + '.firebaseio.com/');
			ref.createUser({
				email: email,
				password: pass
			}, function (error) {
				if (error === null) {
					var ref2 = new Firebase('https://' + appName + '.firebaseio.com/');
					ref2.authWithPassword({
						email: email,
						password: pass
					}, function (error, authData) {
						if (error) {
							alert('account created, but login failed. Please refresh and try again.');
						} else {
							$scope.currentID = authData.uid;
							setNewUser(userName, email);
							saveCookie();
							alert('Account Created Successfully! Welcome to ' + appName + ', ' + userName + '.');

							setTimeout(function () {
								location.reload();
							}, 500);
						}
					});

				} else {
					alert("Error creating user:", error);
				}
			});
		}; //register user

		var setNewUser = function (username, email) {
			var newAccountRef = new Firebase('https://' + appName + '.firebaseio.com/accounts/createdAccounts/' + $scope.currentID + '/accountDetails/');
			var syncNewAccount = $firebase(newAccountRef);
			var newAccountDetails = syncNewAccount.$asObject();
			newAccountDetails.userName = username;
			newAccountDetails.email = email;
			newAccountDetails.$save();
		};
		var saveCookie = function () {
			setMessage();
			$scope.messageStyle = 'success';
			setMessage("Succesfully logged in! Reloading page...");
			// key, value, options
			ipCookie('checkAuth', $scope.currentID, {
				expires: 24,
				expirationUnit: 'hours'
			});
		};
		$scope.deleteCookie = function () {
			setMessage();
			ipCookie.remove('checkAuth');
			if (ipCookie() === undefined) {
				setMessage('Successfully logged out.');
				setTimeout(function () {
					location.reload();
				}, 500);
			} else {
				setMessage('Unable to log out', 'danger');
			}
		};
		$scope.logIn = function (email, pass) {
			checkAccount(email, pass);
		};
	}]);


	
	
	
	
	
	
	
	
	
	
	//MAIN CONTROLLER---------------------------------------
	app.controller("MainCtrl", function ($scope, $firebase, ipCookie) {
		$scope.currentID = ipCookie('checkAuth');

		{
			if ($scope.currentID === undefined || $scope.currentID === 'Guest') {
				$scope.userName = 'Guest';
				$scope.currentID = 'Guest';
			}
		} //Check to see if current account is undefined or guest

		//SYNC DATA FROM SERVER
		var currentView = new Firebase('https://' + appName + '.firebaseio.com/accounts/' + $scope.currentID);
		var syncBullets = $firebase(currentView);
		$scope.bullets = syncBullets.$asArray();


		//BULLET BEHAVIOUR 
		//---------------------------------------------------
		$scope.NextLine = function (indx) {
			angular.element(document.querySelector('#f_' + indx))[0].focus();
		}; //called by ngDown
		$scope.BackLine = function (indx) {
			angular.element(document.querySelector('#f_' + indx))[0].focus();
		}; //called by Up

		$scope.AddBulletManually = function (indx) {
			$scope.bullets.$add({
				'primaryKey': '',
				'text': '',
				'address': indx,
				'childPointer': null,
				'parentPointer': null,
				'contentCheck': false,
				'content': ''
			});
		};
		$scope.AddInLine = function (bulobj, indx) {
			$scope.bullets.$add({
				'primaryKey': '',
				'text': '',
				'address': bulobj.address + 1,
				'hasChild': false,
				'tabIndex': 0,
				'parentPointer': null,
				'contentCheck': false,
				'content': '',
			});

			for (i = 0; i < $scope.bullets.length; i++) {
				if ($scope.bullets[i].address > bulobj.address) {
					$scope.bullets[i].address++;
					$scope.bullets.$save($scope.bullets[i]);
				}

			}

			setTimeout(function () {
				angular.element(document.querySelector('#f_' + (indx + 2)))[0].focus();
			}, 50);
		}
		$scope.DeleteCheck = function (bulobj, msg, indx, address) {
			if (bulobj.text === '' && $scope.bullets.length > 1) {
				$scope.bullets.$remove(bulobj);
				setTimeout(function () {
					angular.element(document.querySelector('#f_' + (indx)))[0].focus();
				}, 15);

				for (i = 0; i <= $scope.bullets.length - 1; i++) {
					if ($scope.bullets[i].address > address) {
						$scope.bullets[i].address--;
						$scope.bullets.$save($scope.bullets[i]);
					}
				}
			}
		}; //called by ngDelete

	});

	//KEYPRESS DIRECTIVES
	//---------------------------------------------------
	app.directive('ngDelete', function () {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if (event.which === 8) {
					scope.$apply(function () {
						scope.$eval(attrs.ngDelete);
					});

				}
			});
		};
	});
	app.directive('ngEnter', function () {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if (event.which === 13) {
					scope.$apply(function () {
						scope.$eval(attrs.ngEnter);
					});
					event.stopPropagation();

					event.preventDefault();
				}
			});
		};
	});
	//directive for keypress down
	app.directive('ngDown', function () {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if (event.which === 40) {
					scope.$apply(function () {
						scope.$eval(attrs.ngDown);
					});

					event.preventDefault();
				}
			});
		};
	});
	app.directive('ngUp', function () {
		return function (scope, element, attrs) {
			element.bind("keydown keypress", function (event) {
				if (event.which === 38) {
					scope.$apply(function () {
						scope.$eval(attrs.ngUp);
					});

					event.preventDefault();
				}
			});
		};
	});
})();