const express = require("express");
const {
    showAvailableElections,
    vote
} = require("../controllers/voterController");

const voterRoutes = express.Router();

voterRoutes.get("/", (req, res) => {
    res.render("voter/index", { title: `Voter | ${process.env.APP_NAME}` });
});
voterRoutes.get("/elections", showAvailableElections);

voterRoutes.get("/vote", vote);

module.exports = voterRoutes;