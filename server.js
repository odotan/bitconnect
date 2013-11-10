var db              = require('./db'),
    util            = require('./util'),
    express         = require('express'),
    Bitcoin         = require('bitcoinjs-lib'),
    cp              = require('child_process'),
    crypto          = require('crypto'),
    async           = require('async'),
    http            = require('http'),
    _               = require('underscore'),
    Facebook        = require('facebook-node-sdk');

var FBappId = '551936651494127',
    FBsecret = '3a2e02d4e014860a6b8c0ed4e91dc7f3';

var facebook = new Facebook({ appID: FBappId, secret: FBsecret });

var pybtctool = function(command, argz) {
    var cb = arguments[arguments.length - 1]
        args = Array.prototype.slice.call(arguments,1,arguments.length-1)
                    .map(function(x) { 
                        return (''+x).replace('\\','\\\\').replace(' ','\\ ')
                     })
    cp.exec('pybtctool '+command+' '+args.join(' '),cb);
}
var eh = util.eh,
    mkrespcb = util.mkrespcb;

var app = express();

app.configure(function() {
     app.set('views',__dirname + '/views'); 
     app.set('view engine', 'jade'); app.set('view options', { layout: false });
     app.use(express.bodyParser());
     app.use(express.methodOverride());
     app.use(Facebook.middleware({ appId: FBappId, secret: FBsecret }));
     app.use(app.router);
     app.use(express.static(__dirname + '/public'));
});

var smartParse = function(x) {
    return (typeof x == "string") ? JSON.parse(x) : x;
}

app.use('/',function(req,res) {                       
    res.render('welcome.jade',{});                                                           
});

app.get('/login', Facebook.loginRequired(), function (req, res) {
    req.facebook.api('/me', mkrespcb(res,400,function(err, user) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('Hello, ' + user.name + '!');
    }));
});

app.get('/checkname', function(req,res) {
    db.User.find({ username: req.param('name') },mkrespcb(res,400,function(u) {
        if (!u) res.json('available');
        else res.json('used');
    }));
});

app.get('/register', Facebook.loginRequired(), function(req, res) {
    req.facebook.api('/me', mkrespcb(res,400,function(err, user) {
        db.User.find({ username: req.param('name') },mkrespcb(res,400,function(u) {
            if (u) return res.json('Account already exists',400);
            db.User.create({ username: req.param('name'), fbUser: user, txn: 5432 })
        }));
    }));
});

app.listen(3191);

return app;
