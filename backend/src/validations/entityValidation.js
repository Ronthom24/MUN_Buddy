const { required, isOneOf } = require("./rules");

function committee(body) {
    const errors = [];
    required(body.name, "name", errors);
    isOneOf(body.type, "type", ["standard", "crisis"], errors);
    isOneOf(body.status, "status", ["open", "closed"], errors);
    return errors;
}

function committeeUpdate(body) {
    const errors = [];
    isOneOf(body.type, "type", ["standard", "crisis"], errors);
    isOneOf(body.status, "status", ["open", "closed"], errors);
    return errors;
}

function agenda(body) {
    const errors = [];
    required(body.title, "title", errors);
    isOneOf(body.status, "status", ["draft", "published", "archived"], errors);
    return errors;
}

function agendaUpdate(body) {
    const errors = [];
    isOneOf(body.status, "status", ["draft", "published", "archived"], errors);
    return errors;
}

function portfolio(body) {
    const errors = [];
    required(body.name, "name", errors);
    isOneOf(body.type, "type", ["country", "position", "observer"], errors);
    isOneOf(body.status, "status", ["available", "assigned"], errors);
    return errors;
}

function portfolioUpdate(body) {
    const errors = [];
    isOneOf(body.type, "type", ["country", "position", "observer"], errors);
    isOneOf(body.status, "status", ["available", "assigned"], errors);
    return errors;
}

function resource(body) {
    const errors = [];
    required(body.title, "title", errors);
    isOneOf(body.category, "category", [
        "background_guide", "research_paper", "rules_of_procedure",
        "conference_handbook", "position_paper_guide", "other"
    ], errors);
    isOneOf(body.visibility, "visibility", ["all", "assigned", "organizers"], errors);
    isOneOf(body.status, "status", ["draft", "published"], errors);
    return errors;
}

function resourceUpdate(body) {
    const errors = [];
    isOneOf(body.category, "category", [
        "background_guide", "research_paper", "rules_of_procedure",
        "conference_handbook", "position_paper_guide", "other"
    ], errors);
    isOneOf(body.visibility, "visibility", ["all", "assigned", "organizers"], errors);
    isOneOf(body.status, "status", ["draft", "published"], errors);
    return errors;
}

function announcement(body) {
    const errors = [];
    required(body.title, "title", errors);
    required(body.content, "content", errors);
    isOneOf(body.category, "category", [
        "general_update", "registration", "assignments",
        "resources", "committee_update", "emergency_notice"
    ], errors);
    isOneOf(body.targetAudience, "targetAudience", ["all", "delegates", "organizers", "committee_staff"], errors);
    isOneOf(body.priority, "priority", ["normal", "important", "urgent"], errors);
    isOneOf(body.status, "status", ["draft", "scheduled", "published"], errors);
    return errors;
}

function announcementUpdate(body) {
    const errors = [];
    isOneOf(body.category, "category", [
        "general_update", "registration", "assignments",
        "resources", "committee_update", "emergency_notice"
    ], errors);
    isOneOf(body.targetAudience, "targetAudience", ["all", "delegates", "organizers", "committee_staff"], errors);
    isOneOf(body.priority, "priority", ["normal", "important", "urgent"], errors);
    isOneOf(body.status, "status", ["draft", "scheduled", "published"], errors);
    return errors;
}

function delegateStatus(body) {
    const errors = [];
    required(body.status, "status", errors);
    isOneOf(body.status, "status", ["pending", "approved", "rejected"], errors);
    return errors;
}

function assignment(body) {
    const errors = [];
    if (body.committeeId === undefined && body.portfolioId === undefined) {
        errors.push("At least one of committeeId or portfolioId is required");
    }
    return errors;
}

module.exports = {
    committee, committeeUpdate, agenda, agendaUpdate, portfolio, portfolioUpdate,
    resource, resourceUpdate, announcement, announcementUpdate, delegateStatus, assignment
};
