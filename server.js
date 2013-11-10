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

var FBappId = '761433597207088',
    FBsecret = '483c2bafec24598467c82270bbde6dbc';

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
     app.use(express.cookieParser());
     app.use(express.session({ secret: '314159265358979' }));
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
    req.facebook.api('/me', mkrespcb(res,400,function(profile) {
        res.render('app.jade',{});
    }));
});

app.post('/kill', Facebook.loginRequired(), function(req, res) {
    req.facebook.api('/me', mkrespcb(res,400,function(profile) {
        db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
            if (!u) return res.json("User not found",400); 
            db.User.remove({ id: profile.id },mkrespcb(res,400,function() {
                res.json({ username: null, fbUser: profile });
            }));
        }));
    }));
});

app.get('/terms',function(req,res) {
    res.render('terms.jade',{}) 
});

app.get('/me', Facebook.loginRequired(), function(req,res) {
    req.facebook.api('/me', mkrespcb(res,400,function(profile) { 
        db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
            if (u) res.json(u);
            else res.json({ username: null, fbUser: profile });
        }));
    }));
});

app.post('/checkname', function(req,res) {
    db.User.findOne({ username: req.param('name') },mkrespcb(res,400,function(u) {
        if (!u) res.json('available');
        else res.json('used');
    }));
});

app.post('/register', Facebook.loginRequired(), function(req, res) {
    req.facebook.api('/me', mkrespcb(res,400,function(profile) {
        db.User.findOne({ username: req.param('name') }, mkrespcb(res,400,function(u) {
            if (u) return res.json('Account already exists',400);
            var newuser = { 
                username: req.param('name'),    
                fbUser: profile,
                id: profile.id,
                tnx: 5432 
            }
            req.param(newuser);
            db.User.insert(newuser,mkrespcb(res,400,function() {
                res.json(newuser);
            }));
        }));
    }));
});

app.listen(3191);

return app;

