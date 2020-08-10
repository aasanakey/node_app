const passport = require("passport");
require("./localstrategy")(passport);
module.exports = function(app) {
    // register the passport middeware in express app
    app.use(passport.initialize());
    //register passport session middelware in express app
    app.use(passport.session());

    // stores users in session
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    // deserialiize stored user
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
};