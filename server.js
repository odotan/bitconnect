var db = require('./db'),
    util = require('./util'),
    express = require('express'),
    cp = require('child_process'),
    crypto = require('crypto'),
    async = require('async'),
    http = require('http'),
    _ = require('underscore'),
    http = require('http'),
    https = require('https'),
    fs = require('fs'),
    Facebook = require('facebook-node-sdk'),
    accounts = require('./accounts'),
    btc = require('./btc'),
    tnx = require('./tnx'),
    config = require('./config');
Facebook.registerRequired = function(config) {
    return function(req, res, next) {
        Facebook.loadRegisteredUser(config)(req, res, function() {
            if (!req.registeredUser) {
                res.redirect('/app/newaccount');
            }
            else {
                next();
            }
        });
    }
}
Facebook.loadRegisteredUser = function(config) {
    return function(req, res, next) {
        if (!req.facebook) {
            Facebook.middleware(config)(req, res, afterNew);
        } else {
            afterNew();
        }

        function afterNew() {
            req.facebook.getUser(function(err, user) {
                if (err == undefined && user !== 0) {
                    db.User.findOne({
                        id: user
                    }, function(err, u) {
                        req.registeredUser = u;
                        next();
                    });
                } else {
                    next();
                }
            });
        }
    };
};

var eh = util.eh,
    mkrespcb = util.mkrespcb,
    setter = util.cbsetter,
    pybtctool = util.pybtctool,
    FBify = util.FBify,
    dumpUser = util.dumpUser;


var app = express();

/*
//TODO: use env for production
//express defaults:  this.set('env', process.env.NODE_ENV || 'development');
app.set("env", "production");
app.configure("production", function(){

});
app.configure("development", function(){

});
*/

app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.set('view options', {
        layout: false
    });
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({
        secret: '314159265358979'
    }));
    app.use(Facebook.middleware({
        appId: config.FBappId,
        secret: config.FBsecret
    }));
    app.use(express.static(__dirname + '/public'));
    app.use(app.router);
    app.use(function(req, res, next) {
        res.setHeader("X-Frame-Options", "SAMEORIGIN");
        return next();
    });
});


//app.get('/', Facebook.isRegistered(), function(req,res) {                       
app.get('/', Facebook.loadRegisteredUser({}), function(req, res) {
    var parts = req.host.split('.'),
        profileId = parts.slice(0, 3).join('.');
    if (parts.length <= 2) {
        if (req.registeredUser) {
            res.redirect('/app/thanx');
        } else {
            res.render('welcome.jade', {});
        }
    } else if (req.url.length <= 1) {
        db.User.findOne({
            username: profileId
        }, mkrespcb(res, 400, function(u) {
            if (!u) {
                res.redirect('http://' + req.headers.host.split('.').slice(1, 3).join('.'));
            }
            else {
                res.redirect('http://' + req.headers.host.split('.').slice(1, 3).join('.') + req.url + 'profile/' + u.id);
            }
        }));
    }
});

app.get('/sendto', Facebook.loginRequired(), FBify(function(profile, req, res) {
    var parts = req.host.split('.'),
        profileId = parts.slice(0, 2).join('.') + '.bitconnect.me';
    db.User.findOne({
        id: profile.id
    }, mkrespcb(res, 400, function(u) {
        if (!u) res.redirect('/app/newaccount');
        else if (u.username == profileId && u.firstUse) res.redirect('/app/us');
        else if (u.username == profileId) res.redirect('/app/give');
        else res.render('sendto.jade');
    }));
}));

app.get('/login', Facebook.loginRequired(), FBify(function(profile, req, res) {
    db.User.findOne({
        id: profile.id
    }, mkrespcb(res, 400, function(u) {
        if (!u) res.redirect('/app/newaccount')
        else if (u.firstUse) res.redirect('/app/us')
        else res.redirect('/app/give')
    }));
}));

app.post('/logout', Facebook.loginRequired(), FBify(function(profile, req, res) {
    res.render('welcome.jade', {});
    req.facebook.destroySession();
}));

// Show the app
app.get('/app/newaccount', Facebook.loadRegisteredUser(), function(req, res) {
    if (req.registeredUser) {
        res.redirect('/app/us');
    }
    res.render('newaccount.jade');
});
app.get('/app/*', Facebook.registerRequired(), function(req, res) {
    res.render('index.jade');
});

app.get('/profile/*', function(req, res) {
    res.render('profile-index.jade');
})

app.get('/partials/:name', function(req, res) {
    res.render('partials/' + req.params.name);
});

// Show a specific page

function showpage(path, template) {
    app.get(path, function(req, res) {
        res.render(template, {})
    });
}

showpage('/terms', 'terms.jade');
showpage('/audit', 'audit.jade');

// Direct database API query

function dump(path, collection) {
    var f = function(req, res) {
        db[collection].find(req.query).toArray(mkrespcb(res, 400, _.bind(res.json, res)));
    };
    app.get(path, f);
    app.post(path, f);
}

//These dumps are for testing only

dump('/fbinvitedump', 'FBInvite');
dump('/userdump', 'User');
dump('/requestdump', 'Request');
dump('/historydump', 'Transaction');

// Not for testing

dump('/userdata', 'User');

// All API routes

app.post('/sendbtc', Facebook.loginRequired(), btc.sendBTC);
app.get('/addressoutputs', btc.getAddressOutputs);
app.post('/addressoutputs', btc.getAddressOutputs);
app.get('/thanxaddress', btc.getThanxAddress);
app.post('/buytnx', Facebook.loginRequired(), btc.buyTNX);
app.post('/submitaddress', Facebook.loginRequired(), btc.submitAddress);
app.get('/price', btc.price);
app.get('/fetchheight', btc.fetchHeight);

app.post('/mkrequest', Facebook.loginRequired(), tnx.mkRequest);
app.post('/clearrequest', Facebook.loginRequired(), tnx.clearRequest);
app.get('/incomingrequests', Facebook.loginRequired(), tnx.getIncomingRequests);
app.get('/outgoingrequests', Facebook.loginRequired(), tnx.getOutgoingRequests);
app.post('/sendtnx', Facebook.loginRequired(), tnx.sendTNX);
app.post('/acceptgive', Facebook.loginRequired(), tnx.acceptGive);
app.get('/rawhistory', Facebook.loginRequired(), tnx.getHistory);

app.post('/register', Facebook.loginRequired(), accounts.register);
app.post('/mkinvite', Facebook.loginRequired(), accounts.mkInvite);
app.post('/acceptinvite', accounts.acceptInvite);
app.get('/acceptinvite', accounts.acceptInvite);
app.post('/acceptinvite2', Facebook.loginRequired(), accounts.acceptInvite2);
app.get('/acceptinvite2', Facebook.loginRequired(), accounts.acceptInvite2);
app.get('/kill', Facebook.loginRequired(), accounts.kill);
app.post('/kill', Facebook.loginRequired(), accounts.kill);
app.get('/me', accounts.getMe);
app.get('/friends', Facebook.loginRequired(), accounts.getFriends);
app.get('/autofill', accounts.autoFill);
app.get('/user', accounts.getUserById);
app.post('/checkname', accounts.checkName);
app.get('/pic', accounts.getPic);
app.get('/auditdata', accounts.printVerificationTable);
app.get('/verificationseed', Facebook.loginRequired(), accounts.printMyVerificationSeed);

setInterval(btc.updateBTCTxs, 60000);
setTimeout(btc.updateBTCTxs, 1000);

var options = {
    key: fs.readFileSync('ssl/bitconnectwildkey.pem'),
    cert: fs.readFileSync('ssl/bitconnectwildcert.pem'),
    ca: fs.readFileSync('ssl/bitconnectwildca.pem')
};

var dev= false;
if (dev) {
    http.createServer(app).listen(8000);
} else {
    express()
        .get('*', function(req, res) {
            res.redirect('https://' + req.host + req.url);
        })
        .listen(80);
    https.createServer(options, app).listen(443);
}

return app;