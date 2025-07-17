import swaggerJSDoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

// Swagger definition
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Nubiago E-commerce API',
    version: '1.0.0',
    description: 'Comprehensive e-commerce API with authentication, product management, order processing, and dashboard analytics',
    contact: {
      name: 'Nubiago Development Team',
      email: 'dev@nubiago.com',
      url: 'https://nubiago.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env.API_BASE_URL || 'http://localhost:5000',
      description: 'Development server'
    },
    {
      url: 'https://api.nubiago.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Authorization header using the Bearer scheme'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'Refresh token stored in httpOnly cookie'
      }
    },
    schemas: {
      // Error responses
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'object',
            properties: {
              message: {
                type: 'string',
                example: 'Something went wrong'
              },
              code: {
                type: 'string',
                example: 'INTERNAL_ERROR'
              },
              details: {
                type: 'array',
                items: {
                  type: 'object'
                }
              }
            }
          }
        }
      },
      
      // Success response
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object'
          },
          message: {
            type: 'string'
          }
        }
      },
      
      // Pagination
      Pagination: {
        type: 'object',
        properties: {
          currentPage: {
            type: 'integer',
            example: 1
          },
          totalPages: {
            type: 'integer',
            example: 10
          },
          totalItems: {
            type: 'integer',
            example: 100
          },
          itemsPerPage: {
            type: 'integer',
            example: 20
          },
          hasNext: {
            type: 'boolean',
            example: true
          },
          hasPrev: {
            type: 'boolean',
            example: false
          }
        }
      },
      
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clr1234567890'
          },
          name: {
            type: 'string',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@example.com'
          },
          role: {
            type: 'string',
            enum: ['USER', 'SUPPLIER', 'ADMIN'],
            example: 'USER'
          },
          phone: {
            type: 'string',
            example: '+1234567890'
          },
          avatar: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/avatar.jpg'
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      
      // Product schemas
      Product: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clr1234567890'
          },
          name: {
            type: 'string',
            example: 'Wireless Headphones'
          },
          slug: {
            type: 'string',
            example: 'wireless-headphones'
          },
          description: {
            type: 'string',
            example: 'High-quality wireless headphones with noise cancellation'
          },
          price: {
            type: 'number',
            format: 'float',
            example: 99.99
          },
          comparePrice: {
            type: 'number',
            format: 'float',
            example: 129.99
          },
          quantity: {
            type: 'integer',
            example: 50
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri'
            },
            example: ['https://example.com/image1.jpg']
          },
          isActive: {
            type: 'boolean',
            example: true
          },
          isFeatured: {
            type: 'boolean',
            example: false
          },
          tags: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['electronics', 'audio']
          },
          categoryId: {
            type: 'string',
            example: 'clr1234567890'
          },
          supplierId: {
            type: 'string',
            example: 'clr1234567890'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      
      // Order schemas
      Order: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clr1234567890'
          },
          orderNumber: {
            type: 'string',
            example: 'ORD-123456789'
          },
          userId: {
            type: 'string',
            example: 'clr1234567890'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
            example: 'PENDING'
          },
          paymentStatus: {
            type: 'string',
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
            example: 'PENDING'
          },
          subtotal: {
            type: 'number',
            format: 'float',
            example: 99.99
          },
          taxAmount: {
            type: 'number',
            format: 'float',
            example: 8.00
          },
          shippingAmount: {
            type: 'number',
            format: 'float',
            example: 9.99
          },
          totalAmount: {
            type: 'number',
            format: 'float',
            example: 117.98
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      
      // Authentication schemas
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'SecurePass123'
          }
        }
      },
      
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'SecurePass123'
          },
          role: {
            type: 'string',
            enum: ['USER', 'SUPPLIER'],
            example: 'USER'
          }
        }
      },
      
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              },
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              }
            }
          },
          message: {
            type: 'string',
            example: 'Login successful'
          }
        }
      }
    },
    
    responses: {
      BadRequest: {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      Forbidden: {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      NotFound: {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      InternalServerError: {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      }
    }
  },
  
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'Users',
      description: 'User management and profile operations'
    },
    {
      name: 'Products',
      description: 'Product catalog and management'
    },
    {
      name: 'Orders',
      description: 'Order processing and management'
    },
    {
      name: 'Categories',
      description: 'Product category management'
    },
    {
      name: 'Admin Dashboard',
      description: 'Administrative analytics and management'
    },
    {
      name: 'Supplier Dashboard',
      description: 'Supplier-specific analytics and operations'
    },
    {
      name: 'User Dashboard',
      description: 'User-specific analytics and history'
    }
  ]
};

// Options for swagger-jsdoc
const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './dist/routes/*.js',
    './dist/controllers/*.js'
  ],
};

// Initialize swagger-jsdoc
const specs = swaggerJSDoc(options);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #3b82f6 }
  `,
  customSiteTitle: 'Nubiago API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    showRequestHeaders: true,
    tryItOutEnabled: true
  }
};

// Setup Swagger documentation
export const setupSwagger = (app: Express): void => {
  // Serve Swagger documentation
  // @ts-ignore
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));
  
  // Serve raw OpenAPI JSON
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  // Redirect /docs to /api/docs for convenience
  app.get('/docs', (_req, res) => {
    res.redirect('/api/docs');
  });
  
  console.log(`📚 API Documentation available at: /api/docs`);
  console.log(`📄 OpenAPI spec available at: /api/docs.json`);
};

export default specs; 