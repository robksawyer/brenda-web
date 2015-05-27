/**
 * This file contains all necessary Angular controller definitions for 'frontend.settings' module.
 *
 * Note that this file should only contain controllers and nothing else.
 */
(function() {
	'use strict';


	// Controller to show settings in GUI.
	angular.module('frontend.views.settings')
		.controller('SettingsController', [
			'$scope', '$http', '$window'
			function controller( $scope, $http, $window ) {

				$scope.amazonSettings  = {};
				// create a blank object to hold our form information
				// $scope will allow this to pass between controller and view
				$http.get('/settings/1', function(response) {
					$scope.amazonSettings = response.data;
				},
				function(errorResponse){
					//Error occured
				});

				$window.alert($scope.amazonSettings);

			}
		]);

}());