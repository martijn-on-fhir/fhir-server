import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StructureDefinitionDocument, StructureDefinitionSchema } from '../../schema/structure-definition.schema';
import { CreateStructureDefinitionDto } from '../../dto/create-structure-definition-dto';
import { UpdateStructureDefinitionDto } from '../../dto/update-structure-definition-dto';

/**
 * Service for managing FHIR StructureDefinition resources.
 * Handles CRUD operations for structure definitions with MongoDB storage.
 */
@Injectable()
export class StructureDefinitionService {

  constructor(
    @InjectModel(StructureDefinitionSchema.name)
    private structureDefinitionModel: Model<StructureDefinitionDocument>
  ) {}

  /**
   * Creates a new StructureDefinition resource.
   * @param createDto - Data for the new structure definition
   * @returns Created StructureDefinition document
   */
  async create(createDto: CreateStructureDefinitionDto): Promise<StructureDefinitionDocument> {
    
    await this.validateUrlUniqueness(createDto.url);
    
    const properties = {
      ...createDto,
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    };

    const structureDefinition = new this.structureDefinitionModel(properties);
    return structureDefinition.save();
  }

  /**
   * Retrieves all StructureDefinition resources matching the filter.
   * @param filter - MongoDB filter criteria
   * @returns Array of StructureDefinition documents
   */
  async findAll(filter: any = {}): Promise<StructureDefinitionDocument[]> {
    return this.structureDefinitionModel.find(filter).sort({ url: 1 }).exec();
  }

  /**
   * Finds a StructureDefinition by its canonical URL.
   * @param url - Canonical URL of the structure definition
   * @returns StructureDefinition document
   * @throws NotFoundException if not found
   */
  async findByUrl(url: string): Promise<StructureDefinitionDocument> {
    const structureDefinition = await this.structureDefinitionModel.findOne({ url: { $eq: url } }).exec();
    
    if (!structureDefinition) {
      throw new NotFoundException(`StructureDefinition with URL '${url}' not found`);
    }
    
    return structureDefinition;
  }

  /**
   * Retrieves a single StructureDefinition by ID.
   * @param id - StructureDefinition ID
   * @returns StructureDefinition document
   * @throws BadRequestException if ID is invalid
   * @throws NotFoundException if not found
   */
  async findOne(id: string): Promise<StructureDefinitionDocument> {
    
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid StructureDefinition ID');
    }

    const structureDefinition = await this.structureDefinitionModel.findById(id).exec();
    
    if (!structureDefinition) {
      throw new NotFoundException('StructureDefinition not found');
    }
    
    return structureDefinition;
  }

  /**
   * Updates an existing StructureDefinition with new data.
   * @param id - StructureDefinition ID
   * @param updateDto - Update data
   * @returns Updated StructureDefinition document
   */
  async update(id: string, updateDto: UpdateStructureDefinitionDto): Promise<StructureDefinitionDocument> {
    
    const structureDefinition = await this.findOne(id);
    
    if (updateDto.url && updateDto.url !== structureDefinition.url) {
      await this.validateUrlUniqueness(updateDto.url);
    }

    Object.assign(structureDefinition, updateDto);

    return structureDefinition.save();
  }

  /**
   * Deletes a StructureDefinition by ID.
   * @param id - StructureDefinition ID
   * @throws NotFoundException if not found
   */
  async delete(id: string): Promise<void> {
    
    const result = await this.structureDefinitionModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('StructureDefinition not found');
    }
  }

  /**
   * Validates that the URL is unique across structure definitions.
   * @param url - URL to validate
   * @param excludeId - ID to exclude from validation
   * @throws BadRequestException if URL already exists
   */
  private async validateUrlUniqueness(url: string, excludeId?: string): Promise<void> {
    const query: any = { url };
    
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existing = await this.structureDefinitionModel.findOne(query).exec();
    
    if (existing) {
      throw new BadRequestException(`StructureDefinition with URL '${url}' already exists`);
    }
  }
}