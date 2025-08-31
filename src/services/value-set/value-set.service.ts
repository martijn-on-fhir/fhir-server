import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ValueSetDocument, ValueSetSchema } from '../../schema/value-set-schema';
import { CreateValueSetDto } from '../../dto/create-value-set-dto';
import { UpdateValueSetDto } from '../../dto/update-value-set-dto';

@Injectable()
export class ValueSetService {

  constructor(
    @InjectModel(ValueSetSchema.name)
    private valueSetModel: Model<ValueSetDocument>
  ) {}

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

  async findAll(filter: any = {}): Promise<ValueSetDocument[]> {
    return this.valueSetModel.find(filter).sort({ url: 1 }).exec();
  }

  async findByUrl(url: string): Promise<ValueSetDocument> {
    const valueSet = await this.valueSetModel.findOne({ url: { $eq: url } }).exec();
    
    if (!valueSet) {
      throw new NotFoundException(`ValueSet with URL '${url}' not found`);
    }
    
    return valueSet;
  }

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

  async update(id: string, updateDto: UpdateValueSetDto): Promise<ValueSetDocument> {
    
    const valueSet = await this.findOne(id);
    
    if (updateDto.url && updateDto.url !== valueSet.url) {
      await this.validateUrlUniqueness(updateDto.url);
    }

    Object.assign(valueSet, updateDto);

    return valueSet.save();
  }

  async delete(id: string): Promise<void> {
    
    const result = await this.valueSetModel.findByIdAndDelete(id).exec();
    
    if (!result) {
      throw new NotFoundException('ValueSet not found');
    }
  }

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