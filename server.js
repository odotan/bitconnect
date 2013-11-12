var db              = require('./db'),
    util            = require('./util'),
    express         = require('express'),
    Bitcoin         = require('bitcoinjs-lib'),
    cp              = require('child_process'),
    crypto          = require('crypto'),
    async           = require('async'),
    http            = require('http'),
    _               = require('underscore'),
    Facebook        = require('facebook-node-sdk'),
    http            = require('http'),
    https           = require('https'),
    fs              = require('fs');

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
    mkrespcb = util.mkrespcb,
    setter = util.cbsetter;

var FBify = function(c) {
    return function(req,res) {
        req.facebook.api('/me',mkrespcb(res,400,function(profile) {
            if (profile && profile.error)
                return res.json(profile.error,404);
            c(profile,req,res);
        }));
    }
}

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

app.get('/app', Facebook.loginRequired(), FBify(function (profile, req, res) {
    db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
        if (u) res.redirect('/invitefriends')
        else res.redirect('/newaccount')
    }));
}));

app.get('/newaccount', Facebook.loginRequired(), FBify(function (profile, req, res) {
    res.render('newaccount.jade',{})
}));

app.get('/invitefriends', Facebook.loginRequired(), FBify(function (profile, req, res) {
    res.render('invitefriends.jade',{});
}));

app.get('/giveget', Facebook.loginRequired(), FBify(function (profile, req, res) {
    res.render('giveget.jade',{});
}));

app.post('/kill', Facebook.loginRequired(), FBify(function(profile, req, res) {
    db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
        if (!u) return res.json("User not found",400); 
        db.User.remove({ id: profile.id },mkrespcb(res,400,function() {
            db.User.find({}).toArray(mkrespcb(res,400,function(users) {
                async.map(users, function(u,cb) {
                    db.User.update({ id: u.id },{
                        $set: {
                            friends: (u.friends || []).filter(function(i) {
                                return i != profile.id; 
                            }) 
                        }
                    },mkrespcb(res,400,function() {
                        db.Request.remove({ 
                            $or: [ { from: u.id }, { to: u.id } ]
                        },cb);
                    }));
                }, mkrespcb(res,400,function() {
                    res.json({ username: null, fbUser: profile });
                }));
            }));
        }));
    }));
}));

app.get('/terms',function(req,res) {
    res.render('terms.jade',{}) 
});

app.get('/me', FBify(function(profile, req, res) {
    db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
        if (u) res.json(u);
        else res.json({ username: null, fbUser: profile });
    }));
}));

app.get('/friends', Facebook.loginRequired(), function(req,res) {
    req.facebook.api('/me/friends', { 
        fields: 'id, first_name, last_name, picture'
    }, mkrespcb(res,400,function(response) {
        res.json(response.data);
    }));
});

app.post('/checkname', function(req,res) {
    db.User.findOne({ username: req.param('name') },mkrespcb(res,400,function(u) {
        if (!u) res.json('available');
        else res.json('used');
    }));
});

var consumeRequests = function (reqs, to, cb) {
    async.map(reqs,function(req,cb2) {
        db.Request.remove({ reqid: req.reqid },eh(cb2,function() {
            db.User.findOne({ id: req.from },cb2);
        }));
    },eh(cb,function(users) {
        console.log('consuming requests from',users,'to',to.first_name);
        // Uniquefy users
        var umap = {};
        users.map(function(u) { if (u) umap[u.id] = u });
        users = [];
        for (var uid in umap) users.push(umap[uid]);
        // Distribute thanx
        var reward = Math.floor(54321 / users.length);
        async.map(users,function(user,cb2) {
            // Give to each inviting user
            console.log('giving to',user.fbUser.first_name,'from',user.tnx,'to',user.tnx + reward);
            db.User.update({ id: user.id },{ 
                $set: { 
                    tnx: (user.tnx || 0) + reward,
                    friends: user.friends.concat([to.id])
                }
            },cb2);
        },eh(cb,function() {
            // Give to receiving user
            db.User.update({ id: to.id },{
                $set: {
                    tnx: 59753,
                    friends: users.map(function(u) { return u.id })
                }
            },cb);
        }));
    }));
}

app.post('/register', Facebook.loginRequired(), FBify(function(profile, req, res) {
    db.User.findOne({ username: req.param('name') }, mkrespcb(res,400,function(u) {
        if (u) return res.json('Account already exists',400);
        console.log('registering');
        var newuser = { 
            username: req.param('name'),    
            fbUser: profile,
            id: profile.id,
            tnx: 5432,
            sat: 0,
            friends: []
        }
        db.User.insert(newuser,mkrespcb(res,400,function() {
            db.Request.find({
                to: profile.id,
                accepted: true 
            }).toArray(mkrespcb(res,400,function(reqs) {
                console.log('requests found',reqs);
                consumeRequests(reqs,profile,mkrespcb(res,400,function() {
                    console.log('registered');
                    res.json(newuser);
                }));
            }));
        }));
    }));
}));

app.get('/userdump',function(req,res) {
    db.User.find({}).toArray(mkrespcb(res,400,_.bind(res.json,res)));
});

app.get('/requestdump',function(req,res) {
    db.Request.find({}).toArray(mkrespcb(res,400,_.bind(res.json,res)));
});

app.post('/mkinvite', Facebook.loginRequired(), function(req,res) {
    req.facebook.api('/me', mkrespcb(res,400,function(profile) {
        var bonus = 0;
        async.map(req.param('to'),function(to,cb) {
            var request = {
                from: profile.id,
                to: to,
                reqid: req.param('reqid')
            }
            db.Request.findOne({ from: profile.id, to: to },mkrespcb(res,400,function(r) {
                if (!r) {
                    console.log('request added',request);
                    bonus += 5432;
                    db.Request.insert(request,cb);
                }
                else {
                    console.log('request already exists')
                    cb();
                }
            }));
        }, mkrespcb(res,400,function() {
            db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
                console.log('giving to',u.fbUser.first_name,'from',u.tnx,'to',u.tnx + bonus);
                db.User.update({ id: profile.id }, {
                    $set: { tnx: (u.tnx || 0) + bonus } 
                },mkrespcb(res,400,function() {
                    console.log('requests registered, bonus:',bonus);
                    res.json({ success: true, bonus: bonus });
                }));
            }));
        }));
    }));
});

app.post('/acceptinvite', function(req, res) {
    req.facebook.api('/me', mkrespcb(res,400,function(profile) {
        var reqids = req.param('request_ids').split(',');
        console.log('reqids',reqids)
        var query = {
            reqid: { $in: reqids },
            to: profile.id
        }
        db.Request.update(query, {
            $set: { accepted: true }
        },mkrespcb(res,400,function() {
            async.map(reqids,function(reqid,cb) {
                var full_reqid = reqid+'_'+profile.id;
                req.facebook.api('/'+full_reqid,'delete',function(e,r) {
                    cb(null,e || r);
                });
            },mkrespcb(res,400,function(results) {
                console.log('updated requests',results);
                res.render('welcome.jade',{}) 
            }));
        }));
    }));
});

app.post('/give', Facebook.loginRequired(), FBify(function(profile, req, res) {
    var to = req.param('to'),
        tnx = parseInt(req.param('tnx')) || 0;
        sat = parseInt(req.param('sat')) || Math.ceil(parseFloat(req.param('btc')) * 100000000) || 0;
    var scope = {};
    async.series([
        function(cb2) {
            db.User.findOne({ id: profile.id },setter(scope,'from',cb2))
        },
        function(cb2) {
            if (!scope.from)
                return res.json('unauthorized',403);
            db.User.findOne({ username: to },setter(scope,'to',cb2));
        },
        function(cb2) {
            if (!scope.to || !scope.to.username)
                return res.json('recipient not found',404);
            if (scope.from.tnx < tnx)
                return res.json('insufficient thanx',400);
            if (scope.from.sat < sat)
                return res.json('insufficient bitpoints',400);
            cb2();
        },
        function(cb2) {
            db.User.update({ id: profile.id }, { $set: {
                tnx: (scope.from.tnx || 0) - tnx,
                sat: (scope.from.sat || 0) - sat
            } },cb2);
        },
        function(cb2) {
            db.User.update({ username: to }, { $set: {
                tnx: (scope.to.tnx || 0) + tnx,
                sat: (scope.to.sat || 0) + sat
            } },cb2);
        }
    ], mkrespcb(res,400, function() { res.json('success') }))
}));

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

http.createServer(app).listen(80);
https.createServer(options,app).listen(443);

return app;

