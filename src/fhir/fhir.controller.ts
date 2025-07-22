import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { FhirService } from "../services/fhir/fhir.service";

@Controller("fhir")
export class FhirController {
  constructor(private readonly _service: FhirService) {}

  @Get(":resourceType")
  async searchResources(
    @Param("resourceType") resourceType: string,
    @Query() searchParams: any,
  ) {
    // Generieke zoeklogica voor alle resource types
    this._service.find(resourceType, searchParams);
  }

  @Get(":resourceType/:id")
  async getResource(
    @Param("resourceType") resourceType: string,
    @Param("id") id: string,
  ) {
    // Generieke get-logica
    this._service.findById(resourceType, id);
  }

  @Post(":resourceType")
  async createResource(
    @Param("resourceType") resourceType: string,
    @Body() resource: any,
  ) {
    // Generieke create-logica met validatie
  }
}
