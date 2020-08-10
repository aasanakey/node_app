const express = require("express");
const passport = require("passport");
const { ensureAdminIsAuthenticated } = require("../utils/auth");
const { check, query } = require("express-validator");
const {
    logout,
    showAdmins,
    addAdmin,
    deleteAdmin,
    showElections,
    createElection,
    deleteElection,
    startElection,
    endElection,
    showElectionCandidates,
    addElectionCandidate
} = require("../controllers/ecController");
const ecRoutes = express.Router();
ecRoutes
    .route("/")
    .get((req, res) => {
        res.render("ec/index", { title: `EC | ${process.env.APP_NAME}` });
    })
    .post((req, res, next) => {
        passport.authenticate("ec-signup", {
            successRedirect: "/ec/elections",
            failureRedirect: "/ec",
            failureFlash: true
        })(req, res, next);
    });

ecRoutes
    .route("/candidates")
    .all(ensureAdminIsAuthenticated)
    .get([query("id").isMongoId()], showElectionCandidates)
    .post(
        [
            check("election_id")
            .not()
            .notEmpty()
            .withMessage("Election field is required")
            .bail()
            .isMongoId()
            .withMessage("Election does not exist"),
            check("name")
            .not()
            .notEmpty()
            .withMessage("Candidate's name is required"),
            check("position")
            .not()
            .notEmpty()
            .withMessage("Candidate's position is required"),
            check("avatar")
            .not()
            .notEmpty()
            .withMessage("Candidate's picture is required")
        ],
        addElectionCandidate
    );

/**
 * Handle all requests to /ec/elections route
 */
ecRoutes
    .route("/elections")
    .all(ensureAdminIsAuthenticated)
    .get(showElections)
    .post(
        [
            check("name")
            .not()
            .isEmpty()
            .withMessage("Election period is required")
            .bail()
            .isString()
            .withMessage("Election period must be a string"),
            check("start")
            .not()
            .isEmpty()
            .withMessage("Election starting date is required")
            .bail()
            .custom(value => {
                if (new Date(value) < new Date()) {
                    throw new Error(
                        "Election starting date must be current datetime or valid datetime in the future"
                    );
                }
                return true;
            }),
            // .withMessage("Election starting date must be a datetime string"),
            check("end")
            .not()
            .isEmpty()
            .withMessage("Election ending date is required")
            .bail()
            .custom((value, { req }) => {
                if (new Date(value) < new Date(req.body.start)) {
                    throw new Error(
                        "Election ending date must be ahead of starting date"
                    );
                }
                return true;
            })
            // .withMessage("Election ending date must be a datetime string")
        ],
        createElection
    )
    .delete([check("id").isMongoId()], deleteElection);
ecRoutes
    .route("/elections/start")
    .patch([check("id").isMongoId()], startElection);
ecRoutes.route("/elections/end").patch([check("id").isMongoId()], endElection);

/**
 * Handle all requests to /ec/admins route
 */
ecRoutes
    .route("/admins")
    .all(ensureAdminIsAuthenticated)
    .get(showAdmins)
    .post(
        [
            check("username")
            .not()
            .isEmpty()
            .withMessage("Username  is required"),
            check("new-password")
            .not()
            .isEmpty()
            .withMessage("Password  is required")
        ],
        addAdmin
    )
    .delete([check("id").isMongoId()], deleteAdmin);

/**
 * Handle all requests to /ec/logout route
 */
ecRoutes.route("/logout").get(logout);

// export router;
module.exports = ecRoutes;