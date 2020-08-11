module.exports = {
    ensureAdminIsAuthenticated: function(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash("errors", "Please log in to view that resource");
        res.redirect("/ec");
    },
    ensureVoterIsAuthenticated: function(req, res, next) {
        // if (req.isAuthenticated()) {
        return next();
        // }
        // req.flash("errors", "Please log in to view that resource");
        // res.redirect("/voter/");
    }
};