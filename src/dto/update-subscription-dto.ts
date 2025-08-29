import { ApiPropertyOptional } from '@nestjs/swagger'
import { SubscriptionStatus } from '../schema/subscription-schema'
import { IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { SubscriptionChannelDto } from './subscription-channel-dto'

export class UpdateSubscriptionDto {
  
  @ApiPropertyOptional({
    description: 'Subscription status',
    enum: SubscriptionStatus,
    example: SubscriptionStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
  
  @ApiPropertyOptional({
    description: 'FHIRPath criteria for subscription',
    example: 'Patient?active=true'
  })
  @IsOptional()
  @IsString()
  criteria?: string;
  
  @ApiPropertyOptional({
    description: 'Channel information',
    type: SubscriptionChannelDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SubscriptionChannelDto)
  channel?: SubscriptionChannelDto;
  
  @ApiPropertyOptional({
    description: 'Human readable description',
    example: 'Updated notification for active patients'
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
}
