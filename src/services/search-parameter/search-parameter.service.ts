import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SearchParameterDocument, SearchParameterSchema } from '../../schema/search-parameter.schema';
import { CreateSearchParameterDto } from '../../dto/create-search-parameter-dto';
import { UpdateSearchParameterDto } from '../../dto/update-search-parameter-dto';
import {v4 as uuidv4} from "uuid";

/**
 * Service for managing FHIR SearchParameter resources.
 * Provides CRUD operations and validation for search parameter definitions.
 */
@Injectable()
export class SearchParameterService {

  constructor(
    @InjectModel(SearchParameterSchema.name)
    private searchParameterModel: Model<SearchParameterDocument>
  ) {}

  /**
   * Creates a new SearchParameter resource.
   * @param createDto - Data transfer object containing SearchParameter details
   * @returns Created SearchParameter document
   */
  async create(createDto: CreateSearchParameterDto): Promise<SearchParameterDocument> {
    
    // Validate URL uniqueness
    await this.validateUrlUniqueness(createDto.url);
    
    // Validate base resource types
    this.validateBaseResourceTypes(createDto.base);
    
    const properties = {
        id: uuidv4(),
      ...createDto,
      date: createDto.date ? new Date(createDto.date) : new Date(),
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    };

    const searchParameter = new this.searchParameterModel(properties);
    return searchParameter.save();
  }

  /**
   * Retrieves all SearchParameter resources matching the provided filter.
   * @param filter - MongoDB filter criteria
   * @returns Array of SearchParameter documents
   */
  async findAll(filter: any = {}): Promise<SearchParameterDocument[]> {
    return this.searchParameterModel.find(filter).sort({ name: 1 }).exec();
  }

  /**
   * Retrieves SearchParameter resources by base resource type.
   * @param resourceType - FHIR resource type
   * @returns Array of SearchParameter documents for the resource type
   */
  async findByResourceType(resourceType: string): Promise<SearchParameterDocument[]> {
    return this.searchParameterModel.find({
      base: resourceType,
      status: 'active'
    }).sort({ code: 1 }).exec();
  }

  /**
   * Retrieves a specific SearchParameter by URL.
   * @param url - Canonical URL of the SearchParameter
   * @returns SearchParameter document
   * @throws NotFoundException if SearchParameter not found
   */
  async findByUrl(url: string): Promise<SearchParameterDocument> {
    const searchParameter = await this.searchParameterModel.findOne({ url: { $eq: url } }).exec();
    
    if (!searchParameter) {
      throw new NotFoundException(`SearchParameter with URL '${url}' not found`);
    }
    
    return searchParameter;
  }

  /**
   * Retrieves a single SearchParameter by ID.
   * @param id - SearchParameter ID
   * @returns SearchParameter document
   * @throws BadRequestException if ID is invalid
   * @throws NotFoundException if SearchParameter not found
   */
  async findOne(id: string): Promise<SearchParameterDocument> {
    
    if (typeof id !== 'string' || id.length === 0) {
      throw new BadRequestException('Invalid SearchParameter ID');
    }

    const searchParameter = await this.searchParameterModel.findOne({ id }).exec();
    
    if (!searchParameter) {
      throw new NotFoundException('SearchParameter not found');
    }
    
    return searchParameter;
  }

  /**
   * Updates an existing SearchParameter with new data.
   * @param id - SearchParameter ID
   * @param updateDto - Data transfer object containing update fields
   * @returns Updated SearchParameter document
   */
  async update(id: string, updateDto: UpdateSearchParameterDto): Promise<SearchParameterDocument> {
    
    const searchParameter = await this.findOne(id);
    
    // Validate URL uniqueness if URL is being updated
    if (updateDto.url && updateDto.url !== searchParameter.url) {
      await this.validateUrlUniqueness(updateDto.url);
    }
    
    // Validate base resource types if being updated
    if (updateDto.base) {
      this.validateBaseResourceTypes(updateDto.base);
    }

    Object.assign(searchParameter, updateDto);
    
    if (updateDto.date) {
      searchParameter.date = new Date(updateDto.date);
    }

    return searchParameter.save();
  }

  /**
   * Deletes a SearchParameter by ID.
   * @param id - SearchParameter ID
   * @throws NotFoundException if SearchParameter not found
   */
  async delete(id: string): Promise<void> {
    
    const result = await this.searchParameterModel.findOneAndDelete({ id }).exec();
    
    if (!result) {
      throw new NotFoundException('SearchParameter not found');
    }
  }

  /**
   * Validates that the URL is unique (not already in use by another SearchParameter).
   * @param url - URL to validate
   * @param excludeId - ID to exclude from uniqueness check (for updates)
   * @throws BadRequestException if URL already exists
   */
  private async validateUrlUniqueness(url: string, excludeId?: string): Promise<void> {
    const query: any = { url };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await this.searchParameterModel.findOne(query).exec();
    
    if (existing) {
      throw new BadRequestException(`SearchParameter with URL '${url}' already exists`);
    }
  }

  /**
   * Validates that all base resource types are valid FHIR resource types.
   * @param baseTypes - Array of resource types to validate
   * @throws BadRequestException if any resource type is invalid
   */
  private validateBaseResourceTypes(baseTypes: string[]): void {
    const validResourceTypes = [
      'Account', 'ActivityDefinition', 'AdverseEvent', 'AllergyIntolerance', 'Appointment',
      'AppointmentResponse', 'AuditEvent', 'Basic', 'Binary', 'BiologicallyDerivedProduct',
      'BodyStructure', 'Bundle', 'CapabilityStatement', 'CarePlan', 'CareTeam', 'CatalogEntry',
      'ChargeItem', 'ChargeItemDefinition', 'Claim', 'ClaimResponse', 'ClinicalImpression',
      'CodeSystem', 'Communication', 'CommunicationRequest', 'CompartmentDefinition',
      'Composition', 'ConceptMap', 'Condition', 'Consent', 'Contract', 'Coverage',
      'CoverageEligibilityRequest', 'CoverageEligibilityResponse', 'DetectedIssue', 'Device',
      'DeviceDefinition', 'DeviceMetric', 'DeviceRequest', 'DeviceUseStatement',
      'DiagnosticReport', 'DocumentManifest', 'DocumentReference', 'DomainResource',
      'EffectEvidenceSynthesis', 'Encounter', 'Endpoint', 'EnrollmentRequest',
      'EnrollmentResponse', 'EpisodeOfCare', 'EventDefinition', 'Evidence', 'EvidenceVariable',
      'ExampleScenario', 'ExplanationOfBenefit', 'FamilyMemberHistory', 'Flag', 'Goal',
      'GraphDefinition', 'Group', 'GuidanceResponse', 'HealthcareService', 'ImagingStudy',
      'Immunization', 'ImmunizationEvaluation', 'ImmunizationRecommendation',
      'ImplementationGuide', 'InsurancePlan', 'Invoice', 'Library', 'Linkage', 'List',
      'Location', 'Measure', 'MeasureReport', 'Media', 'Medication', 'MedicationAdministration',
      'MedicationDispense', 'MedicationKnowledge', 'MedicationRequest', 'MedicationStatement',
      'MedicinalProduct', 'MedicinalProductAuthorization', 'MedicinalProductContraindication',
      'MedicinalProductIndication', 'MedicinalProductIngredient', 'MedicinalProductInteraction',
      'MedicinalProductManufactured', 'MedicinalProductPackaged', 'MedicinalProductPharmaceutical',
      'MedicinalProductUndesirableEffect', 'MessageDefinition', 'MessageHeader', 'MolecularSequence',
      'NamingSystem', 'NutritionOrder', 'Observation', 'ObservationDefinition', 'OperationDefinition',
      'OperationOutcome', 'Organization', 'OrganizationAffiliation', 'Patient', 'PaymentNotice',
      'PaymentReconciliation', 'Person', 'PlanDefinition', 'Practitioner', 'PractitionerRole',
      'Procedure', 'Provenance', 'Questionnaire', 'QuestionnaireResponse', 'RelatedPerson',
      'RequestGroup', 'ResearchDefinition', 'ResearchElementDefinition', 'ResearchStudy',
      'ResearchSubject', 'RiskAssessment', 'RiskEvidenceSynthesis', 'Schedule', 'SearchParameter',
      'ServiceRequest', 'Slot', 'Specimen', 'SpecimenDefinition', 'StructureDefinition',
      'StructureMap', 'Subscription', 'Substance', 'SubstanceNucleicAcid', 'SubstancePolymer',
      'SubstanceProtein', 'SubstanceReferenceInformation', 'SubstanceSourceMaterial',
      'SubstanceSpecification', 'SupplyDelivery', 'SupplyRequest', 'Task', 'TerminologyCapabilities',
      'TestReport', 'TestScript', 'ValueSet', 'VerificationResult', 'VisionPrescription'
    ];

    const invalidTypes = baseTypes.filter(type => !validResourceTypes.includes(type));
    
    if (invalidTypes.length > 0) {
      throw new BadRequestException(`Invalid resource types: ${invalidTypes.join(', ')}`);
    }
  }
}