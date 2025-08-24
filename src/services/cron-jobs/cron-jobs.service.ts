import {Injectable} from '@nestjs/common';
import {Cron, CronExpression, Timeout} from "@nestjs/schedule";
import {Usage} from "../../lib/system/usage";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {SystemDocument, SystemSchema} from "../../schema/system-schema";

@Injectable()
export class CronJobsService {

    constructor(@InjectModel(SystemSchema.name) private systemModel: Model<SystemDocument>) {
    }

    @Timeout(10000)
    afterApplicationStart(): void {
        console.log('cron job executed')
    }

    @Cron(CronExpression.EVERY_MINUTE)
    handleEveryMinute(): void {

        const usage = new Usage().snapshot()

        const model = new this.systemModel(usage)
        model.save()
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
