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

// Create a bot with a default intent handler
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("I didn't get that. Can you try again?");
});

// Configure for LUIS NLP
var model = process.env.LuisModelUri;
bot.recognizer(new builder.LuisRecognizer(model));

// Configure Q&A
var qnarecognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgeBaseId,
    subscriptionKey: process.env.QnASubscriptionKey,
    top: 4
});
bot.recognizer(qnarecognizer);


// GetWeatherForecast intent
bot.dialog('GetWeatherForecast', [
    function (session, args, next) {
        var intent = args.intent;

        // was a location passed in by the user, if not, ask a location from the user
        if (intent) {
            var cityEntity = builder.EntityRecognizer.findEntity(intent.entities, 'builtin.geography.city');
            if (cityEntity) {
                next({ response: cityEntity.entity });
            } else {
                builder.Prompts.text(session, "Which location? ");
            }
        } else {
            builder.Prompts.text(session, "Which location? ");
        }
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
]).triggerAction({
    matches: 'GetWeatherForecast'
});


// Greeting intent
bot.dialog('Greeting', function (session) {
    session.send("Hi, I'm the weather bot. You can ask me about the weather.");
}).triggerAction({
    matches: 'Greeting'
});


// Handle questions through Q&A Maker
bot.dialog('QnA',
    function (session, args, next) {
        var answerEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'answer');
        session.send(answerEntity.entity);
        session.endDialog('*Information provided by CDC (https://www.cdc.gov/disasters/winter/faq.html).*');
    }
).triggerAction({
    matches: 'qna'
});
