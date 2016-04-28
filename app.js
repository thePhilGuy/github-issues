// Require Dependencies
var express = require('express'),
    app = express(),
    morgan = require('morgan'),
    path = require('path');

// Configure Express router
app.use('/rx', express.static(path.join(__dirname, '/node_modules/rx/dist/')));
app.use('/semantic', express.static(path.join(__dirname, '/node_modules/semantic-ui/dist/')));
app.use('/showdown', express.static(path.join(__dirname, '/node_modules/showdown/dist/')));
app.use(express.static(path.join(__dirname, '/public')));
app.use(morgan('combined'));
app.listen(3000);
