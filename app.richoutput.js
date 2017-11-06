/*-----------------------------------------------------------------------------
A simple weather bot for the Microsoft Bot Framework.
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var weatherLib = require('./weatherlib');


// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Create a bot with a fixed set of steps (waterfall)
var bot = new builder.UniversalBot(connector, [
    function (session) {
        builder.Prompts.text(session, 'Which location?');
    },
    function (session, results) {
        var location = results.response;

        // get a 5-day weather forecast
        weatherLib.forecastWeather(location, 5, function (data) {
            session.send(`The weather for ${data.location.name}, ${data.location.country}:`);

            var msg = new builder.Message(session);

            // use a carousel layout
            msg.attachmentLayout(builder.AttachmentLayout.carousel);

            data.forecast.forecastday.forEach(function (day) {
                // add a rich card for each forecast day
                var card = new builder.ThumbnailCard(session)
                    .title(day.date)
                    .subtitle(day.day.condition.text)
                    .text(`${day.day.mintemp_c}°C - ${day.day.maxtemp_c}°C`)
                    .images([builder.CardImage.create(session, "http:" + day.day.condition.icon)]);

                // add card to response message
                msg.addAttachment(card);
            })

            // return the reply to the user
            session.endDialog(msg);
        });
    }
]);
