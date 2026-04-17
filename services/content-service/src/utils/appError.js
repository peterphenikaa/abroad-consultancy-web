function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
}

module.exports = { createError };