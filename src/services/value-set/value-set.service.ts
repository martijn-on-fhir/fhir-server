import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ValueSetDocument, ValueSetSchema, ValueSetStatus } from '../../schema/value-set.schema';
import { CreateValueSetDto } from '../../dto/create-value-set-dto';
import { UpdateValueSetDto } from '../../dto/update-value-set-dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for managing FHIR ValueSet resources.
 * Provides CRUD operations and validation for ValueSet definitions.
 */
@Injectable()
export class ValueSetService {

  constructor(
    @InjectModel(ValueSetSchema.name)
    private valueSetModel: Model<ValueSetDocument>
  ) {}

  /**
   * Creates a new ValueSet resource.
   * @param createDto - Data transfer object containing ValueSet details
   * @returns Created ValueSet document
   */
  async create(createDto: CreateValueSetDto): Promise<ValueSetDocument> {
    
    // Validate URL uniqueness
    await this.validateUrlUniqueness(createDto.url);
    
    // Validate status
    this.validateStatus(createDto.status);
    
    const properties = {
      id: uuidv4(),
      ...createDto,
      date: createDto.date ? new Date(createDto.date) : new Date(),
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      },
      resourceType: 'ValueSet'
    };

    const valueSet = new this.valueSetModel(properties);
    return valueSet.save();
  }

  /**
   * Retrieves all ValueSet resources matching the provided filter.
   * @param filter - MongoDB filter criteria
   * @returns Array of ValueSet documents
   */
  async findAll(filter: any = {}): Promise<ValueSetDocument[]> {
    return this.valueSetModel.find(filter).sort({ name: 1 }).exec();
  }

  /**
   * Retrieves ValueSets by status.
   * @param status - ValueSet status
   * @returns Array of ValueSet documents with the specified status
   */
  async findByStatus(status: ValueSetStatus): Promise<ValueSetDocument[]> {
    return this.valueSetModel.find({ status }).sort({ name: 1 }).exec();
  }

  /**
   * Retrieves a specific ValueSet by URL.
   * @param url - Canonical URL of the ValueSet
   * @returns ValueSet document
   * @throws NotFoundException if ValueSet not found
   */
  async findByUrl(url: string): Promise<ValueSetDocument> {
    const valueSet = await this.valueSetModel.findOne({ url: { $eq: url } }).exec();
    
    if (!valueSet) {
      throw new NotFoundException(`ValueSet with URL '${url}' not found`);
    }
    
    return valueSet;
  }

  /**
   * Retrieves a single ValueSet by ID.
   * @param id - ValueSet ID
   * @returns ValueSet document
   * @throws BadRequestException if ID is invalid
   * @throws NotFoundException if ValueSet not found
   */
  async findOne(id: string): Promise<ValueSetDocument> {
    
    if (typeof id !== 'string' || id.length === 0) {
      throw new BadRequestException('Invalid ValueSet ID');
    }

    const valueSet = await this.valueSetModel.findOne({ id }, {_id: 0}).exec();
    
    if (!valueSet) {
      throw new NotFoundException('ValueSet not found');
    }
    
    return valueSet;
  }

  /**
   * Updates an existing ValueSet with new data.
   * @param id - ValueSet ID
   * @param updateDto - Data transfer object containing update fields
   * @returns Updated ValueSet document
   */
  async update(id: string, updateDto: UpdateValueSetDto): Promise<ValueSetDocument> {
    
    const valueSet = await this.findOne(id);
    
    // Validate URL uniqueness if URL is being updated
    if (updateDto.url && updateDto.url !== valueSet.url) {
      await this.validateUrlUniqueness(updateDto.url);
    }
    
    // Validate status if being updated
    if (updateDto.status) {
      this.validateStatus(updateDto.status);
    }

    Object.assign(valueSet, updateDto);
    
    if (updateDto.date) {
      valueSet.date = new Date(updateDto.date);
    }

    // Update meta information
    valueSet.meta = {
      ...valueSet.meta,
      lastUpdated: new Date(),
      versionId: String(Number(valueSet.meta?.versionId || '1') + 1)
    };

    return valueSet.save();
  }

  /**
   * Deletes a ValueSet by ID.
   * @param id - ValueSet ID
   * @throws NotFoundException if ValueSet not found
   */
  async delete(id: string): Promise<void> {
    
    const result = await this.valueSetModel.findOneAndDelete({ id }).exec();
    
    if (!result) {
      throw new NotFoundException('ValueSet not found');
    }
  }

  /**
   * Expands a ValueSet by resolving all codes from included code systems.
   * @param id - ValueSet ID
   * @returns ValueSet document with expanded codes
   */
  async expand(id: string): Promise<ValueSetDocument> {
    const valueSet = await this.findOne(id);
    
    // This is a simplified expansion - in a real implementation,
    // you would resolve codes from the actual code systems
    if (!valueSet.expansion) {
      valueSet.expansion = {
        timestamp: new Date(),
        contains: []
      };
    }
    
    return valueSet;
  }

  /**
   * Validates a code against a ValueSet.
   * @param id - ValueSet ID
   * @param system - Code system URI
   * @param code - Code to validate
   * @returns Boolean indicating if code is valid
   */
  async validateCode(id: string, system: string, code: string): Promise<boolean> {
    const valueSet = await this.findOne(id);
    
    // Simple validation - check if code exists in expansion
    if (valueSet.expansion?.contains) {
      return valueSet.expansion.contains.some(
        concept => concept.system === system && concept.code === code
      );
    }
    
    // If no expansion, check compose includes
    if (valueSet.compose?.include) {
      return valueSet.compose.include.some(include =>
        include.system === system &&
        include.concept?.some(concept => concept.code === code)
      );
    }
    
    return false;
  }

  /**
   * Validates that the URL is unique (not already in use by another ValueSet).
   * @param url - URL to validate
   * @param excludeId - ID to exclude from uniqueness check (for updates)
   * @throws BadRequestException if URL already exists
   */
  private async validateUrlUniqueness(url: string, excludeId?: string): Promise<void> {
    const query: any = { url };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await this.valueSetModel.findOne(query).exec();
    
    if (existing) {
      throw new BadRequestException(`ValueSet with URL '${url}' already exists`);
    }
  }

  /**
   * Validates that the status is a valid FHIR ValueSet status.
   * @param status - Status to validate
   * @throws BadRequestException if status is invalid
   */
  private validateStatus(status: string): void {
    const validStatuses = Object.values(ValueSetStatus);
    
    if (!validStatuses.includes(status as ValueSetStatus)) {
      throw new BadRequestException(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
}