import {Injectable} from '@nestjs/common';
import {Cron, CronExpression, Timeout, SchedulerRegistry} from "@nestjs/schedule";
import {Usage} from "../../lib/system/usage";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {SystemDocument, SystemSchema} from "../../schema/system-schema";
import {ConfigService} from "@nestjs/config";
import {CronJob} from "cron";
import {Backup} from "../../lib/backup/backup";

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
     * @param schedulerRegistry
     */
    constructor(@InjectModel(SystemSchema.name) private systemModel: Model<SystemDocument>, private readonly _config: ConfigService,
                private schedulerRegistry: SchedulerRegistry, @InjectModel(SystemSchema.name) private systemModel: Model<SystemDocument>) {

        const actions = this._config.get('cron')

        for (const name of Object.keys(actions)) {

            const action = actions[name]

            if (action.enabled === true && typeof action.interval === 'string' && action.interval.length > 0) {

                const fnc = `handle${name.charAt(0).toUpperCase()}${name.slice(1)}`

                if (typeof this[fnc] === 'function')
                    this[fnc](action)
            }
        }
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

    @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
    handleFirstDayOfMonth(): void {

        // delete all records older than one month
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        await this.systemModel.deleteMany({createdAt: {$lt: oneMonthAgo}});
    }

    /**
     * Executes weekly scheduled tasks.
     * Currently logs execution status.
     */
    @Cron(CronExpression.EVERY_WEEK)
    handleEveryWeek(): void {
        console.log('Task running every week');
    }

    /**
     * Handles the creation and management of a backup process using a scheduled cron job.
     *
     * @param {Object} properties - Configuration settings for the backup process.
     * @param {boolean} properties.enable - Determines whether the backup process should be enabled.
     * @param {string} properties.directory - The directory where the backup files will be stored.
     * @param {string} properties.interval - The cron expression defining the backup schedule.
     * @return {void} This method does not return any value.
     */
    private handleBackup(properties: { enable: boolean, directory: string, interval: string }): void {

        const job = new CronJob(`${properties.interval}`, () => {

            const backup = new Backup(properties.directory)
            backup.execute()
        });

        this.schedulerRegistry.addCronJob('backup', job);
        job.start();
    }
}
