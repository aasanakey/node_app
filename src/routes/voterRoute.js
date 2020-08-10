const express = require("express");
// const { dbName, Client } = require("../db");

const voterRoutes = express.Router();

voterRoutes.get("/", (req, res) => {
    res.render("voter/index", { title: `Voter | ${process.env.APP_NAME}` });
});

voterRoutes.get("/candidates", (req, res) => {
    var position = "President";
    res.render("voter/candidates", {
        title: `${position} | ${process.env.APP_NAME}`,
        position
    });
});

module.exports = voterRoutes;