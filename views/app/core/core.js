/**
 * Angular module for 'core' component. This component is divided to following logical components:
 *
 *  views.core.dependencies
 *  views.core.auth
 *  views.core.components
 *  views.core.directives
 *  views.core.error
 *  views.core.filters
 *  views.core.interceptors
 *  views.core.layout
 *  views.core.libraries
 *  views.core.models
 *  views.core.services
 */
(function() {
  'use strict';

  // Define views.core module
  angular.module('views.core',
    [
      //'views.core.dependencies', // Note that this must be loaded first
      //'views.core.auth',
      //'views.core.components',
      //'views.core.directives',
      //'views.core.error',
      //'views.core.filters',
      //'views.core.interceptors',
      //'views.core.layout',
      //'views.core.libraries',
      //'views.core.models',
      'views.core.services'
    ]);
}());
