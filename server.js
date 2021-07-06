let express = require('express');
let flash = require('connect-flash');
let path = require('path');
let session = require('express-session');
let mongoose = require('mongoose');
let cors = require('cors');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let methodOverride = require('method-override');
let mongoStore = require('connect-mongo')(session);
let fs = require('fs');
let db_dumper = require('./config/services/db_dumper');

let app = express();

let config = require('./config')();
let userRoute = require('./routes/userRoute');
let adminRoute = require('./routes/adminRoute');
let authRoute = require('./routes/authRoute');
let apiRoute = require('./routes/apiRoute');

let i18n = require('i18n');
i18n.configure({
    //define how many languages we would support in our application
    locales: ['EN', 'PL'],

    //define the path to language json files, default is /locales
    directory: __dirname + '/locales',

    //define the default language
    defaultLocale: 'EN',

    // define a custom cookie name to parse locale settings from
    cookie: 'i18n'
});

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'allow' }));
app.use(cookieParser());
app.use(cors());
app.use(
    session({
        resave: false,
        saveUninitialized: true,
        secret: config.session_secret,
        store: new mongoStore({
            url: `mongodb://${config.mongo.host}:${config.mongo.port}/${config.mongo.db_name}`,
            collection: 'sessions'
        })
    })
);

app.use(i18n.init);
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb', extended: true }));
// app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(methodOverride('X-HTTP-Method-Override'));
app.use(flash());
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type,Accept');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

mongoose.connect(`mongodb://${config.mongo.host}:${config.mongo.port}/${config.mongo.db_name}`, { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false }, async function (err, db) {
    let d = new Date();
    if (err) {
        console.log('[' + d.toLocaleString() + '] ' + 'Sorry, there is no mongo db server running.');
    } else {
        let attachDB = function (req, res, next) {
            req.db = db;
            next();
        };
        app.use('/', attachDB, userRoute);
        app.use('/auth', attachDB, authRoute);
        app.use('/admin', attachDB, adminRoute);
        app.use('/api', attachDB, apiRoute);

        /**
         * Error Routes
         * */
        app.get('*', function (req, res, next) {
            res.render("partials/error", { session: req.session });
        });
        app.get('/404', function (req, res, next) {
            res.render("partials/error", { session: req.session });
        });

        app.listen(config.port, function () {
            console.log('[' + d.toLocaleString() + '] ' + 'Server listening ' + config.base_url);
        });

        db_dumper.start();
    }
});