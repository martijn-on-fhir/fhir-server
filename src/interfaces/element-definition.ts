export interface ElementDefinition {
  id: string;
  path: string;
  min: number;
  max: string;
  type?: Array<{ code: string; profile?: string[] }>;
  constraint?: Array<{ key: string; severity: string; human: string; expression: string }>;
  patternCodeableConcept?: any;
  patternQuantity?: any;
  fixedUri?: string;
  binding?: { strength: string; valueSet: string };
  sliceName?: string;
  base?: {path: string, min: number, max: string}
}
