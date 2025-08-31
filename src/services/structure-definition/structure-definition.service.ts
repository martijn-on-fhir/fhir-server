import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StructureDefinitionDocument, StructureDefinitionSchema } from '../../schema/structure-definition.schema';
import { CreateStructureDefinitionDto } from '../../dto/create-structure-definition-dto';
import { UpdateStructureDefinitionDto } from '../../dto/update-structure-definition-dto';

@Injectable()
export class StructureDefinitionService {

  constructor(
    @InjectModel(StructureDefinitionSchema.name)
    private structureDefinitionModel: Model<StructureDefinitionDocument>
  ) {}

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

  async findAll(filter: any = {}): Promise<StructureDefinitionDocument[]> {
    return this.structureDefinitionModel.find(filter).sort({ url: 1 }).exec();
  }

  async findByUrl(url: string): Promise<StructureDefinitionDocument> {
    const structureDefinition = await this.structureDefinitionModel.findOne({ url: { $eq: url } }).exec();
    
    if (!structureDefinition) {
      throw new NotFoundException(`StructureDefinition with URL '${url}' not found`);
    }
    
    return structureDefinition;
  }

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

  async update(id: string, updateDto: UpdateStructureDefinitionDto): Promise<StructureDefinitionDocument> {
    
    const structureDefinition = await this.findOne(id);
    
    if (updateDto.url && updateDto.url !== structureDefinition.url) {
      await this.validateUrlUniqueness(updateDto.url);
    }

    Object.assign(structureDefinition, updateDto);

    return structureDefinition.save();
  }

  async delete(id: string): Promise<void> {
    
    const result = await this.structureDefinitionModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('StructureDefinition not found');
    }
  }

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