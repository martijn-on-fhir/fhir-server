import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ValueSetDocument, ValueSetSchema } from '../../schema/value-set-schema';
import { CreateValueSetDto } from '../../dto/create-value-set-dto';
import { UpdateValueSetDto } from '../../dto/update-value-set-dto';

/**
 * Service responsible for managing FHIR ValueSet resources.
 * Provides CRUD operations and validation for ValueSet resources.
 */

@Injectable()
export class ValueSetService {

  constructor(
    @InjectModel(ValueSetSchema.name)
    private valueSetModel: Model<ValueSetDocument>
  ) {}

    /**
     * Creates a new ValueSet resource
     * @param createDto - The DTO containing ValueSet creation data
     * @returns Promise resolving to the created ValueSet document
     * @throws {BadRequestException} If a ValueSet with the same URL already exists
     */
    async create(createDto: CreateValueSetDto): Promise<ValueSetDocument> {
    
    await this.validateUrlUniqueness(createDto.url);
    
    const properties = {
      ...createDto,
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    };

    const valueSet = new this.valueSetModel(properties);
    return valueSet.save();
  }

    /**
     * Retrieves all ValueSet resources matching the optional filter
     * @param filter - Optional MongoDB query filter
     * @returns Promise resolving to array of ValueSet documents
     */
    async findAll(filter: any = {}): Promise<ValueSetDocument[]> {
    return this.valueSetModel.find(filter).sort({ url: 1 }).exec();
  }

    /**
     * Finds a ValueSet by its canonical URL
     * @param url - The canonical URL to search for
     * @returns Promise resolving to the found ValueSet document
     * @throws {NotFoundException} If no ValueSet is found with the given URL
     */
    async findByUrl(url: string): Promise<ValueSetDocument> {
    const valueSet = await this.valueSetModel.findOne({ url: { $eq: url } }).exec();
    
    if (!valueSet) {
      throw new NotFoundException(`ValueSet with URL '${url}' not found`);
    }
    
    return valueSet;
  }

    /**
     * Finds a ValueSet by its ID
     * @param id - The ValueSet ID to search for
     * @returns Promise resolving to the found ValueSet document
     * @throws {BadRequestException} If the ID format is invalid
     * @throws {NotFoundException} If no ValueSet is found with the given ID
     */
    async findOne(id: string): Promise<ValueSetDocument> {
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ValueSet ID');
    }

    const valueSet = await this.valueSetModel.findById(id).exec();
    
    if (!valueSet) {
      throw new NotFoundException('ValueSet not found');
    }
    
    return valueSet;
  }

    /**
     * Updates an existing ValueSet
     * @param id - The ID of the ValueSet to update
     * @param updateDto - The DTO containing ValueSet update data
     * @returns Promise resolving to the updated ValueSet document
     * @throws {NotFoundException} If no ValueSet is found with the given ID
     * @throws {BadRequestException} If updating to a URL that already exists
     */
    async update(id: string, updateDto: UpdateValueSetDto): Promise<ValueSetDocument> {
    
    const valueSet = await this.findOne(id);
    
    if (updateDto.url && updateDto.url !== valueSet.url) {
      await this.validateUrlUniqueness(updateDto.url);
    }

    Object.assign(valueSet, updateDto);

    return valueSet.save();
  }

    /**
     * Deletes a ValueSet by its ID
     * @param id - The ID of the ValueSet to delete
     * @throws {NotFoundException} If no ValueSet is found with the given ID
     */
    async delete(id: string): Promise<void> {
    
    const result = await this.valueSetModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('ValueSet not found');
    }
  }

    /**
     * Validates that a ValueSet URL is unique
     * @param url - The URL to validate
     * @param excludeId - Optional ID to exclude from uniqueness check
     * @throws {BadRequestException} If a ValueSet with the same URL already exists
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
}