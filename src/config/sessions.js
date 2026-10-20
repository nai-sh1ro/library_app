const session = require("express-session");
const sessionStore = require('connect-sqlite3')(session);

function sessionsConfig(app){
    app.use(session({
        store: new sessionStore({
            db: "sessions.sqlite",
            dir: "src/data"
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            maxAge: 10 * 24 * 60 * 60 * 1000 //10 дней
        }
    }));
    app.use((req, res, next) => {
        res.locals.currentUser = req.session.user || null;
        next();
    });
}

module.exports = sessionsConfig;