import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { FhirController } from "./fhir/fhir.controller";
import { FhirService } from "./services/fhir/fhir.service";
import { MongooseModule } from "@nestjs/mongoose";
import { FhirResource, fhirResourceSchema } from './schema/fhir-resource-schema';
import { StructureDefinitionSchema, structureDefinitionSchema } from './schema/structure-definition.schema';
import { ValidationService } from './services/validation/validation.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { valueSetSchema, ValueSetSchema } from './schema/value-set-schema';
import { TerminologyService } from './services/terminology/terminology.service';
import configuration from './config/configuration'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { FhirEventListener } from './events/fhir-event-listener'
import { subscriptionSchema, SubscriptionSchema } from './schema/subscription-schema'
import { SubscriptionController } from './subscription/subscription.controller';
import { SubscriptionService } from './services/subscription/subscription.service';
import { TerminusModule } from '@nestjs/terminus'
import {ProvenanceDocument, ProvenanceResource, provenanceSchema} from "./schema/provenance-schema";

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
    MongooseModule.forRoot("mongodb://localhost:27017/fhir-server", {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    }),
    MongooseModule.forFeature([
      { name: FhirResource.name, schema: fhirResourceSchema },
      { name: StructureDefinitionSchema.name, schema: structureDefinitionSchema },
      { name: ValueSetSchema.name, schema: valueSetSchema },
      { name: SubscriptionSchema.name, schema: subscriptionSchema },
      { name: ProvenanceResource.name, schema: provenanceSchema },
    ]),
    EventEmitterModule.forRoot()
  ],
  controllers: [AppController, FhirController, SubscriptionController],
  providers: [FhirService, ValidationService, TerminologyService, FhirEventListener, SubscriptionService],
  exports: [MongooseModule],
})
export class AppModule {}
