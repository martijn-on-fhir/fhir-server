import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { FhirController } from "./fhir/fhir.controller";
import { FhirService } from "./services/fhir/fhir.service";
import { MongooseModule } from "@nestjs/mongoose";
import { FhirResource, fhirResourceSchema } from './schema/fhir-resource-schema';
import { StructureDefinition, structureDefinitionSchema } from './schema/structure-definition';
import { ValidationService } from './services/validation/validation.service';

@Module({
  imports: [
    MongooseModule.forRoot("mongodb://localhost:27017/fhir-server", {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    }),
    MongooseModule.forFeature([
      { name: FhirResource.name, schema: fhirResourceSchema },
      { name: StructureDefinition.name, schema: structureDefinitionSchema }
    ]),
  
  ],
  controllers: [AppController, FhirController],
  providers: [AppService, FhirService, ValidationService],
  exports: [MongooseModule],
})
export class AppModule {}
