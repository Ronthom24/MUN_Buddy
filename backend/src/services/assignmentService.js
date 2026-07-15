const pool = require("../config/database");
const ApiError = require("../utils/ApiError");
const delegateModel = require("../models/delegateModel");
const portfolioModel = require("../models/portfolioModel");
const committeeModel = require("../models/committeeModel");
const assignmentModel = require("../models/assignmentModel");

async function assign(conferenceId, delegateId, { committeeId, portfolioId, force }, changedByAccessId) {
    const delegate = await delegateModel.findById(delegateId);
    if (!delegate || delegate.conference_id !== conferenceId) {
        throw new ApiError(404, "Delegate not found in this conference");
    }
    if (delegate.status !== "approved") {
        throw new ApiError(400, "Only approved delegates may be assigned (spec 13.18)");
    }

    let committee = null;
    if (committeeId !== undefined && committeeId !== null) {
        committee = await committeeModel.findById(committeeId);
        if (!committee || committee.conference_id !== conferenceId) {
            throw new ApiError(400, "That committee does not belong to this conference");
        }
    }

    let portfolio = null;
    if (portfolioId !== undefined && portfolioId !== null) {
        portfolio = await portfolioModel.findById(portfolioId);
        if (!portfolio) {
            throw new ApiError(400, "That portfolio does not exist");
        }
        if (portfolio.status === "assigned" && !force) {
            const existingAssignment = await assignmentModel.findByDelegateId(delegateId);
            if (!existingAssignment || existingAssignment.portfolio_id !== portfolio.id) {
                throw new ApiError(409, "That portfolio is already assigned to another delegate");
            }
        }
    }

    if (committee && committee.capacity && !force) {
        const existing = await assignmentModel.findByDelegateId(delegateId);
        const alreadyInThisCommittee = existing && existing.committee_id === committee.id;
        if (!alreadyInThisCommittee) {
            const currentCount = await assignmentModel.countAssignedInCommittee(committee.id);
            if (currentCount >= committee.capacity) {
                throw new ApiError(409, `${committee.name} is at capacity (${committee.capacity}). Pass force=true to override.`);
            }
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

        const wasAlreadyAssigned = Boolean(previous && previous.status === "assigned");
        await assignmentModel.logHistory({
            delegateId, committeeId, portfolioId,
            action: wasAlreadyAssigned ? "reassigned" : "assigned",
            changedByAccessId
        }, connection);

        await connection.commit();
        return assignment;
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
}

async function bulkAssign(conferenceId, assignments, changedByAccessId) {
    const results = [];
    for (const item of assignments) {
        try {
            const assignment = await assign(conferenceId, item.delegateId, item, changedByAccessId);
            results.push({ delegateId: item.delegateId, success: true, assignment });
        } catch (err) {
            results.push({ delegateId: item.delegateId, success: false, message: err.message });
        }
    }
    return results;
}

async function unassign(conferenceId, delegateId, changedByAccessId) {
    const delegate = await delegateModel.findById(delegateId);
    if (!delegate || delegate.conference_id !== conferenceId) {
        throw new ApiError(404, "Delegate not found in this conference");
    }

    const previous = await assignmentModel.findByDelegateId(delegateId);
    if (previous && previous.portfolio_id) {
        await portfolioModel.update(previous.portfolio_id, { status: "available" });
    }

    const assignment = await assignmentModel.unassign(delegateId);
    await assignmentModel.logHistory({
        delegateId, committeeId: null, portfolioId: null, action: "unassigned", changedByAccessId
    });
    return assignment;
}

async function publish(conferenceId) {
    await assignmentModel.publishAll(conferenceId);
    return assignmentModel.listByConference(conferenceId);
}

async function getAnalytics(conferenceId) {
    const assignments = await assignmentModel.listByConference(conferenceId);
    const assigned = assignments.filter((a) => a.status === "assigned");
    const unassignedDelegates = assignments.filter((a) => a.status !== "assigned");

    const [committeeDemand] = await pool.query(
        `SELECT c.id, c.name, c.capacity,
                SUM(a.status = 'assigned' AND a.committee_id = c.id) AS assigned_count
         FROM committees c
         LEFT JOIN assignments a ON a.committee_id = c.id
         WHERE c.conference_id = ?
         GROUP BY c.id, c.name, c.capacity`,
        [conferenceId]
    );

    return {
        totalApproved: assignments.length,
        assignedCount: assigned.length,
        unassignedCount: unassignedDelegates.length,
        committeeFillRate: committeeDemand.map((row) => ({
            committeeId: row.id,
            committeeName: row.name,
            capacity: row.capacity,
            assigned: Number(row.assigned_count) || 0,
            fillRate: row.capacity ? Number(((Number(row.assigned_count) || 0) / row.capacity).toFixed(2)) : null
        }))
    };
}

module.exports = { assign, bulkAssign, unassign, publish, getAnalytics };
