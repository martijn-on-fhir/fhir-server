import {validate} from 'class-validator';
import {CreateResourceDto} from './create-resource-dto';

describe('CreateResourceDto', () => {
    it('should validate successfully with minimal required properties', async () => {
        const dto = new CreateResourceDto();
        dto.resourceType = 'Patient';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation if resourceType is empty', async () => {
        const dto = new CreateResourceDto();
        dto.resourceType = '';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('resourceType');
    });

    it('should fail validation if resourceType is not a string', async () => {
        const dto = new CreateResourceDto();
        (dto as any).resourceType = 123;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('resourceType');
    });

    it('should validate successfully with optional properties', async () => {
        const dto = new CreateResourceDto();
        dto.resourceType = 'Observation';
        dto.id = 'obs-123';
        dto.implicitRules = 'http://hl7.org/fhir/StructureDefinition/Observation';
        dto.language = 'en-US';
        dto.text = {status: 'generated', div: '<div>Observation summary</div>'};
        dto.contained = [{resourceType: 'Patient', id: 'patient-1'}];
        dto.extension = [];
        dto.modifierExtension = [];

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail validation if implicitRules is not a valid URL', async () => {
        const dto = new CreateResourceDto();
        dto.resourceType = 'Patient';
        dto.implicitRules = 'invalid-url';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('implicitRules');
    });

    it('should allow additional properties via index signature', async () => {
        const dto = new CreateResourceDto();
        dto.resourceType = 'Patient';
        dto['customProperty'] = 'Custom Value';

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
        expect(dto['customProperty']).toBe('Custom Value');
    });
});