/**
 * A module to retrieve weather information. Uses the APIXU weather API.
 * @module weatherLib
 */

http = require('http');

// APIXU subscription key - check out https://www.apixu.com/ to sign up for a free developer account
var apiKey = process.env.apixu_apikey;

var options = {
    host: 'api.apixu.com',
    port: 80,
    path: '/v1/current.json?key=' + apiKey + '&q=',
    method: 'GET'
};

/** Retrieve the current weather information for a given city.
 * @param {string} query - city name
 * @param {successCallback} success - callback function that handles the response.
 * @param {errorCallback} error - callback function that handles the error.
 */
exports.currentWeather = function currentWeather(query, success, error) {
    options.path = '/v1/current.json?key=' + apiKey + '&q=' + query;
    http.request(options, function (res) {
        var responseBody = '';
        res.setEncoding('utf8');
        res.on('data', chunk => responseBody += chunk.toString());
        res.on("end", () => {
            console.log(responseBody);
            var responseObject = JSON.parse(responseBody);
            success(responseObject);
        });
    }).on('error', function (err) {
        // handle errors with the request itself
        console.error('Error with the request:', err.message);
        if (error)
            error(err);
    }).end();
}

/** Retrieve the weather forecast for a given city.
 * @param {string} query - city name
 * @param {number} noOfDays - number of days for the forecast (1 = today's weather).
 * @param {successCallback} success - callback function that handles the response.
 * @param {errorCallback} error - callback function that handles the error.
 */
exports.forecastWeather = function forecastWeather(query, noOfDays, success, error) {
    options.path = '/v1/forecast.json?key=' + apiKey + '&q=' + query + '&days=' + noOfDays;

    http.request(options, function (res) {
        var responseBody = '';
        res.setEncoding('utf8');
        res.on('data', chunk => responseBody += chunk.toString());
        res.on("end", () => {
            console.log(responseBody);
            var responseObject = JSON.parse(responseBody);
            success(responseObject);
        });
    }).on('error', function (err) {
        // handle errors with the request itself
        console.error('Error with the request:', err.message);
        if (error)
            error(err);
    }).end();
}
