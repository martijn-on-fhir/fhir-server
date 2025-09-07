import {Module} from "@nestjs/common";
import {AppController} from "./app.controller";
import {FhirController} from "./fhir/fhir.controller";
import {FhirService} from "./services/fhir/fhir.service";
import {MongooseModule} from "@nestjs/mongoose";
import {FhirResource, fhirResourceSchema} from './schema/fhir-resource-schema';
import {StructureDefinitionSchema, structureDefinitionSchema} from './schema/structure-definition.schema';
import {ValidationService} from './services/validation/validation.service';
import {ThrottlerModule} from '@nestjs/throttler';
import {ConfigModule} from '@nestjs/config';

import {TerminologyService} from './services/terminology/terminology.service';
import configuration from './config/configuration'
import {EventEmitterModule} from '@nestjs/event-emitter'
import {FhirEventListener} from './events/fhir-event-listener'
import {subscriptionSchema, SubscriptionSchema} from './schema/subscription-schema'
import {SubscriptionService} from './services/subscription/subscription.service';
import {TerminusModule} from '@nestjs/terminus'
import {ProvenanceResource, provenanceSchema} from "./schema/provenance-schema";
import {SubscriptionController} from "./subscription/subscription.controller";
import {SubscriptionEventListener} from "./events/subscription-event-listener";
import {CronJobsService} from './services/cron-jobs/cron-jobs.service';
import {ScheduleModule} from "@nestjs/schedule";
import {systemSchema, SystemSchema} from "./schema/system-schema";
import {FsLoggerService} from "./services/logger/fs-logger.service";
import {APP_GUARD} from "@nestjs/core";
import {SecurityGuard} from "./guards/security/security.guard";
import {IpWhitelistGuard} from "./guards/ip-whitelist/ip-whitelist.guard";
import {MatchesFactory} from "./lib/subscriptions/matches-factory";
import {searchParameterSchema, SearchParameterSchema} from "./schema/search-parameter.schema";
import {SearchParameterController} from "./search-parameter/search-parameter.controller";
import {SearchParameterService} from "./services/search-parameter/search-parameter.service";
import {StructureDefinitionController} from "./structure-definition/structure-definition.controller";
import {StructureDefinitionService} from "./services/structure-definition/structure-definition.service";
import {ValueSetController} from "./value-set/value-set.controller";
import {ValueSetService} from "./services/value-set/value-set.service";
import {valueSetSchema, ValueSetSchema} from "./schema/value-set.schema";
import {RateLimitingService} from "./services/rate-limiting/rate-limiting.service";

/**
 * Generates a MongoDB connection string based on the provided configuration object.
 *
 * The function retrieves the database connection configuration and constructs
 * a MongoDB connection URI. If the configuration specifies both a username and
 * a password, an authenticated connection string is returned. Otherwise, an
 * unauthenticated connection string is returned.
 *
 * @returns {string} The MongoDB connection URI.
 */
const getConnectionString = (): string => {

    const config: any = configuration()

    if (config.mongodb.username && config.mongodb.password) {
        return `mongodb://${config.mongodb.username}:${config.mongodb.password}@${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}?authSource=admin`
    } else {
        return `mongodb://${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.database}`
    }
}

@Module({
    imports: [
        TerminusModule,
        ThrottlerModule.forRoot({
            throttlers: [
                {
                    ttl: 60000,
                    limit: 10,
                },
            ],
        }),
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration]
        }),
        MongooseModule.forRoot(getConnectionString(), {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        }),
        MongooseModule.forFeature([
            {name: FhirResource.name, schema: fhirResourceSchema},
            {name: StructureDefinitionSchema.name, schema: structureDefinitionSchema},
            {name: ValueSetSchema.name, schema: valueSetSchema},
            {name: SubscriptionSchema.name, schema: subscriptionSchema},
            {name: ProvenanceResource.name, schema: provenanceSchema},
            {name: SystemSchema.name, schema: systemSchema},
            {name: SearchParameterSchema.name, schema: searchParameterSchema}
        ]),
        EventEmitterModule.forRoot(),
        ScheduleModule.forRoot()
    ],
    controllers: [AppController, FhirController, SubscriptionController, SearchParameterController, StructureDefinitionController, ValueSetController],
    providers: [
        FhirService, ValidationService, TerminologyService, FhirEventListener, SubscriptionEventListener,
        SubscriptionService, SearchParameterService, CronJobsService, FsLoggerService, MatchesFactory, StructureDefinitionService, ValueSetService, RateLimitingService,
        {
            provide: APP_GUARD,
            useClass: IpWhitelistGuard,
        },
        {
            provide: APP_GUARD,
            useClass: SecurityGuard,
        },
    ],
    exports: [MongooseModule],
})
export class AppModule {
}
