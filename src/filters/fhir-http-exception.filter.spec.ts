import { Test, TestingModule } from '@nestjs/testing'
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common'
import { Response } from 'express'
import { FhirHttpExceptionFilter } from './fhir-http-exception.filter'

describe('FhirHttpExceptionFilter', () => {
  let filter: FhirHttpExceptionFilter
  let mockResponse: jest.Mocked<Response>
  let mockArgumentsHost: jest.Mocked<ArgumentsHost>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FhirHttpExceptionFilter],
    }).compile()

    filter = module.get<FhirHttpExceptionFilter>(FhirHttpExceptionFilter)

    // Mock Express Response
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as any

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any
  })

  it('should be defined', () => {
    expect(filter).toBeDefined()
  })

  describe('HTTP Status Code Mapping', () => {
    it('should handle 400 Bad Request', () => {
      const exception = new HttpException('Invalid request', HttpStatus.BAD_REQUEST)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: 'OperationOutcome',
          issue: expect.arrayContaining([
            expect.objectContaining({
              severity: 'error',
              code: 'bad request',
            })
          ])
        })
      )
    })

    it('should handle 401 Unauthorized', () => {
      const exception = new HttpException('Authentication failed', HttpStatus.UNAUTHORIZED)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(401)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'security',
          details: {
            text: 'Authentication failed'
          }
        }]
      })
    })

    it('should handle 403 Forbidden', () => {
      const exception = new HttpException('Access denied', HttpStatus.FORBIDDEN)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(403)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: 'OperationOutcome',
          issue: expect.arrayContaining([
            expect.objectContaining({
              severity: 'error',
              code: 'forbidden',
            })
          ])
        })
      )
    })

    it('should handle 404 Not Found', () => {
      const exception = new HttpException('Resource not found', HttpStatus.NOT_FOUND)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(404)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-found',
          details: {
            text: 'Resource not found'
          }
        }]
      })
    })

    it('should handle 405 Method Not Allowed', () => {
      const exception = new HttpException('Method not allowed', HttpStatus.METHOD_NOT_ALLOWED)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(405)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-supported',
          details: {
            text: 'Method not allowed'
          }
        }]
      })
    })

    it('should handle 406 Not Acceptable', () => {
      const exception = new HttpException('Not acceptable', HttpStatus.NOT_ACCEPTABLE)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(406)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-supported',
          details: {
            text: 'Not acceptable'
          }
        }]
      })
    })

    it('should handle 409 Conflict', () => {
      const exception = new HttpException('Resource conflict', HttpStatus.CONFLICT)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(409)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'conflict',
          details: {
            text: 'Resource conflict'
          }
        }]
      })
    })

    it('should handle 410 Gone', () => {
      const exception = new HttpException('Resource deleted', HttpStatus.GONE)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(410)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'deleted',
          details: {
            text: 'Resource deleted'
          }
        }]
      })
    })

    it('should handle 412 Precondition Failed', () => {
      const exception = new HttpException('Precondition failed', HttpStatus.PRECONDITION_FAILED)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(412)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'business-rule',
          details: {
            text: 'Precondition failed'
          }
        }]
      })
    })

    it('should handle 422 Unprocessable Entity', () => {
      const exception = new HttpException('Validation failed', HttpStatus.UNPROCESSABLE_ENTITY)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(422)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'processing',
          details: {
            text: 'Validation failed'
          }
        }]
      })
    })

    it('should handle 429 Too Many Requests', () => {
      const exception = new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(429)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'throttled',
          details: {
            text: 'Rate limit exceeded'
          }
        }]
      })
    })

    it('should handle 500 Internal Server Error', () => {
      const exception = new HttpException('Internal error', HttpStatus.INTERNAL_SERVER_ERROR)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(500)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          details: {
            text: 'Internal error'
          }
        }]
      })
    })

    it('should handle 501 Not Implemented', () => {
      const exception = new HttpException('Not implemented', HttpStatus.NOT_IMPLEMENTED)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(501)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'not-supported',
          details: {
            text: 'Not implemented'
          }
        }]
      })
    })

    it('should handle 503 Service Unavailable', () => {
      const exception = new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(503)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'transient',
          details: {
            text: 'Service unavailable'
          }
        }]
      })
    })

    it('should handle unmapped HTTP status codes', () => {
      const exception = new HttpException('Custom error', 418) // I'm a teapot
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(418)
      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          details: {
            text: 'HTTP 418: Custom error'
          }
        }]
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle exceptions with no message', () => {
      const exception = new HttpException('', HttpStatus.BAD_REQUEST)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          resourceType: 'OperationOutcome'
        })
      )
    })

    it('should provide default message when exception message is falsy', () => {
      const exception = new HttpException(undefined as any, HttpStatus.INTERNAL_SERVER_ERROR)
      
      filter.catch(exception, mockArgumentsHost)

      expect(mockResponse.json).toHaveBeenCalledWith({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'exception',
          details: {
            text: 'Http Exception'
          }
        }]
      })
    })
  })

  describe('FHIR Compliance', () => {
    it('should always return OperationOutcome resource type', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST)
      
      filter.catch(exception, mockArgumentsHost)

      const capturedResponse = mockResponse.json.mock.calls[0][0]
      expect(capturedResponse.resourceType).toBe('OperationOutcome')
    })

    it('should include issue array in response', () => {
      const exception = new HttpException('Test error', HttpStatus.NOT_FOUND)
      
      filter.catch(exception, mockArgumentsHost)

      const capturedResponse = mockResponse.json.mock.calls[0][0]
      expect(capturedResponse.issue).toBeInstanceOf(Array)
      expect(capturedResponse.issue).toHaveLength(1)
    })

    it('should include required issue fields', () => {
      const exception = new HttpException('Test error', HttpStatus.UNAUTHORIZED)
      
      filter.catch(exception, mockArgumentsHost)

      const capturedResponse = mockResponse.json.mock.calls[0][0]
      const issue = capturedResponse.issue[0]
      
      expect(issue.severity).toBeDefined()
      expect(issue.code).toBeDefined()
      expect(issue.details).toBeDefined()
      expect(issue.details.text).toBeDefined()
    })
  })
})