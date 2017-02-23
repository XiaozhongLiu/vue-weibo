require('./globalHelper');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const expressValidator = require('express-validator');
const router = require('./router');
const {
    httpAuth,
    httpLog,
    cors,
    oauth,
//    validate,
} = require('./midware');
const {
    customValidators,
} = require('./util');
const config = require('./config')();

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator({customValidators}));
app.use(cookieParser(config.SECRET));
app.use(session({
    secret: config.SECRET,
    store: new RedisStore({
        port: config.REDIS_PORT,
        host: config.REDIS_HOST,
        pass: config.REDIS_PWD
    }),
    resave: true,
    saveUninitialized: true
}));

app.get(config.HTTP_AUTH.itemsReg, httpAuth);
app.use(httpLog);
app.use(cors);
app.use(oauth);
//app.use(validate.common);
app.use(router);

app.use((req, res, next) => {
    next(MessageErr('NotFound'));
});

//collection of custom error codes
let messages = require('./message');
let messageCodes = [...messages.values()].map(i => i.code);

app.use(({code = -1, message, stack}, req, res, next) => {
    res.json({code, msg: message});
    //output stack of unexpected error to console, for trouble shooting
    messageCodes.includes(code) || console.log(stack);
});

app.listen(config.API_PORT);