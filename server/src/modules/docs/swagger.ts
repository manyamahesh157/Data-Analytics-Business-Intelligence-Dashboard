export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Enterprise BI & Analytics Dashboard Platform API',
    version: '1.0.0',
    description: 'RESTful API for Business Intelligence Dashboards, Real-Time KPIs, Multi-Source ETL, and Automated Reporting.',
  },
  servers: [{ url: '/api', description: 'API Gateway' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate user and obtain JWT tokens',
        tags: ['Auth'],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@apex.io' },
                  password: { type: 'string', example: 'Password123!' },
                  orgSlug: { type: 'string', example: 'apex-analytics' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Authenticated successfully' },
        },
      },
    },
    '/dashboards': {
      get: {
        summary: 'List all dashboards for the organization',
        tags: ['Dashboards'],
        responses: { 200: { description: 'List of dashboards' } },
      },
      post: {
        summary: 'Create a new dashboard',
        tags: ['Dashboards'],
        responses: { 201: { description: 'Dashboard created' } },
      },
    },
    '/dashboards/{id}': {
      get: {
        summary: 'Get dashboard by ID with fully executed widget queries',
        tags: ['Dashboards'],
        responses: { 200: { description: 'Dashboard detail' } },
      },
    },
    '/kpis': {
      get: {
        summary: 'List organization KPIs with current values and sparklines',
        tags: ['KPIs'],
        responses: { 200: { description: 'List of KPIs' } },
      },
      post: {
        summary: 'Create a new KPI definition',
        tags: ['KPIs'],
        responses: { 201: { description: 'KPI created' } },
      },
    },
    '/data-sources': {
      get: {
        summary: 'List data sources and connectors',
        tags: ['Data Sources'],
        responses: { 200: { description: 'List of data sources' } },
      },
    },
    '/reports': {
      get: {
        summary: 'List exportable & scheduled reports',
        tags: ['Reports'],
        responses: { 200: { description: 'List of reports' } },
      },
    },
  },
};
