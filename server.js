'use strict';

const express = require('express');
const morgan = require('morgan');
// this will load our .env file if we're
// running locally. On Gomix, .env files
// are automatically loaded.
require('dotenv').config();

const {logger} = require('./utilities/logger');
// these are custom errors we've created
const {FooError, BarError, BizzError} = require('./errors');
const {ALERT_FROM_EMAIL, ALERT_FROM_NAME, ALERT_TO_EMAIL, SMTP_URL} = process.env
const app = express();
const {sendEmail} = require('./emailer');
// this route handler randomly throws one of `FooError`,
// `BarError`, or `BizzError`
const russianRoulette = (req, res) => {
  const errors = [FooError, BarError, BizzError];
  throw new errors[
    Math.floor(Math.random() * errors.length)]('It blew up!');
};


app.use(morgan('common', {stream: logger.stream}));

// for any GET request, we'll run our `russianRoulette` function
app.get('*', russianRoulette);

// YOUR MIDDLEWARE FUNCTION should be activated here using
// `app.use()`. It needs to come BEFORE the `app.use` call
// below, which sends a 500 and error message to the client

// Requirements
// 1. In the event of fooError or barError the app should send an email alert to a recipient
//    you sepcify in a config file(.env)
// 2. bizzError should not trigger email alerts.
// 3. Each alert should have a subject that looks like this: ALERT: a barError occurred
// 4. The alert email should have a from name and email address. The from name should be
//    something like 'SERVICE ALERTS'.
// 5. The body should summarize what happend and include the error message: err.message and 
//    the stack trace err.stack



// Read the requirements (no need to understand everything)
// Get the baseline
// Get a sense of the new requirements
// Choose a simple requirement, go step by step **testing every step**

app.use((err, req, res, next) => {
  // console.log('Email Error Middleware');
  
  if(err instanceof FooError || err instanceof BarError){
    logger.info(`Attempting to send email to ${ALERT_TO_EMAIL}`);
    const emailData = {
      from: ALERT_FROM_EMAIL,
      to: ALERT_TO_EMAIL,
      subject: ALERT_FROM_NAME,
      text: `An ${err.name} has occurred. Source: ${err.stack}`,
      
    }
    sendEmail(emailData);
  }

  // behavior goes here
  
  next(err);
})

app.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({error: 'Something went wrong'}).end();
});

const port = process.env.PORT || 8080;

const listener = app.listen(port, function () {
  logger.info(`Your app is listening on port ${port}`);
});
