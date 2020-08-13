// const passport = require("passport");
const { Strategy } = require("passport-local");
const { getAdmin, getVoter } = require("./dbConfig");
const { compare } = require("./helpers");
module.exports = function(passport) {
    // admin local strategy
    passport.use(
        "ec-signup",
        new Strategy({
                usernameField: "username",
                passwordField: "current-password"
            },
            async(username, password, done) => {
                let admin = await getAdmin({ username });
                console.log(admin);
                if (admin) {
                    /**
                     * Validate password by comparing it to the hashed password
                     */

                    const same = await compare(password, admin.password);
                    if (same === true) {
                        // provide admin details
                        done(null, {
                            username: admin.usermame,
                            _id: admin._id
                        });
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
            async(username, password, done) => {
                const voter = await getVoter({ username });
                if (voter) {
                    /**
                     * Validate password by comparing it to the hashed password
                     */

                    const same = await compare(password, voter.password);
                    if (same === true) {
                        // provide admin details
                        done(null, {
                            _id: voter._id,
                            username: voter.username,
                            elections: voter.elections
                        });
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
            }
        )
    );
};