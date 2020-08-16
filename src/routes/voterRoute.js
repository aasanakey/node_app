const express = require("express");
const passport = require("passport");
const { ensureVoterIsAuthenticated } = require("../utils/auth");
const {
    showAvailableElections,
    vote,
    saveVote,
    logout
} = require("../controllers/voterController");
const { param, check } = require("express-validator");

const voterRoutes = express.Router();

voterRoutes
    .route("/")
    .get((req, res) => {
        res.render("voter/index", { title: `Voter | ${process.env.APP_NAME}` });
    })
    .post((req, res, next) => {
        passport.authenticate("voter-signup", {
            successRedirect: "/voter/elections",
            failureRedirect: "/voter",
            failureFlash: true
        })(req, res, next);
        // res.redirect("/voter/elections");
    });
voterRoutes
    .route("/elections")
    .all(ensureVoterIsAuthenticated)
    .get(showAvailableElections);

voterRoutes
    .route("/vote/:election/:position")
    .all(ensureVoterIsAuthenticated)
    .get(
        [
            param("election")
            .not()
            .notEmpty()
            .withMessage("Election id is required")
            .bail()
            .isMongoId()
            .withMessage("Invalid election")
            .bail(),
            param("position")
            .not()
            .notEmpty()
            .withMessage("Position is required")
            .bail()
        ],
        vote
    )
    .post(
        [
            check("election")
            .not()
            .notEmpty()
            .withMessage("Election id is required")
            .bail()
            .isMongoId()
            .withMessage("Invalid election")
            .bail(),
            check("position")
            .not()
            .notEmpty()
            .withMessage("Position is required"),
            check("choice")
            .not()
            .notEmpty()
            .withMessage("Vote is required")
            .bail()
        ],
        saveVote
    );

// voterRoutes.get("/thanks", (req, res) => {
//     return res.render("voter/last", {
//         title: `Success | ${process.env.APP_NAME}`,
//         position: "Success",
//         candidates: req.query.candidates,
//         votes: req.query.votes,
//         next: "/voter/logout"
//     });
// });
voterRoutes.route("/logout").get(logout);

module.exports = voterRoutes;