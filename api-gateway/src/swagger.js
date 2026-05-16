const yaml = require("yaml");
const fs = require("fs");
const path = require("path");
const swaggerUi = require("swagger-ui-express");

/**
 * Merges OpenAPI specs from multiple services into a consolidated base spec
 * @returns {Object} Consolidated OpenAPI specification
 */
const mergeOpenAPISpecs = () => {
  const baseSpec = {
    openapi: "3.0.0",
    info: {
      title: "Learning Platform API - Consolidated Documentation",
      version: "1.0.0",
      description: `
# API Gateway - Consolidated API Documentation

This is the main entry point for all microservices. The API Gateway consolidates and documents all backend services:
- **Auth Service** - Authentication, authorization, user management
- **User Service** - User profiles and data
- **Content Service** - Course and learning content management
- **AI RAG Service** - AI-powered features
- Other specialized services

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

See individual endpoint documentation for details.
      `,
    },
    servers: [
      {
        url: "http://localhost:8081/api",
        description: "API Gateway (production-like)",
      },
    ],
    paths: {},
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT Bearer token",
        },
      },
      schemas: {},
    },
    tags: [],
  };

  // Load and merge auth-service spec
  loadAndMergeServiceSpec(baseSpec, "auth-service");

  return baseSpec;
};

/**
 * Loads and merges a service's OpenAPI spec into the base spec
 * @param {Object} baseSpec - The base OpenAPI specification to merge into
 * @param {string} serviceName - Name of the service folder
 */
const loadAndMergeServiceSpec = (baseSpec, serviceName) => {
  try {
    const swaggerPath = path.join(
      __dirname,
      "..",
      "..",
      "services",
      serviceName,
      "docs",
      "swagger.yaml"
    );

    if (!fs.existsSync(swaggerPath)) {
      console.warn(`[Swagger] ⚠️ Spec not found for ${serviceName} at ${swaggerPath}`);
      return;
    }

    const serviceSpec = yaml.parse(fs.readFileSync(swaggerPath, "utf8"));

    // Merge paths
    if (serviceSpec.paths) {
      Object.assign(baseSpec.paths, serviceSpec.paths);
    }

    // Merge schemas
    if (serviceSpec.components?.schemas) {
      Object.assign(baseSpec.components.schemas, serviceSpec.components.schemas);
    }

    // Merge tags (avoid duplicates)
    if (serviceSpec.tags) {
      const existingTags = new Set(baseSpec.tags.map((t) => t.name));
      serviceSpec.tags.forEach((tag) => {
        if (!existingTags.has(tag.name)) {
          baseSpec.tags.push(tag);
        }
      });
    }

    console.log(`[Swagger] ✅ Loaded ${serviceName} specs`);
  } catch (err) {
    console.warn(
      `[Swagger] ⚠️ Could not load ${serviceName} specs:`,
      err.message
    );
  }
};

/**
 * Configures Swagger UI middleware options
 * @returns {Object} Swagger UI setup configuration
 */
const getSwaggerUIOptions = () => {
  return {
    swaggerOptions: {
      displayOperationId: false,
      showExtensions: false,
    },
    customCss: `
      .topbar { display: none; }
      .swagger-ui .info .title { 
        color: #1976d2; 
        font-size: 28px;
      }
      .swagger-ui .info .description {
        margin: 20px 0;
      }
    `,
    customSiteTitle: "API Documentation - Learning Platform",
  };
};

/**
 * Registers Swagger routes on the Express app
 * @param {Object} app - Express application instance
 * @param {Object} spec - OpenAPI specification
 */
const registerSwaggerRoutes = (app, spec) => {
  // Serve Swagger UI
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(spec, getSwaggerUIOptions())
  );

  // Serve consolidated OpenAPI spec as JSON
  app.get("/swagger.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(spec);
  });

  // Serve consolidated OpenAPI spec as YAML
  app.get("/swagger.yaml", (_req, res) => {
    res.setHeader("Content-Type", "application/x-yaml");
    res.send(yaml.stringify(spec, null, 2));
  });
};

module.exports = {
  mergeOpenAPISpecs,
  loadAndMergeServiceSpec,
  getSwaggerUIOptions,
  registerSwaggerRoutes,
};
