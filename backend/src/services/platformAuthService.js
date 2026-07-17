const bcrypt = require("bcrypt");
const ApiError = require("../utils/ApiError");
const platformJwt = require("../utils/platformJwt");
const platformAdminModel = require("../models/platformAdminModel");

async function login({ email, password }) {
    const admin = await platformAdminModel.findByEmail(email);
    if (!admin) throw new ApiError(401, "Invalid email or password");

    const matches = await bcrypt.compare(password, admin.password_hash);
    if (!matches) throw new ApiError(401, "Invalid email or password");

    const token = platformJwt.signToken({ id: admin.id, role: "platform_admin", email: admin.email });
    await platformAdminModel.touchLastLogin(admin.id);

    return {
        token,
        admin: { id: admin.id, name: admin.name, email: admin.email }
    };
}

module.exports = { login };
