const {
    getElections,
    findElection,
    updateElection,
    updateVoter
} = require("../utils/dbConfig");
const { validationResult } = require("express-validator");
const { ObjectID } = require("mongodb");

async function saveVoteInDB(user, election_id, positions, voter_id) {
    //user = req.user.votes[req.params.election]
    const current_votes = user.votes[election_id];
    const saved_votes = user.elections[election_id];
    const current_votes_keys = Object.keys(current_votes);

    //check if current vote is not in saved votes
    current_votes_keys.forEach(key => {
        if (saved_votes.includes(key)) return;
        //find the index of the selected candidate in the positions array
        const candidate_index = positions[key].findIndex(candidate => {
            return candidate.name == current_votes[key];
        });
        // ensure only yes current_votes are saved
        if (current_votes[key] == "No") return;
        positions[key][candidate_index].votes += 1;
    });
    console.log(positions);
    //write data to database
    await updateElection({ _id: ObjectID(election_id) }, { $set: { positions: positions }, $inc: { voter_count: 1 } });
    //update voter status
    let update = { $addToSet: {} };
    update.$addToSet[`elections.${election_id}`] = { $each: current_votes_keys };
    console.log("\n\n", update);
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
            next = keys.length > 1 ? keys[1] : "last";
            candidates = positions[current];
            let votes = {};
            votes[req.params.election] = {};
            req.user["votes"] = votes;
            req.user["track_elections"] = [];
        } else if (req.params.position === "last") {
            /**
             * save votes in database
             */

            await saveVoteInDB(
                req.user, //user votes
                req.params.election, //election id
                positions, //election positions
                req.user._id //voter id
            );
            res.render("voter/last", {
                title: `Success | ${process.env.APP_NAME}`,
                position: "Success",
                candidates: positions,
                votes: req.user.votes[req.params.election],
                next: "/voter/logout"
            });

            req.logout(req.user);
            req.session = null;
            return;
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
        //console.log(req.body, req.params);
        if (
            req.body.election === req.params.election &&
            req.body.position === req.params.position
        ) {
            /**
             * check if voter has already submited votes for this position
             */
            if (
                req.user.elections[req.body.election].includes(req.body.position) ||
                req.user.track_elections.includes(req.body.position)
            ) {
                return res.json([{
                    msg: "You have already cast your vote for this position",
                    next: req.body.next_page
                }]);
            }
            /**
             * save votes
             */

            req.user.votes[req.body.election][req.body.position] = req.body.choice;
            req.user.track_elections.push(req.body.position);
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