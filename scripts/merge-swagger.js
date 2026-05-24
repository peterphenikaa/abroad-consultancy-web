const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { globSync } = require('glob');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'services', 'kong', 'swagger', 'swagger.json');

const baseSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Cambridge Education Platform - API Documentation',
    version: '1.0.0',
    description: `
# Cambridge Education Platform API

Consolidated API documentation for all microservices.

## Base URL
\`\`\`
http://localhost:8081/api
\`\`\`

## Authentication
Protected endpoints require a valid JWT Bearer token:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Public vs Protected Routes
- **Public routes** do NOT require JWT authentication
- **Protected routes** require JWT token in the \`Authorization\` header
    `,
  },
  servers: [
    { url: 'http://localhost:8081/api', description: 'API Gateway (via Kong)' },
  ],
  paths: {},
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer token from login response',
      },
    },
    schemas: {},
  },
  tags: [],
};

const specFiles = globSync('services/*/docs/swagger.yaml', { cwd: ROOT });
if (specFiles.length === 0) {
  console.warn('No spec files found. Generating empty base spec.');
} else {
  specFiles.forEach((relativePath) => {
    const fullPath = path.join(ROOT, relativePath);
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const spec = yaml.load(content);

      if (spec.paths) {
        Object.assign(baseSpec.paths, spec.paths);
      }
      if (spec.components?.schemas) {
        Object.assign(baseSpec.components.schemas, spec.components.schemas);
      }
      if (spec.tags) {
        const existingTags = new Set(baseSpec.tags.map((t) => t.name));
        spec.tags.forEach((tag) => {
          if (!existingTags.has(tag.name)) {
            baseSpec.tags.push(tag);
          }
        });
      }
      console.log(`Merged: ${relativePath}`);
    } catch (err) {
      console.warn(`Failed to parse ${relativePath}: ${err.message}`);
    }
  });
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(baseSpec, null, 2));
console.log(`Written: ${OUTPUT}`);
