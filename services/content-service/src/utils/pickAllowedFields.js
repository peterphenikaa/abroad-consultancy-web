function pickAllowedFields(payload, allowedFields) {
    const out = {};
    for (const key of allowedFields) {
        if (payload[key] !== undefined) out[key] = payload[key];
    }
    return out;
}

module.exports = { pickAllowedFields };