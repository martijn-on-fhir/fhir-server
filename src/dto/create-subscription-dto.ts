import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsDateString, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator'
import { SubscriptionStatus } from '../schema/subscription-schema'
import { SubscriptionChannelDto } from './subscription-channel-dto'
import { Type } from 'class-transformer'

export class CreateSubscriptionDto {

    @ApiProperty({
        description: 'Resource type',
        example: 'Subscription',
        default: 'Subscription'
    })
    @IsString()
    resourceType: string = 'Subscription';

    @ApiProperty({
        description: 'Subscription status',
        enum: SubscriptionStatus,
        example: SubscriptionStatus.REQUESTED
    })
    @IsEnum(SubscriptionStatus)
    status: SubscriptionStatus;

    @ApiProperty({
        description: 'FHIRPath criteria for subscription',
        example: 'Patient?active=true'
    })
    @IsString()
    criteria: string;

    @ApiProperty({
        description: 'Channel information',
        type: SubscriptionChannelDto
    })
    @ValidateNested()
    @Type(() => SubscriptionChannelDto)
    channel: SubscriptionChannelDto;

    @ApiPropertyOptional({
        description: 'Human readable description',
        example: 'Notification for new active patients'
    })
    @IsOptional()
    @IsString()
    reason?: string;

    @ApiPropertyOptional({
        description: 'When to end subscription',
        example: '2025-12-31T23:59:59Z'
    })
    @IsOptional()
    @IsDateString()
    end?: string;

    @ApiPropertyOptional({ description: 'Language of the resource content' })
    @IsOptional()
    @IsString()
    language?: string;

    @ApiPropertyOptional({ description: 'Text summary of the resource' })
    @IsOptional()
    @IsObject()
    text?: {
        status: 'generated' | 'extensions' | 'additional' | 'empty';
        div: string;
    };

    @ApiPropertyOptional({ description: 'Additional extensions' })
    @IsOptional()
    @IsArray()
    extension?: any[];

    @ApiPropertyOptional({ description: 'Identifier for this subscription' })
    @IsOptional()
    @IsArray()
    identifier?: any[];
}