import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { FhirController } from "./fhir/fhir.controller";
import { FhirService } from "./services/fhir/fhir.service";
import { MongooseModule } from "@nestjs/mongoose";
import { FhirResource, fhirResourceSchema } from './schema/fhir-resource-schema';
import { StructureDefinitionSchema, structureDefinitionSchema } from './schema/structure-definition.schema';
import { ValidationService } from './services/validation/validation.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 10,
        },
      ],
    }),
    ConfigModule.forRoot(),
    MongooseModule.forRoot("mongodb://localhost:27017/fhir-server", {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    }),
    MongooseModule.forFeature([
      { name: FhirResource.name, schema: fhirResourceSchema },
      { name: StructureDefinitionSchema.name, schema: structureDefinitionSchema }
    ]),
  
  ],
  controllers: [AppController, FhirController],
  providers: [AppService, FhirService, ValidationService],
  exports: [MongooseModule],
})
export class AppModule {}
