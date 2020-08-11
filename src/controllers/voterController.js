const { getElections } = require("../utils/dbConfig");
module.exports = {
    async showAvailableElections(req, res) {
        const elections = await getElections({
            $and: [
                { status: "active" },
                {
                    $and: [
                        { start: { $lte: new Date() } },
                        { end: { $gt: new Date() } }
                    ]
                }
            ]
        }, { projection: { name: true } });
        console.log(elections);
        res.render("voter/elections", {
            title: `Election | ${process.env.APP_NAME}`,
            position: "",
            elections
        });
    },
    async vote(req, res) {
        var position = "President";
        res.render("voter/candidates", {
            title: `${position} | ${process.env.APP_NAME}`,
            position
        });
    }
};