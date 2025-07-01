require("dotenv").config(); //load content in .env file into process.env object
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const ecRoutes = require("./routes/ecRoutes");
const voterRoutes = require("./routes/voterRoute");
const { mongo_uri } = require("./utils/dbConfig");
const moment = require("moment");

const port = process.env.PORT || 3000;
const app = express();
// make the moment package glabally avialable within express
app.locals.moment = moment;
//global function to dynamically load resource path in views
app.locals.assets = url => {
    const root_path = process.env.ASSETS_URL || process.env.APP_URL;

    return root_path.concat(url);
};

// set views directory and view templating engine to use
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

/**
 *  Register all middlewares express should use in the order
 * in which they are processed
 */
app.use(morgan("tiny"));

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // for parsing application/x-www-form-urlencoded

app.use(cookieParser()); // cookie parser

// session middleware to handle sessions
const store = new MongoDBStore({
    uri: mongo_uri,
    databaseName: process.env.DB_NAME,
    collection: "session"
});
app.use(
    session({
        name: "app.connect.id",
        secret: "Pax choir-KNUST",
        resave: false,
        saveUninitialized: true,
        store: store,
        unset: "destroy"
    })
);

//connect flash to flash messages to session
app.use(flash());

//Create middleware to manage messages flashed to session in a global object _session
app.use((req, res, next) => {
    res.locals._session = {
        success: req.flash("success"),
        errors: req.flash("errors"),
        passport: req.flash("error"),
        validationResult: req.flash("val_errors")
    };

    next();
});

//passport  for authentication
require("./utils/passport-config")(app);

//  middleware to load static files from static files directory
app.use(express.static(path.join(__dirname, "../public")));

// handle get request to index page
app.get("/", function(req, res) {
    res.render("welcome", { title: process.env.APP_NAME });
});

// register router for routes to /ec/*
app.use("/ec", ecRoutes);
// register router for routes to /voter/*
app.use("/voter", voterRoutes);

// start server
app.listen(port, () => {
    console.log(`app is listening on port: ${port}`);
});