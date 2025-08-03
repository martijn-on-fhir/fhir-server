import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { AuthorizerGuard } from '../guards/authorizer/authorizer.guard'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'
import { SubscriptionService } from '../services/subscription/subscription.service'
import { SubscriptionStatus } from '../schema/subscription-schema'
import { CreateSubscriptionDto } from '../dto/create-subscription-dto'
import { UpdateSubscriptionDto } from '../dto/update-subscription-dto'

@UseGuards(AuthorizerGuard)
@ApiTags('Subscriptions')
@Controller('subscription')
export class SubscriptionController {
  
  constructor(private readonly service: SubscriptionService) {
  }
  
  @Post()
  @ApiOperation({ summary: 'Create a new FHIR subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  create(@Body() createSubscriptionDto: CreateSubscriptionDto): any {
    return this.service.create(createSubscriptionDto)
  }
  
  @Get()
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiQuery({ name: 'status', enum: SubscriptionStatus, required: false })
  @ApiQuery({ name: 'criteria', type: String, required: false })
  findAll(@Query('status') status?: SubscriptionStatus, @Query('criteria') criteria?: string): any {
    
    const filter: any = {}
    
    if (status) {
      filter.status = status
    }
    
    if (criteria) {
      filter.criteria = new RegExp(criteria, 'i')
    }
    
    return this.service.findAll(filter)
  }
  
  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  findOne(@Param('id') id: string): any {
    return this.service.findOne(id)
  }
  
  @Put(':id')
  @ApiOperation({ summary: 'Update subscription' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionDto): any {
    return this.service.update(id, updateDto)
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Delete subscription' })
  remove(@Param('id') id: string): any {
    return this.service.delete(id)
  }
  
  @Post(':id/$activate')
  @ApiOperation({ summary: 'Activate subscription' })
  activate(@Param('id') id: string): any {
    return this.service.activateSubscription(id)
  }
  
  @Post(':id/$deactivate')
  @ApiOperation({ summary: 'Deactivate subscription' })
  deactivate(@Param('id') id: string): any {
    return this.service.deactivateSubscription(id)
  }
}
