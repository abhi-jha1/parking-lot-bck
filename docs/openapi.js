const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Parking Management API',
    version: '1.0.0',
    description: 'API for checking vehicles in and out and retrieving parking history.'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server'
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Log in to receive an authentication cookie and manage account passwords.'
    },
    {
      name: 'Parking',
      description: 'Vehicle parking operations'
    }
  ],
  paths: {
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in and set an authentication cookie',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthRequest' },
              example: { car_number: 'KA03NN6173', password: 'a-strong-password' }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful; sets an HttpOnly authentication cookie.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' }
              }
            }
          },
          400: { description: 'Invalid input.' },
          401: { description: 'Invalid car number or password.' },
          500: { description: 'Server error.' }
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Log out and clear the authentication cookie',
        responses: {
          200: { description: 'Authentication cookie cleared.' }
        }
      }
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Authentication'],
        summary: 'Change the account password',
        description: 'For accounts created during admin check-in, use the car number as the current password and choose a new password before using parking endpoints.',
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['current_password', 'new_password'],
                properties: {
                  current_password: { type: 'string' },
                  new_password: { type: 'string', minLength: 8 }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Password changed and authentication cookie refreshed.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', example: 'Password changed successfully' }
                  }
                }
              }
            }
          },
          400: { description: 'Invalid password input.' },
          401: { description: 'Authentication is missing/invalid, or the current password is incorrect.' },
          500: { description: 'Server error.' }
        }
      }
    },
    '/api/parking/checkin': {
      post: {
        tags: ['Parking'],
        summary: 'Check in a vehicle',
        security: [{ cookieAuth: [] }],
        description: 'Admin-only. Creates a vehicle record if needed, then starts a parking session. A new account receives the car number as a temporary password and must change it before parking actions.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VehicleRequest' },
              example: { car_number: 'KA03NN6173' }
            }
          }
        },
        responses: {
          201: {
            description: 'Vehicle checked in successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CheckInResponse' }
              }
            }
          },
          400: {
            description: 'Missing car number or vehicle is already checked in.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { description: 'Authentication required or token invalid/expired.' },
          403: { description: 'Admin access required or temporary password must be changed.' },
          500: {
            description: 'Server error.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/parking/checkout': {
      post: {
        tags: ['Parking'],
        summary: 'Check out a vehicle (admin only)',
        security: [{ cookieAuth: [] }],
        description: 'Requires an authenticated admin account whose temporary password has been changed.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VehicleRequest' },
              example: { car_number: 'KA03NN6173' }
            }
          }
        },
        responses: {
          200: {
            description: 'Vehicle checked out successfully.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VehicleResponse' }
              }
            }
          },
          400: {
            description: 'Missing car number or no active parking session.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          404: {
            description: 'Vehicle record not found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { description: 'Authentication required or token invalid/expired.' },
          403: { description: 'Admin access required or temporary password must be changed.' },
          500: {
            description: 'Server error.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/parking/history/{car_number}': {
      get: {
        tags: ['Parking'],
        summary: 'Get parking history for a vehicle',
        security: [{ cookieAuth: [] }],
        description: 'Customers can view only their own vehicle history. Admins can view history for any vehicle.',
        parameters: [
          {
            name: 'car_number',
            in: 'path',
            required: true,
            description: 'Vehicle registration number.',
            schema: { type: 'string' },
            example: 'KA03NN6173'
          }
        ],
        responses: {
          200: {
            description: 'Parking history, newest session first.',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ParkingHistoryEntry' }
                }
              }
            }
          },
          404: {
            description: 'No vehicle record found.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          },
          401: { description: 'Authentication required or token invalid/expired.' },
          403: { description: 'Customers may only view their own vehicle history; temporary passwords must be changed first.' },
          500: {
            description: 'Server error.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token'
      }
    },
    schemas: {
      AuthRequest: {
        type: 'object',
        required: ['car_number', 'password'],
        properties: {
          car_number: { type: 'string', example: 'KA03NN6173' },
          password: { type: 'string', minLength: 8, example: 'a-strong-password' }
        }
      },
      AuthResponse: {
        type: 'object',
        required: ['message', 'car_number', 'password_change_required'],
        properties: {
          message: { type: 'string', example: 'Login successful' },
          car_number: { type: 'string', example: 'KA03NN6173' },
          password_change_required: { type: 'boolean', example: false }
        }
      },
      VehicleRequest: {
        type: 'object',
        required: ['car_number'],
        properties: {
          car_number: {
            type: 'string',
            description: 'Vehicle registration number.',
            example: 'KA03NN6173'
          }
        }
      },
      VehicleResponse: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Vehicle checked out successfully' },
          car_number: { type: 'string', example: 'KA03NN6173' }
        }
      },
      CheckInResponse: {
        allOf: [
          { $ref: '#/components/schemas/VehicleResponse' },
          {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Vehicle checked in successfully' },
              session_id: { type: 'integer', example: 1 }
            }
          }
        ]
      },
      ParkingHistoryEntry: {
        type: 'object',
        description: 'A parking session record returned from the history table.',
        properties: {
          id: { type: 'integer', example: 1 },
          user_id: { type: 'integer', example: 1 },
          check_in: { type: 'string', format: 'date-time' },
          check_out: { type: 'string', format: 'date-time', nullable: true }
        },
        additionalProperties: true
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'car_number is required' }
        },
        required: ['error']
      }
    }
  }
};

module.exports = openapiSpec;
