/**
 * Angular API Factory
 *
 * Gets an object literal with a desired API's structure and based on it, creates a well defined interface to handle ajax calls ($http).
 *
 * Check: https://github.com/DiegoZoracKy/AjaxAPIFactory
 *
 * @author Diego ZoracKy | @DiegoZoracKy | http://diegozoracky.com
 */

(function() {
	'use strict';

	var module = angular.module('apiFactory', []);

	module.factory('ApiFactoryAjax', ['$http', '$q',

		function($http, $q) {

			function apiCall(schema, data) {

				var config = angular.extend({}, schema);

				if (schema.extendConfig)
					schema.extendConfig(config, data);

				config.data = (schema.data && schema.data.defaults) ? angular.extend({}, schema.data.defaults, data) : data;

				if (schema.data && (schema.data.validate || typeof schema.data.validate == 'undefined')) {
					var requiredOk = true;

					for (var i in schema.data.required) {
						requiredOk &= !!(config.data[schema.data.required[i]] || (typeof config.data[schema.data.required[i]] == 'number' && config.data[schema.data.required[i]] !== null));
					}

					if (!requiredOk) {
						var promise = $q.reject('Missing required params :: ' + schema.data.required.join(', ') + ". Current params :: " + Object.keys(config.data).join(', '));

						promise.error = function(fn) {
							return promise.then(null, function(rejectData) {
								fn(rejectData, null, null, config);
							});
						};

						return promise;
					}
				}

				if (!schema.method || 'get' == schema.method.toLowerCase())
					config.params = config.data;

				if (config.headers && config.headers['Content-Type'].indexOf('www-form') >= 0)
					config.data = dataToQueryString(config.data);

				return $http(config);
			}

			function createMethod(api) {
				return function(data) {
					return apiCall.call(this, api, data);
				};
			}

			function makeApi(api, schema) {
				for (var key in schema) {
					if (schema[key].apiSchema) {
						api[key] = createMethod(schema[key].apiSchema);
						api[key].schema = schema[key].apiSchema;
					} else {
						api[key] = {};
						makeApi(api[key], schema[key]);
					}
				}
			}

			return function ApiFactoryAjax(schema) {
				makeApi(this, schema);
			};
		}
	]);

	function dataToQueryString(obj) {
		var queryString = [];
		for (var k in obj)
			queryString.push(k + '=' + obj[k]);

		return queryString.join('&');
	}

}());