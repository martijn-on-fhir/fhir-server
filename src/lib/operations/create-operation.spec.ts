
import {CreateOperation} from './create-operation';
import {Model} from 'mongoose';
import {FhirResourceDocument} from '../../schema/fhir-resource-schema';
import {NotAcceptableException} from '@nestjs/common';
import {FhirResponse} from '../fhir-response';

describe('CreateOperation', () => {
    let createOperation: CreateOperation;
    let mockModel: jest.Mocked<Model<FhirResourceDocument>>;

    beforeEach(async () => {
        mockModel = {
            findOne: jest.fn(),
            new: jest.fn(),
            save: jest.fn(),
        } as any;

        createOperation = new CreateOperation(mockModel);
    });

    it('should create a new resource successfully', async () => {
        const resourceType = 'Patient';
        const resourceData = {name: 'John Doe'};
        const savedResource = {
            ...resourceData,
            id: expect.any(String),
            toObject: (): any => ({...resourceData, id: expect.any(String)}),
        };

        mockModel.findOne = jest.fn().mockResolvedValue(null);

        const result = await createOperation.execute(resourceType, resourceData);

        expect(result).toEqual(FhirResponse.format(savedResource.toObject()));
        expect(mockModel.prototype.save).toHaveBeenCalled();
    });

    it('should throw NotAcceptableException when resource already exists', async () => {
        const resourceType = 'Patient';
        const resourceId = 'existing-id';
        const resourceData = {id: resourceId, name: 'John Doe'};

        mockModel.findOne = jest.fn().mockResolvedValue({id: resourceId});

        await expect(createOperation.execute(resourceType, resourceData))
            .rejects
            .toThrow(NotAcceptableException);
    });

    it('should use provided ID when creating resource', async () => {
        const resourceType = 'Patient';
        const resourceId = 'custom-id';
        const resourceData = {id: resourceId, name: 'John Doe'};
        const savedResource = {
            ...resourceData,
            toObject: (): any => resourceData,
        };

        mockModel.findOne = jest.fn().mockResolvedValue(null);
        mockModel.prototype.save = jest.fn().mockResolvedValue(savedResource);

        const result = await createOperation.execute(resourceType, resourceData);

        expect(result).toEqual(FhirResponse.format(savedResource.toObject()));
        expect(result.id).toBe(resourceId);
    });
});