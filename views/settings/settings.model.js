/**
 * This file contains all necessary Angular model definitions for 'views.settings' module.
 *
 * Note that this file should only contain models and nothing else. Also note that these "models" are just basically
 * services that wraps all things together.
 */
(function () {
	'use strict';

	/**
   * Model for Setting API, this is used to wrap all Setting objects specified actions and data change actions.
   */
	angular.module('views.settings')
		.factory('SettingsModel', [
			'DataModel',
			function factory(DataModel) {
			return new DataModel('settings');
			}
		]);
}());