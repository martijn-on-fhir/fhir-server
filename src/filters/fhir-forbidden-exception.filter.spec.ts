import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { FhirForbiddenExceptionFilter } from './fhir-forbidden-exception.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('FhirForbiddenExceptionFilter', () => {
    let filter: FhirForbiddenExceptionFilter;
    let mockResponse: any;
    let mockHost: ArgumentsHost;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FhirForbiddenExceptionFilter],
        }).compile();

        filter = module.get<FhirForbiddenExceptionFilter>(FhirForbiddenExceptionFilter);
        
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        
        mockHost = {
            switchToHttp: jest.fn().mockReturnValue({
                getResponse: jest.fn().mockReturnValue(mockResponse)
            })
        } as any;
    });

    it('should be defined', () => {
        expect(filter).toBeDefined();
    });

    it('should return FHIR OperationOutcome for ForbiddenException', () => {
        const exception = new ForbiddenException('Access denied');
        
        filter.catch(exception, mockHost);
        
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'forbidden',
                details: { text: 'Access denied' }
            }]
        });
    });

    it('should handle security violation messages', () => {
        const exception = new ForbiddenException('Suspicious content detected');
        
        filter.catch(exception, mockHost);
        
        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'forbidden',
                details: { text: 'Suspicious content detected' }
            }]
        });
    });
});