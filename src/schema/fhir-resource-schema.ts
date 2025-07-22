import { Schema } from "mongoose";

interface FhirResource extends Document {
  resourceType: string;
  id: string;
  meta?: {
    versionId?: string;
    lastUpdated?: Date;
    profile?: string[];
    security?: any[];
    tag?: any[];
  };
  implicitRules?: string;
  language?: string;
  text?: {
    status: string;
    div: string;
  };
  contained?: any[];
  extension?: any[];
  modifierExtension?: any[];
  [key: string]: any; // Allow any FHIR resource properties
}

export class FhirResourceSchema extends Schema {
  constructor() {
    super();

    this.index({ resourceType: 1, id: 1 }, { unique: true });
    this.index({ "meta.lastUpdated": -1 });
  }
}
