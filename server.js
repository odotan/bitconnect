var db              = require('./db'),
    util            = require('./util'),
    express         = require('express'),
    cp              = require('child_process'),
    crypto          = require('crypto'),
    async           = require('async'),
    http            = require('http'),
    _               = require('underscore'),
    http            = require('http'),
    https           = require('https'),
    fs              = require('fs'),
    Facebook        = require('facebook-node-sdk'),
    accounts        = require('./accounts'),
    btc             = require('./btc'),
    tnx             = require('./tnx'),
    config          = require('./config');


var eh = util.eh,
    mkrespcb = util.mkrespcb,
    setter = util.cbsetter,
    pybtctool = util.pybtctool,
    FBify = util.FBify,
    dumpUser = util.dumpUser;


var app = express();

app.configure(function() {
     app.set('views',__dirname + '/views'); 
     app.set('view engine', 'jade'); app.set('view options', { layout: false });
     app.use(express.bodyParser());
     app.use(express.cookieParser());
     app.use(express.session({ secret: '314159265358979' }));
     app.use(Facebook.middleware({ appId: config.FBappId, secret: config.FBsecret }));
     app.use(express.static(__dirname + '/public'));
     app.use(app.router);
});



app.get('/', function(req,res) {                       
    var parts = req.host.split('.'),
        profileId = parts.slice(0,2).join('.');
    if (parts.length == 2) {
        res.render('welcome.jade',{});                                                           
    }
    else {
        db.User.findOne({ username: profileId },mkrespcb(res,400,function(u) {
            if (!u) res.render('welcome.jade',{})
            else res.redirect('/profile')
        }));
    }
});

app.get('/sendto', Facebook.loginRequired(), FBify(function(profile, req, res) {
    var parts = req.host.split('.'),
        profileId = parts.slice(0,2).join('.')+'.bitconnect.me';
    db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
        if (!u) res.redirect('/app/newaccount');
        else if (u.username == profileId && u.firstUse) res.redirect('/app/invitefriends');
        else if (u.username == profileId) res.redirect('/app/give');
        else res.render('sendto.jade');
    }));
}));

app.get('/login', Facebook.loginRequired(), FBify(function (profile, req, res) {
    db.User.findOne({ id: profile.id },mkrespcb(res,400,function(u) {
        if (!u) res.redirect('/app/newaccount')
        else if (u.firstUse) res.redirect('/app/invitefriends')
        else res.redirect('/app/give')
    }));
}));

// Show the app

app.get('/app/*', Facebook.loginRequired(), function(req,res) {
    res.render('index.jade');
})

app.get('/partials/:name', function(req, res) {
    res.render('partials/' + req.params.name);
});

// Show a specific page

function showpage(path,template) {
    app.get(path, Facebook.loginRequired(), FBify(function (profile, req, res) {
        res.render(template,{})
    }));
}

showpage('/profile','profile.jade');
showpage('/terms','terms.jade');

// Direct database API query

function dump(path,collection) {
    var f = function(req,res) {
        db[collection].find(req.query).toArray(mkrespcb(res,400,_.bind(res.json,res)));
    };
    app.get(path,f)
    app.post(path,f)
}

//These dumps are for testing only

dump('/fbinvitedump','FBInvite')
dump('/userdump','User')
dump('/requestdump','Request')
dump('/historydump','Transaction')

// Not for testing

dump('/userdata','User')

// All API routes

app.post('/sendbtc', Facebook.loginRequired(), btc.sendBTC)
app.get('/addressoutputs', btc.getAddressOutputs)
app.post('/addressoutputs', btc.getAddressOutputs)
app.get('/thanxaddress', btc.getThanxAddress)
app.post('/buytnx', Facebook.loginRequired(), btc.buyTNX)
app.post('/submitaddress', Facebook.loginRequired(), btc.submitAddress)
app.get('/price', btc.price)

app.post('/mkrequest', Facebook.loginRequired(), tnx.mkRequest)
app.post('/clearrequest', Facebook.loginRequired(), tnx.clearRequest)
app.get('/requests', Facebook.loginRequired(), tnx.getRequests)
app.post('/sendtnx', Facebook.loginRequired(), tnx.sendTNX)
app.get('/rawhistory', Facebook.loginRequired(), tnx.getHistory)

app.post('/register', Facebook.loginRequired(), accounts.register)
app.post('/mkinvite', Facebook.loginRequired(), accounts.mkInvite)
app.post('/acceptinvite', accounts.acceptInvite)
app.get('/kill', Facebook.loginRequired(), accounts.kill)
app.post('/kill', Facebook.loginRequired(), accounts.kill)
app.get('/me', accounts.getMe)
app.get('/friends', Facebook.loginRequired(), accounts.getFriends)
app.get('/autofill', accounts.autoFill)
app.post('/checkname', accounts.checkName)
app.get('/pic', accounts.getPic)

var options = {
    key: fs.readFileSync('/root/ssl/bitconnectwildkey.pem'),
    cert: fs.readFileSync('/root/ssl/bitconnectwildcert.pem'),
    ca: fs.readFileSync('/root/ssl/bitconnectwildca.pem')
};

http.createServer(app).listen(8000);
//https.createServer(options,app).listen(443);

return app;

