//    Aebleskiver
//    (c) 2011 Beau Sorensen
//    Aebleskiver may be freely distributed under the MIT license.
//    For all details and documentation:
//    https://github.com/sorensen/aebleskiver

// Application Server
// ------------------
require.paths.unshift(__dirname + '/lib');

// Dependencies
var express      = require('express'),
    SessionStore = require('connect-mongodb'),
    Mongoose     = require('mongoose');
    Misc         = require('backbone-misc'),
    PubSub       = require('backbone-pubsub'),
    CRUD         = require('backbone-crud'),
    Gravatar     = require('backbone-gravatar'),
    Auth         = require('backbone-auth'),
    DNode        = require('dnode'),
    version      = '0.3.2',
    port         = 8080,
    secret       = 'abcdefghijklmnopqrstuvwxyz',
    token        = '',
    app          = module.exports = express.createServer();

// Connect to the database
Mongoose.connect('mongodb://localhost/aebleskiver');

// Server configuration
app.configure(function() {
    // View settings
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.set('view engine', 'jade');
    app.set('view options', {layout : false});
    
    // Session settings
    app.use(express.session({
        cookie : {maxAge : 60000 * 60 * 1},
        secret : secret,
        store  : new SessionStore({
            dbname   : 'db',
            username : '',
            password : ''
        })
    }));
});
    
// Development specific configurations
app.configure('development', function(){
    app.use(express.static(__dirname + '/public'));
    app.use(express.errorHandler({
        // Make sure we can see our errors
        // and stack traces for debugging
        dumpExceptions : true, 
        showStack      : true 
    }));
});

// Production specific configurations
app.configure('production', function() {
    port = 80;
    app.use(express.static(__dirname + '/public', {
        // Set the caching lifetime to one year
        maxAge: 60000 * 60 *  24 * 365
    }));
    app.use(express.errorHandler());
});

// Main application
app.get('/', function(req, res) {
    token = req.session.id;
    //req.session.regenerate(function () {
        //token = req.session.id;
    //});
    
    res.render('index.jade', {
        locals : {
            port    : port,
            version : version,
            token   : token,
        }
    });
});

// Start application if not clustered
if (!module.parent) {
    app.listen(port);
}

// Configure DNode middleware
DNode()
    .use(Auth)      // Authentication support
    .use(PubSub)    // Pub/sub channel support
    .use(CRUD)      // Backbone integration
    .use(Gravatar)  // Gravatar integration
    .use(Misc)      // Misc. resources
    .listen(app)    // Start your engines!
