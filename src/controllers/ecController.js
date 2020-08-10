const {
    url,
    dbName,
    connection,
    conOpts,
    insertElection,
    updateElection,
    getElections,
    insertAdmin,
    removedAdmin,
    getAdmins
} = require("../utils/dbConfig");
const { ObjectId } = require("mongodb");
const { hash, extractFilePondEncodedImage } = require("../utils/helpers");
const { validationResult } = require("express-validator");

// TODO  valid p- 5f312ae0280ddf0c98c16406  np-5f313d622378f422c81ada25   invalid -5f2f620f862d5d0954091c27
async function addCandidate(candidate) {
    //exit if candidate object does'nt have the required properties
    if (!candidate.election_id && !candidate.position) return false;
    // obtain the elections document from the database
    const result = await getElections({
        _id: ObjectId(candidate.election_id)
    });
    const election = result.length === 1 ? result[0] : null;
    if (election === null) return false;
    let positions = election.positions;
    /**
     * check if election document has  positions field object
     * if not we create one and add candidate to the candidates array
     * if document has positions field object we add new candidate to the positions candidates array
     */
    // console.log("before if", positions);
    if (positions === undefined) {
        // console.log("in if 1", positions);
        let posObj = {};
        posObj[candidate.position] = [{
            name: candidate.name,
            image: candidate.avatar
        }];
        positions = posObj;
        // console.log("in if z", positions);
    } else {
        // console.log("in else 1", positions);
        /**
         * check if candidates position exist in positions object if not we create the field
         *
         */
        switch (candidate.position in positions) {
            case false:
                positions[candidate.position] = [{
                    name: candidate.name,
                    image: candidate.avatar
                }];
                break;

            default:
                positions[candidate.position].push({
                    name: candidate.name,
                    image: candidate.avatar
                });
                break;
        }
        // console.log("in else 2", positions);
    }
    //update the positions field of elections document to new positions array
    return updateElection({ _id: ObjectId(candidate.election_id) }, { $set: { positions: positions } });
}

module.exports = {
    logout(req, res) {
        req.logout(req.user);
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
            username: req.body.username,
            password: req.body["new-password"]
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
            console.log(errors.array());
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
            console.log(errors.array());
            req.flash("val_errors", errors.array());
            return res.redirect("back");
        }
        // create new election object
        const election = {
            name: req.body.name,
            start: new Date(req.body.start),
            end: new Date(req.body.end),
            status: "pending"
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
            console.log(errors.array());
            // req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid id" });
        }
        (async function() {
            let client;
            try {
                client = await connection.connect(url, conOpts);
                const db = client.db(dbName);
                const col = db.collection("elections");
                let r = await col.findOneAndDelete({ _id: ObjectId(req.body.id) });
                return r.value;
            } catch (error) {
                console.error(error);
            } finally {
                await client.close();
            }
        })()
        .then(admin => {
                if (admin != null) {
                    res.json({ msg: "Election deleted successfully." });
                } else {
                    res.json({ msg: "Election does not exists" });
                }
            })
            .catch(error => console.error(error));
    },
    async startElection(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors.array());
            // req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid id" });
        }
        const result = await updateElection({ _id: ObjectId(req.body.id) }, { $set: { status: req.body.status } });
        if (result.modifiedCount === 1) {
            res.json({ msg: "Election succesfully started" });
        } else {
            res.json({ msg: "Failed to start election" });
        }
    },
    async endElection(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log(errors.array());
            // req.flash("val_errors", errors.array());
            return res.json({ msg: "Invalid id" });
        }
        const result = await updateElection({ _id: ObjectId(req.body.id) }, { $set: { status: req.body.status } });
        if (result.modifiedCount === 1) {
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
            console.log(req.url, req.query.id);
            /**
             * check if query is valid
             */
            let errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.json({ msg: "Invalid id" });
            }
            const positions = await getElections({ _id: ObjectId(req.body.id) }, { projection: { positions: true, _id: true } });
            console.log(positions);
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
            console.log(errors.array());
            req.flash("val_errors", errors.array());
            return res.redirect("back");
        }
        req.body.avatar = extractFilePondEncodedImage(req.body.avatar);

        console.log(await addCandidate(req.body));
        req.flash("success", "Candidate added");
        res.redirect("back");
    }
};