const loginHistoryModel = require("../models/loginHistoryModel");

async function record({ userType, userId, email, success, ipAddress, userAgent }) {
    await loginHistoryModel.create({ userType, userId, email, success, ipAddress, userAgent });
}

async function listForUser(userType, userId, options) {
    return loginHistoryModel.listForUser(userType, userId, options);
}

module.exports = { record, listForUser };
