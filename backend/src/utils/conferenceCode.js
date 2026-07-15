function slugify(value) {
    return String(value)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function generateConferenceCode(name, acronym) {
    const base = slugify(acronym || name).slice(0, 20) || "CONF";
    const suffix = Date.now().toString(36).toUpperCase().slice(-5);
    return `${base}-${suffix}`;
}

module.exports = { generateConferenceCode, slugify };
