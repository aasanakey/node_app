// const passport = require("passport");
const { Strategy } = require("passport-local");
const { url, dbName, connection, conOpts } = require("./dbConfig");
const { compare } = require("./helpers");
module.exports = function(passport) {
    // admin local strategy
    passport.use(
        "ec-signup",
        new Strategy({
                usernameField: "username",
                passwordField: "current-password"
            },
            (username, password, done) => {
                (async function() {
                    let client;
                    try {
                        /**
                         * find user with credentials
                         */
                        client = await connection.connect(url, conOpts);
                        const db = client.db(dbName);
                        const col = db.collection("admins");
                        const admin = await col.findOne({ username });
                        if (admin) {
                            /**
                             * Validate password by comparing it to the hashed password
                             */

                            const same = await compare(password, admin.password);
                            if (same === true) {
                                // provide admin details
                                done(null, admin);
                            } else {
                                // send error message on password validation failure
                                done(null, false, {
                                    message: "Invalid password"
                                });
                            }
                        } else {
                            //send error message on username validation failure
                            done(null, false, { message: "Invalid username" });
                        }
                    } catch (err) {
                        console.log(err.stack);
                        done(null, false, { message: "Invalid username or password" });
                    } finally {
                        await client.close();
                    }
                })();
            }
        )
    );

    // voters local strategy
    passport.use(
        "voter-signup",
        new Strategy({
                usernameField: "username",
                passwordField: "current-password"
            },
            (username, password, done) => {
                (async function() {
                    let client;
                    try {
                        /**
                         * find user with credentials
                         */
                        client = await connection.connect(url, conOpts);
                        const db = client.db(dbName);
                        const col = db.collection("voters");
                        const voter = await col.findOne({ username });
                        if (voter) {
                            /**
                             * Validate password by comparing it to the hashed password
                             */

                            const same = await compare(password, voter.password);
                            if (same === true) {
                                // provide admin details
                                done(null, voter);
                            } else {
                                // send error message on password validation failure
                                done(null, false, {
                                    message: "Invalid password"
                                });
                            }
                        } else {
                            //send error message on username validation failure
                            done(null, false, { message: "Invalid username" });
                        }
                    } catch (err) {
                        console.log(err.stack);
                        done(null, false, { message: "Invalid username or password" });
                    } finally {
                        await client.close();
                    }
                })();
            }
        )
    );
};