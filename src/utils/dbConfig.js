const { MongoClient, ObjectId } = require("mongodb");
const dbName = process.env.DB_NAME;
const mongo_uri = process.env.MONGO_URL;
const conOpts = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    ssl: true,
    retryWrites: true,
    writeConcern: { w: "majority" }
};

/**
 * Insert one document into elections collection
 * @param {*} election
 */
async function insertElection(doc, options) {
    let client;

    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("elections");
        const result = await col.insertOne(doc, options);
        return {
            count: result.insertedCount,
            id: result.insertedId
        };
    } catch (error) {
        console.log(error);
    } finally {
        client.close();
    }
}

/**
 * Update one document in elections collections
 * @param {*} filterQuery
 * @param {*} updateQuery
 */
async function updateElection(
    filterQuery = {},
    updateQuery = {},
    options = {}
) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("elections");
        const result = await col.findOneAndUpdate(
            filterQuery,
            updateQuery,
            options
        );
        return result.value;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}
/**
 * Fetch election from database
 * @param {*} query
 * @param {*} projection
 */
async function getElections(query = {}, options = {}) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("elections");
        let r = await col.find(query, options).toArray();
        return r;
    } catch (error) {
        console.log(error);
    } finally {
        await client.close();
    }
}

/**
 * Fetch election from database
 * @param {*} query
 * @param {*} projection
 */
async function findElection(query = {}, options = {}) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("elections");
        let r = await col.findOne(query, options);
        return r;
    } catch (error) {
        console.log(error);
    } finally {
        await client.close();
    }
}

async function removeElection(filterQuery, options) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("elections");
        let r = await col.findOneAndDelete(filterQuery, options);
        return r.value;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

/**
 * Insert one document into admin collection
 * @param {*} data
 */
async function insertAdmin(data) {
    let client;
    try {
        /**
         * insert data into database
         */
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("admins");
        const result = await col.insertOne(data);

        return {
            count: result.insertedCount,
            id: result.insertedId
        };
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

/**
 * Find and remove a document from admins collection
 * @param {*} query
 */
async function removedAdmin(query = {}, options = {}) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("admins");
        let r = await col.findOneAndDelete(query, options);
        return r.value;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

/**
 * Get document from admins collection
 * @param {*} query
 * @param {*} options
 */
async function getAdmins(query, options) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("admins");
        const r = await col.find(query, options).toArray();
        return r;
    } catch (error) {
        console.error(error);
    } finally {
        client.close();
    }
}

/**
 * Get one document from admins collection
 * @param {*} query
 * @param {*} options
 */
async function getAdmin(query, options) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("admins");
        const r = await col.findOne(query, options);
        return r;
    } catch (error) {
        console.error(error);
    } finally {
        client.close();
    }
}

async function addCandidate(candidate) {
    //exit if candidate object does'nt have the required properties
    if (!candidate.election_id && !candidate.position) return false;
    // obtain the elections document from the database
    const election = await findElection({ _id: ObjectId(candidate.election_id) });
    if (election === null) return false;
    let positions = election.positions;
    /**
     * check if election document has  positions field object
     * if not we create one and add candidate to the candidates array
     * if document has positions field object we add new candidate to the positions candidates array
     */
    candidate.position = candidate.position.trim().toUpperCase();
    candidate.name = candidate.name.trim();
    if (positions === undefined) {
        // console.log("in if 1", positions);
        let posObj = {};
        posObj[candidate.position] = [{
            name: candidate.name,
            image: candidate.avatar,
            votes: 0
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
                    image: candidate.avatar,
                    votes: 0
                }];
                break;

            default:
                positions[candidate.position].push({
                    name: candidate.name,
                    image: candidate.avatar,
                    votes: 0
                });
                break;
        }
        // console.log("in else 2", positions);
    }
    //update the positions field of elections document to new positions array
    return updateElection({ _id: ObjectId(candidate.election_id) }, { $set: { positions: positions } });
}

async function getVoter(query, options) {
    let client;
    try {
        /**
         * find user with credentials
         */
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("voters");
        return await col.findOne(query, options);
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
}

async function getelectionVoters(query, options) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("voters");
        const r = await col.find(query, options).toArray();
        return r;
    } catch (error) {
        console.error(error);
    } finally {
        client.close();
    }
}

async function updateVoter(filterQuery = {}, updateQuery = {}, options = {}) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("voters");
        const result = await col.findOneAndUpdate(
            filterQuery,
            updateQuery,
            options
        );
        return result.value;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

async function addVoters(doc = [], options = {}) {
    let client;

    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("voters");
        const result = await col.insertMany(doc, options);
        return {
            insertedCount: result.insertedCount,
            insertedIds: result.insertedIds
        };
    } catch (error) {
        console.log(error);
    } finally {
        client.close();
    }
}
async function removeVoter(query = {}, options = {}) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection("voters");
        let r = await col.findOneAndDelete(query, options);
        return r.value;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}

async function countCollectionDocuments(collection = "", query = {}, options = {}) {
    let client;
    try {
        client = await MongoClient.connect(mongo_uri, conOpts);
        const db = client.db(dbName);
        const col = db.collection(collection);
        let result = await col.count(query, options);
        return result;
    } catch (error) {
        console.error(error);
    } finally {
        await client.close();
    }
}
module.exports = {
    mongo_uri,
    dbName,
    MongoClient,
    conOpts,
    insertElection,
    updateElection,
    getElections,
    findElection,
    removeElection,
    insertAdmin,
    removedAdmin,
    getAdmins,
    getAdmin,
    addCandidate,
    getVoter,
    getelectionVoters,
    addVoters,
    updateVoter,
    removeVoter,
    countCollectionDocuments
};