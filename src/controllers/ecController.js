const {
    insertElection,
    updateElection,
    getElections,
    findElection,
    removeElection,
    insertAdmin,
    removedAdmin,
    getAdmins,
    addCandidate,
    getelectionVoters,
    addVoters,
    removeVoter,
    countCollectionDocuments
} = require("../utils/dbConfig");
const { ObjectId } = require("mongodb");
const {
    hash,
    extractFilePondEncodedImage,
    base64FileToBuffer
} = require("../utils/helpers");
const { validationResult } = require("express-validator");

const xlsx = require("xlsx");

module.exports = {
    logout(req, res) {
        req.logout(req.user);
        req.session = null;
        res.redirect("/ec");
    },
    /**
     * Render admins view
     * @param {*} req
     * @param {*} res
     */
    async showAdmins(req, res) {
        const admins = await getAdmins({}, { projection: { username: true } });
        res.render("ec/admins", {
            title: `EC - Admins | ${process.env.APP_NAME}`,
            admins
        });
    },

    /**
     * create a new admin
     * @param {*} req
     * @param {*} res
     */
    async addAdmin(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("val_errors", errors.array());
            return res.redirect("back");
        }
        //create admin object from input data
        let data = {
            username: req.body.username.trim(),
            password: req.body["new-password"].trim()
        };
        data.password = await hash(data.password); //hash plain text password
        const result = await insertAdmin(data);
        //flash appropriate message to session
        if (result.count === 1) {
            req.flash("success", "Admin added succesfully");
            return res.redirect("back");
        } else {
            req.flash("errors", "Failed to add admin");
            return res.redirect("back");
        }
    },

    /**
     * delete an admin
     * @param {*} req
     * @param {*} res
     */
    async deleteAdmin(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            //    req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid id" });
        }

        const admin = await removedAdmin({ _id: ObjectId(req.body.id) });
        if (admin != null) {
            res.json({ msg: "Admin deleted successfully." });
        } else {
            res.json({ msg: "Admin does not exists" });
        }
    },
    /**
     * Create a new election
     * @param {*} req
     * @param {*} res
     */
    async createElection(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("val_errors", errors.array());
            return res.redirect("back");
        }
        // create new election object
        const election = {
            name: req.body.name,
            start: new Date(req.body.start),
            end: new Date(req.body.end),
            status: "pending",
            voter_count: 0
                // positions: {}
        };
        const r = await insertElection(election);

        if (r.count === 1) {
            req.flash("success", "Election created succesfully");
            res.redirect("back");
        } else {
            req.flash("errors", "Failed to create Election");
            res.redirect("back");
        }
    },
    /**
     * Render elections view
     * @param {*} req
     * @param {*} res
     */
    async showElections(req, res) {
        // Fetch all elections from db asynchronously
        const elections = await getElections({}, {
            projection: {
                name: true,
                start: true,
                end: true,
                status: true
            }
        });
        // console.log(elections);
        res.render("ec/elections", {
            title: `EC | Elections | ${process.env.APP_NAME}`,
            elections
        });
    },
    /**
     * Delete election
     * @param {*} req
     * @param {*} res
     */
    async deleteElection(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid id" });
        }

        const admin = removeElection({ _id: ObjectId(req.body.id) });
        if (admin != null) {
            res.json({ msg: "Election deleted successfully." });
        } else {
            res.json({ msg: "Election does not exists" });
        }
    },
    async startElection(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // req.flash("val_errors", errors.array());
            return res.json(errors.array());
        }
        const result = await updateElection({ _id: ObjectId(req.body.id) }, { $set: { status: req.body.status } });
        if (result._id) {
            res.json({ msg: "Election succesfully started" });
        } else {
            res.json({ msg: "Failed to start election" });
        }
    },
    async endElection(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid id" });
        }
        const result = await updateElection({ _id: ObjectId(req.body.id) }, { $set: { status: req.body.status } });
        if (result._id) {
            res.json({ msg: "Election ended succesfully" });
        } else {
            res.json({ msg: "Failed to end election" });
        }
    },
    /**
     * Render candidates view
     * @param {*} req
     * @param {*} res
     */
    async showElectionCandidates(req, res) {
        const elections = await getElections({}, {
            projection: {
                name: true,
                start: true
            }
        });
        /**
         * Check if there is a query atatched to the request
         * if there is handle the query and send response
         */
        if (req.query.id !== undefined) {
            /**
             * check if query is valid
             */
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.json({ msg: "Invalid id" });
            }
            let positions = await findElection({ _id: ObjectId(req.query.id) }, { projection: { positions: true } });
            // positions = positions.positions;
            if (positions === undefined) return res.json("error");
            return res.json(positions);
        }
        res.render("ec/candidates", {
            title: `EC - Candidates |  ${process.env.APP_NAME}`,
            elections
        });
    },
    async addElectionCandidate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("val_errors", errors.array());
            return res.redirect("back");
        }
        req.body.avatar = extractFilePondEncodedImage(req.body.avatar);

        const result = await addCandidate(req.body);
        if (result._id) {
            req.flash("success", "Candidate added");
        } else {
            req.flash("errors", "Failed to add candidate");
        }
        res.redirect("back");
    },

    async showElectionVoters(req, res) {
        const elections = await getElections({}, {
            projection: {
                name: true,
                start: true
            }
        });
        if (req.query.id !== undefined) {
            /**
             * check if query is valid
             */
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.json({ msg: "Invalid id" });
            }
            const election = await findElection({ _id: ObjectId(req.query.id) }, { projection: { _id: true } });
            if (election._id != req.query.id) return res.json({ msg: "Invalid id" });
            let query = {};
            query[`elections.${req.query.id}`] = { $exists: true };
            const voters = await getelectionVoters(query, {
                projection: { password: false }
            });
            return res.json(voters);
        }
        res.render("ec/voters", {
            title: `EC - Voters | ${process.env.APP_NAME}`,
            elections
        });
    },
    async addElectionVoters(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // const input = [req.body.election_id,req.body.username]
            req.flash("val_errors", errors.array());
            return res.redirect("back");
        }

        /**
         * Add voter object and add to collection
         */
        let data = {
            username: req.body.username.trim(),
            password: req.body["new-password"].trim(),
            elections: {}
        };
        data.password = await hash(data.password); //hash plain text password
        data.elections[req.body.election_id] = [];
        const result = await addVoters([data]);
        //flash appropriate message to session
        if (result.insertedCount > 0) {
            req.flash("success", "Voter added succesfully");
            return res.redirect("back");
        } else {
            req.flash("errors", "Failed to add voter");
            return res.redirect("back");
        }
    },

    async showElectionResults(req, res) {
        const election = await findElection({ _id: ObjectId(req.params.id) });
        if (!election.positions) {
            req.flash("errors", "Election has no candidates");
            return res.redirect("back");
        }
        //compute total votes for each positon
        // const total_votes = {};
        // let actual_voter_count = 0;
        // Object.keys(election.positions).forEach(position => {
        //     total_votes[position] = 0;
        //     election.positions[position].forEach(candidate => {
        //         total_votes[position] += candidate.votes;
        //     });
        //     actual_voter_count = Math.max(total_votes[position], actual_voter_count);
        //     // console.log(actual_voter_count);
        // });
        let filer_registered_voters = {};
        let filer_voters_has_voted = {};
        filer_registered_voters[`elections.${req.params.id}`] = { $exists: true };
        filer_voters_has_voted[`elections.${req.params.id}`] = {
            $exists: true,
            $ne: []
        };
        const registered_voters = await countCollectionDocuments(
            "voters",
            filer_registered_voters
        );
        const voters_has_voted = await countCollectionDocuments(
            "voters",
            filer_voters_has_voted
        );
        console.log(registered_voters, voters_has_voted);
        res.render("ec/election_result", {
            title: `EC - Results | ${process.env.APP_NAME}`,
            election,
            total_votes: voters_has_voted,
            total_registered_voters: registered_voters
        });
    },
    async importVotersFromXLSX(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("val_errors", errors.array());
            return res.redirect("back");
        }
        const buf = base64FileToBuffer(req.body.file);
        const workbook = xlsx.read(buf, { type: "buffer" });
        let voters = [];
        /**
         * loop through all the woorksheets in the excel workbook
         */
        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);
            /**
             * add election id to each user,hash password and
             */
            voters = data.map(voter => {
                let elections = {};
                elections[req.body.election_id] = [];
                voter["elections"] = elections;
                voter.username = voter.username.trim();
                voter.password = voter.password.trim();
                hash(voter.password).then(password => (voter.password = password));
                return voter;
            });
        });

        const result = await addVoters(voters);
        //flash appropriate message to session
        if (result.insertedCount > 0) {
            req.flash("success", "Voters added succesfully");
            return res.redirect("back");
        } else {
            req.flash("errors", "Failed to add voters");
            return res.redirect("back");
        }
    },
    async deleteVoter(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid Voter id" });
        }
        const voter = removeVoter({ _id: ObjectId(req.body.id) });
        if (voter != null) {
            res.json({ msg: "Voter deleted successfully." });
        } else {
            res.json({ msg: "Voter does not exists" });
        }
    },
    async removElectionPosition(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid Voter id" });
        }
        let update = { $unset: {} };

        update.$unset[`positions.${req.body.position}`] = "";
        const r = await updateElection({ _id: ObjectId(req.body.election) },
            update
        );
        if (r) return res.json({ position: req.body.position });
        return res.json({ msg: "Cannot delete postion" });
    },
    async removElectionCandidate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid Voter id" });
        }
        let update = { $pull: {} };
        update.$pull[`positions.${req.body.position}`] = {
            name: req.body.candidate
        };
        const r = await updateElection({ _id: ObjectId(req.body.election) },
            update
        );
        if (r) return res.json({ candidate: req.body.candidate });
        return res.json({ msg: "Cannot delete candidate" });
    },
    async editCandidate(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            //req.flash("val_errors", errors.array());
            return res.json(errors.array());
        }
        let new_info = {};
        if (req.body.new_name) {
            new_info.name = req.body.new_name;
        }
        if (req.body.new_avatar) {
            new_info.image = extractFilePondEncodedImage(req.body.new_avatar);
        }
        //form the filter query
        let filter = { _id: ObjectId(req.body.election) };
        filter[`positions.${req.body.position}.name`] = req.body.old_name;
        let update = { $set: {} };
        // update.$set[`positions.${req.body.position}.$`] = {};
        let result;

        if (new_info.name !== undefined && new_info.new_avatar !== undefined) {
            update.$set[`positions.${req.body.position}.name`] = new_info.name;
            update.$set[`positions.${req.body.position}.image`] = new_info.image;
            result = await updateElection(filter, update);
        } else if (
            new_info.name !== undefined &&
            new_info.new_avatar === undefined
        ) {
            update.$set[`positions.${req.body.position}.name`] = new_info.name;
            result = await updateElection(filter, update);
        } else if (
            new_info.name === undefined &&
            new_info.new_avatar !== undefined
        ) {
            update.$set[`positions.${req.body.position}.image`] = new_info.image;
            result = await updateElection(filter, update);
        }
        console.log(filter, update);
        res.json(result);
    }
};