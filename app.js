// Require Dependencies
var express = require('express'),
    app = express(),
    morgan = require('morgan'),
    path = require('path'),
    swig = require('swig');

// Configure Express router
app.use('/rx', express.static(path.join(__dirname, '/node_modules/rx/dist/')));
app.use('/scripts', express.static(path.join(__dirname, '/js')));
app.set('views', path.join(__dirname, '/html'));
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.use(morgan('dev'));
app.listen(8000);

// None of the data comes from our server
// We only need to serve one page
app.get('/', function(req, res) {
    res.render('index');
});
