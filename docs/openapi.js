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
      name: 'Parking',
      description: 'Vehicle parking operations'
    }
  ],
  paths: {
    '/api/parking/checkin': {
      post: {
        tags: ['Parking'],
        summary: 'Check in a vehicle',
        description: 'Creates a vehicle record if needed, then starts a parking session.',
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
        summary: 'Check out a vehicle',
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
    schemas: {
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
