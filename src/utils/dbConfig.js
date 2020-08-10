const connection = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = process.env.DB_NAME;
const conOpts = {
    useUnifiedTopology: true
};

/**
 * Insert one document into elections collection
 * @param {*} election
 */
async function insertElection(election) {
    let client;

    try {
        client = await connection.connect(url, conOpts);
        const db = client.db(dbName);
        const col = db.collection("elections");
        const result = await col.insertOne(election);
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
        client = await connection.connect(url, conOpts);
        const db = client.db(dbName);
        const col = db.collection("elections");
        const result = await col.findOneAndUpdate(
            filterQuery,
            updateQuery,
            options
        );

        return {
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            matchedCount: result.matchedCount
        };
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
        client = await connection.connect(url, conOpts);
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
 * Inset one document into admin collection
 * @param {*} data
 */
async function insertAdmin(data) {
    let client;
    try {
        /**
         * insert data into database
         */
        client = await connection.connect(url, conOpts);
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
async function removedAdmin(query) {
    let client;
    try {
        client = await connection.connect(url, conOpts);
        const db = client.db(dbName);
        const col = db.collection("admins");
        let r = await col.findOneAndDelete(query);
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
        client = await connection.connect(url, conOpts);
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
module.exports = {
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
};