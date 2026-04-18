const { PrismaClient } = require("@prisma/client");
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const prisma = new PrismaClient();

module.exports = prisma;
