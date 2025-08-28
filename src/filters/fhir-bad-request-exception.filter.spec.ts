import {Test, TestingModule} from '@nestjs/testing';
import {BadRequestException, ForbiddenException} from '@nestjs/common';
import {ArgumentsHost} from '@nestjs/common';
import {FhirBadRequestExceptionFilter} from "./fhir-bad-request-exception.filter";

describe('FhirBadRequestExceptionFilter', () => {
    let filter: FhirBadRequestExceptionFilter;
    let mockResponse: any;
    let mockHost: ArgumentsHost;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [FhirBadRequestExceptionFilter],
        }).compile();

        filter = module.get<FhirBadRequestExceptionFilter>(FhirBadRequestExceptionFilter);

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

    it('should return FHIR OperationOutcome for BadRequestException', () => {
        const exception = new BadRequestException('Bad request');

        filter.catch(exception, mockHost);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'bad request',
                details: {text: 'Bad request'}
            }]
        });
    });

    it('should handle security violation messages', () => {
        const exception = new BadRequestException('Malformed url');

        filter.catch(exception, mockHost);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            resourceType: 'OperationOutcome',
            issue: [{
                severity: 'error',
                code: 'bad request',
                details: {text: 'Malformed url'}
            }]
        });
    });
});