/* eslint-disable no-prototype-builtins */
const express = require("express");
const passport = require("passport");
const { ensureAdminIsAuthenticated } = require("../utils/auth");
const { check, query, param } = require("express-validator");
const { ObjectID } = require("mongodb");
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
    addElectionCandidate,
    showElectionVoters,
    addElectionVoters,
    showElectionResults,
    importVotersFromXLSX,
    deleteVoter,
    removElectionPosition,
    removElectionCandidate
} = require("../controllers/ecController");
const { getelectionVoters, findElection } = require("../utils/dbConfig");
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
    )
    .delete();

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
            .withMessage("Election name is required")
            .bail()
            .isString()
            .withMessage("Election name must be a string"),
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
ecRoutes.route("/elections/start").patch(
    [
        check("id")
        .isMongoId()
        .custom(async value => {
            const election = await findElection({ _id: ObjectID(value) });
            if (!election.positions || Object.keys(election.positions).length < 0) {
                throw new Error("Election does not have registered candidates");
            } else {
                return value;
            }
        })
    ],
    startElection
);
ecRoutes.route("/elections/end").patch([check("id").isMongoId()], endElection);

ecRoutes.delete(
    "/election/remove/position",
    ensureAdminIsAuthenticated, [
        check("election")
        .not()
        .notEmpty()
        .withMessage("election field is required")
        .bail()
        .isMongoId(),
        check("position")
        .notEmpty()
        .withMessage("position field is required")
    ],
    removElectionPosition
);

ecRoutes.delete(
    "/election/remove/candidate",
    ensureAdminIsAuthenticated, [
        check("election")
        .not()
        .notEmpty()
        .withMessage("election field is required")
        .bail()
        .isMongoId(),
        check("position")
        .notEmpty()
        .withMessage("position field is required"),
        check("candidate")
        .not()
        .notEmpty()
        .withMessage("candidate name field is required")
    ],
    removElectionCandidate
);

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

ecRoutes
    .route("/voters/")
    .all(ensureAdminIsAuthenticated)
    .get([query("id").isMongoId()], showElectionVoters)
    .post(
        [
            check("election_id")
            .not()
            .notEmpty()
            .withMessage("Election field is required")
            .bail(),
            check("username")
            .not()
            .notEmpty()
            .withMessage("Username is required")
            .custom(async(value, { req }) => {
                let query = {};
                query[`elections.${req.body.election_id}`] = { $exists: true };
                const registeredVoters = await getelectionVoters(query);
                registeredVoters.forEach(voter => {
                    if (
                        voter.elections.hasOwnProperty(req.body.election_id) &&
                        voter.username == value
                    ) {
                        throw new Error(
                            "Voter has already been registered for this elections"
                        );
                    } else {
                        return value;
                    }
                });
            }),
            check("new-password")
            .not()
            .notEmpty()
            .withMessage("Password is required")
        ],
        addElectionVoters
    )
    .delete([check("id").isMongoId()], deleteVoter);

ecRoutes
    .route("/voters/import")
    .all(ensureAdminIsAuthenticated)
    .post(
        [
            check("election_id")
            .not()
            .notEmpty()
            .withMessage("Election field is required")
            .bail(),
            check("file")
            .not()
            .notEmpty()
            .withMessage("Upload an excel file")
        ],
        importVotersFromXLSX
    );

/**
 * Handle all requests to /ec/logout route
 */
ecRoutes.route("/logout").get(logout);

/**
 * must be the last handler for /ec/* to prevent error be throw by express validator (Invalid MongoID)
 * for other routes
 */
ecRoutes
    .route("/result/:id")
    .get([param("id").isMongoId()], showElectionResults);

// export router;
module.exports = ecRoutes;