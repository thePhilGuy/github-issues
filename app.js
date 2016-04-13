// Require Dependencies
var express = require('express'),
    app = express(),
    morgan = require('morgan'),
    path = require('path');

// Configure Express router
app.use('/scripts', express.static(path.join(__dirname, '/node_modules/rx/dist/')));
app.use(morgan('dev'));
app.listen(8000);

app.get('/', function(req, res) {
    res.send('<script src="scripts/rx.all.js"></script>');
});
