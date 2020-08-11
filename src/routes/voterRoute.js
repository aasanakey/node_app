const express = require("express");
const passport = require("passport");
const { ensureVoterIsAuthenticated } = require("../utils/auth");
const {
    showAvailableElections,
    vote
} = require("../controllers/voterController");

const voterRoutes = express.Router();

voterRoutes
    .route("/")
    .get((req, res) => {
        res.render("voter/index", { title: `Voter | ${process.env.APP_NAME}` });
    })
    .post((req, res, next) => {
        // passport.authenticate("voter-signup", {
        //     successRedirect: "/voter/elections",
        //     failureRedirect: "/voter",
        //     failureFlash: true
        // })(req, res, next);
        res.redirect("/voter/elections");
    });
voterRoutes
    .route("/elections")
    .all(ensureVoterIsAuthenticated)
    .get(showAvailableElections);

voterRoutes
    .route("/vote")
    .all(ensureVoterIsAuthenticated)
    .get(vote);

module.exports = voterRoutes;