const pool = require("../config/database");
const ApiError = require("../utils/ApiError");
const delegateModel = require("../models/delegateModel");
const portfolioModel = require("../models/portfolioModel");
const committeeModel = require("../models/committeeModel");
const assignmentModel = require("../models/assignmentModel");

async function assign(conferenceId, delegateId, { committeeId, portfolioId }) {
    const delegate = await delegateModel.findById(delegateId);
    if (!delegate || delegate.conference_id !== conferenceId) {
        throw new ApiError(404, "Delegate not found in this conference");
    }

    if (committeeId !== undefined) {
        const committee = await committeeModel.findById(committeeId);
        if (!committee || committee.conference_id !== conferenceId) {
            throw new ApiError(400, "That committee does not belong to this conference");
        }
    }

    let portfolio = null;
    if (portfolioId !== undefined) {
        portfolio = await portfolioModel.findById(portfolioId);
        if (!portfolio) {
            throw new ApiError(400, "That portfolio does not exist");
        }
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const previous = await assignmentModel.findByDelegateId(delegateId, connection);
        if (previous && previous.portfolio_id && previous.portfolio_id !== portfolioId) {
            await portfolioModel.update(previous.portfolio_id, { status: "available" }, connection);
        }

        if (portfolio) {
            await portfolioModel.update(portfolio.id, { status: "assigned" }, connection);
        }

        const assignment = await assignmentModel.assign(delegateId, { committeeId, portfolioId }, connection);

        await connection.commit();
        return assignment;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

async function publish(conferenceId) {
    await assignmentModel.publishAll(conferenceId);
    return assignmentModel.listByConference(conferenceId);
}

module.exports = { assign, publish };
