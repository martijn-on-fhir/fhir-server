import { Injectable } from '@nestjs/common';
import {Cron, CronExpression, Timeout} from "@nestjs/schedule";

@Injectable()
export class CronJobsService {

    @Timeout(10000)
    afterApplicationStart(): void {
        console.log('cron job executed')
    }

    @Cron(CronExpression.EVERY_MINUTE)
    handleEveryMinute(): void {
        console.log('Task running every minute');
    }

    @Cron(CronExpression.EVERY_HOUR)
    handleEveryHour(): void {
        console.log('Task running every hour');
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    handleEveryDay(): void {
        console.log('Task running every day');
    }

    @Cron(CronExpression.EVERY_WEEK)
    handleEveryWeek(): void {
        console.log('Task running every week');
    }
}
