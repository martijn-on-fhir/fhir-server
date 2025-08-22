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

    /**
     * @param service
     */
    constructor(private readonly service: SubscriptionService) {
    }

    /**
     * Creates a new FHIR subscription
     * @param createSubscriptionDto - The subscription data to create
     * @returns The created subscription
     */
    @Post()
    @ApiOperation({ summary: 'Create a new FHIR subscription' })
    @ApiResponse({ status: 201, description: 'Subscription created successfully' })
    create(@Body() createSubscriptionDto: CreateSubscriptionDto): any {
        return this.service.create(createSubscriptionDto)
    }

    /**
     * Retrieves all subscriptions with optional filtering
     * @param status - Optional status filter
     * @param criteria - Optional criteria filter
     * @returns Array of matching subscriptions
     */
    @Get()
    @ApiOperation({ summary: 'Get all subscriptions' })
    @ApiQuery({ name: 'status', enum: SubscriptionStatus, required: false })
    @ApiQuery({ name: 'criteria', type: String, required: false })
    findAll(@Query('status') status?: SubscriptionStatus, @Query('criteria') criteria?: string): any {

        const filter: any = {}

        if (status && this.isValidSubscriptionStatus(status)) {
            filter.status = status as SubscriptionStatus
        }

        if (criteria) {

            const sanitizedCriteria = this.escapeRegexCharacters(criteria)
            filter.criteria = new RegExp(sanitizedCriteria, 'i')

        }

        return this.service.findAll(filter)
    }

    /**
     * Retrieves a subscription by its ID
     * @param id - The ID of the subscription
     * @returns The subscription with the specified ID
     */
    @Get(':id')
    @ApiOperation({ summary: 'Get subscription by ID' })
    findOne(@Param('id') id: string): any {
        return this.service.findOne(id)
    }

    /**
     * Updates an existing subscription
     * @param id - The ID of the subscription to update
     * @param updateDto - The updated subscription data
     * @returns The updated subscription
     */
    @Put(':id')
    @ApiOperation({ summary: 'Update subscription' })
    update(@Param('id') id: string, @Body() updateDto: UpdateSubscriptionDto): any {
        return this.service.update(id, updateDto)
    }

    /**
     * Deletes a subscription
     * @param id - The ID of the subscription to delete
     * @returns The deleted subscription
     */
    @Delete(':id')
    @ApiOperation({ summary: 'Delete subscription' })
    remove(@Param('id') id: string): any {
        return this.service.delete(id)
    }

    /**
     * Activates a subscription
     * @param id - The ID of the subscription to activate
     * @returns The activated subscription
     */
    @Post(':id/$activate')
    @ApiOperation({ summary: 'Activate subscription' })
    activate(@Param('id') id: string): any {
        return this.service.activateSubscription(id)
    }

    /**
     * Deactivates a subscription
     * @param id - The ID of the subscription to deactivate
     * @returns The deactivated subscription
     */
    @Post(':id/$deactivate')
    @ApiOperation({ summary: 'Deactivate subscription' })
    deactivate(@Param('id') id: string): any {
        return this.service.deactivateSubscription(id)
    }

    /**
     * Controleert of de gegeven waarde een geldige SubscriptionStatus enum waarde is
     */
    private isValidSubscriptionStatus(value: string): value is SubscriptionStatus {
        return Object.values(SubscriptionStatus).includes(value as SubscriptionStatus)
    }

    /**
     * Escapes special regex characters in user input to prevent regex injection
     */
    private escapeRegexCharacters(input: string): string {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

}