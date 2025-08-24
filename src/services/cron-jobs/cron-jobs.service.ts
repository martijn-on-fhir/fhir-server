import {Injectable} from '@nestjs/common';
import {Cron, CronExpression, Timeout} from "@nestjs/schedule";
import {Usage} from "../../lib/system/usage";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {SystemDocument, SystemSchema} from "../../schema/system-schema";
import {ConfigService} from "@nestjs/config";

/**
 * Service responsible for managing scheduled tasks and cron jobs within the application.
 * Handles various periodic tasks including system metrics collection and routine maintenance operations.
 */
@Injectable()
export class CronJobsService {

    /**
     * Creates an instance of CronJobsService.
     * @param systemModel - Mongoose model for system metrics storage
     * @param _config - Configuration service for accessing application settings
     */
    constructor(@InjectModel(SystemSchema.name) private systemModel: Model<SystemDocument>, private readonly _config: ConfigService) {
    }

    /**
     * Executes once after application startup with a 10-second delay.
     * Used for initial setup or validation tasks.
     */
    @Timeout(10000)
    afterApplicationStart(): void {
        console.log('cron job executed')
    }

    /**
     * Executes every minute to collect and store system metrics.
     * Only runs if metrics collection is enabled in configuration.
     * Captures system resource usage including memory and CPU statistics.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    handleEveryMinute(): void {

        if (this._config.get('cron.metrics.enabled') === true) {

            const usage = new Usage().snapshot()

            const model = new this.systemModel(usage)
            model.save()
        }
    }

    /**
     * Executes hourly scheduled tasks.
     * Currently logs execution status.
     */
    @Cron(CronExpression.EVERY_HOUR)
    handleEveryHour(): void {
        console.log('Task running every hour');
    }

    /**
     * Executes daily tasks at midnight.
     * Currently logs execution status.
     */
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    handleEveryDay(): void {
        console.log('Task running every day');
    }

    /**
     * Executes weekly scheduled tasks.
     * Currently logs execution status.
     */
    @Cron(CronExpression.EVERY_WEEK)
    handleEveryWeek(): void {
        console.log('Task running every week');
    }
}
