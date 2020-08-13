const {
    getElections,
    findElection,
    updateElection,
    updateVoter
} = require("../utils/dbConfig");
const { validationResult } = require("express-validator");
const { ObjectID } = require("mongodb");

async function saveData(votes, election_id, positions, voter_id) {
    for (const position in votes) {
        //find the index of the selected candidate in the positions array
        const candidate_index = positions[position].findIndex(candidate => {
            return candidate.name == votes[position];
        });
        // ensure only yes votes are saved
        if (votes[position] == "No") continue;
        positions[position][candidate_index].votes += 1;
    }
    //write data to database
    await updateElection({ _id: ObjectID(election_id) }, { $set: { positions: positions }, $inc: { voter_count: 1 } });
    //update voter status
    let update = { $set: {} };
    update.$set[`elections.${election_id}`] = Object.keys(votes);
    await updateVoter({ _id: ObjectID(voter_id) }, update);
}

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
        // console.log(elections);
        res.render("voter/elections", {
            title: `Election | ${process.env.APP_NAME}`,
            position: "",
            elections
        });
    },
    async vote(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("val_errors", errors.array());
            return res.redirect("back");
        }
        /**
         * check if the request is valid and process the reques otherwise send a 404 response
         */
        if (req.params.election == undefined && req.params.position == undefined)
            return res.status("404").send("Resource does not exit");
        /**
         * check if user is registered as a voter in this
         */
        if (!req.user.elections[req.params.election]) {
            req.flash("errors", "You are not allowed to vote in this election");
            return res.redirect("back");
        }

        const elections = await findElection({
            _id: ObjectID(req.params.election)
        }, {
            projection: {
                positions: true
            }
        });
        /**
         * Get the positions and their candidates
         */
        const positions = elections.positions;
        if (!positions) {
            req.flash("errors", "The selected election has no registered candidates");
            return res.redirect("back");
        }
        const keys = Object.keys(positions);
        let current,
            next,
            candidates = [];

        /**
         * Check if the voter is starting voting process and
         * retrieve the first position and candidates otherwise
         * retrieve the next position and candidates
         */
        if (req.params.position === "first") {
            current = keys[0];
            next = keys[1];
            candidates = positions[current];
            let votes = {};
            votes[req.params.election] = {};
            req.user["votes"] = votes;
        } else if (req.params.position === "last") {
            /**
             * save votes in database
             */
            await saveData(
                req.user.votes[req.params.election], //user votes
                req.params.election, //election id
                positions, //election positions
                req.user._id //voter id
            );
            return res.render("voter/last", {
                title: `Success | ${process.env.APP_NAME}`,
                position: "Success",
                candidates: positions,
                votes: req.user.votes[req.params.election],
                next: "/voter/logout"
            });
        } else {
            current = req.params.position;
            candidates = positions[current];
            const next_index = keys.indexOf(current) + 1;
            next = next_index !== keys.length ? keys[next_index] : "last";
        }
        return res.render("voter/candidates", {
            title: `${current} | ${process.env.APP_NAME}`,
            position: current,
            election: req.params.election,
            candidates: candidates,
            next: next
        });
    },
    async saveVote(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json(errors.array());
        }

        /**
         * check if request parameters have not been tampered with
         */
        if (
            req.body.election === req.params.election &&
            req.body.position === req.params.position
        ) {
            /**
             * check if voter has already submited votes for this position
             */
            if (req.user.elections[req.body.election].includes(req.body.position)) {
                return res.json([
                    { msg: "You have already cast your vote for this position" }
                ]);
            }
            /**
             * save votes
             */

            req.user.votes[req.body.election][req.body.position] = req.body.choice;
            req.user.elections[req.body.election].push(req.body.position);
            return res.json({ msg: "Ok" });
        }
        return res.json([{ msg: "Request parameters have been tampered with" }]);
    },
    logout(req, res) {
        req.logout(req.user);
        req.session = null;
        res.redirect("/voter");
    }
};