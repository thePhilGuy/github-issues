// Require Dependencies
var express = require('express'),
    app = express(),
    morgan = require('morgan'),
    path = require('path');

// Configure Express router
app.use('/rx', express.static(path.join(__dirname, '/node_modules/rx/dist/')));
app.use(express.static(path.join(__dirname, '/public')));
app.use(morgan('dev'));
app.listen(3000);

// // Defined explicitly for logging purposes.
// app.get('/', function(req, res) {
//     res.sendfile('/public/index.html');
// });
