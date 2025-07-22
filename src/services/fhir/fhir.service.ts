import { Injectable } from "@nestjs/common";

@Injectable()
export class FhirService {
  async findById(resourceType: string, id: string) {
    // Dynamische query building voor alle resource types
  }

  async find(resourceType: string, searchParams: any) {
    // Dynamische query building voor alle resource types
  }

  async validate(resourceType: string, resource: any) {
    // Generieke FHIR resource validatie
  }

  async transformT(resourceType: string, data: any) {
    // Generieke FHIR formatting
  }
}
