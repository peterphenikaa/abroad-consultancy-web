function resolveUserId(req) {
    const headerUserId = req.headers['x-user-id'];
    return req.user?.id || (typeof headerUserId === 'string' ? headerUserId : null);
}

module.exports = { resolveUserId };
