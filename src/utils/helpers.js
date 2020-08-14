const bcrypt = require("bcrypt");
const mimeTypes = ["image/jpeg", "image/png", "images/gif", "image/svg+xml"];
module.exports = {
    hash: async function(password, saltRounds = 10) {
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    },
    compare: async function(password, hash) {
        const result = await bcrypt.compare(password, hash);
        return result;
    },
    mimeTypes,
    extractFilePondEncodedImage(encodedFile) {
        if (encodedFile == null) return;
        // try {
        const fileData = JSON.parse(encodedFile);
        if (fileData !== null && mimeTypes.includes(fileData.type)) {
            return {
                data: new Buffer.from(fileData.data, "base64"),
                type: fileData.type
            };
        }
        // } catch (error) {
        //     console.log(error);
        // }
    },
    base64FileToBuffer(base64) {
        const fileData = JSON.parse(base64);
        if (fileData == null) throw new Error("File is corrupted");
        const buf = new Buffer.from(fileData.data, "base64");
        return buf;
    }
};