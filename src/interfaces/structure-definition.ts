import { ElementDefinition } from './element-definition';

export interface StructureDefinition {
  resourceType: string;
  id?: string;
  meta?: Record<string, any>;
  implicitRules?: string;
  language?: string;
  text?: Record<string, any>;
  contained?: Record<string, any>[];
  extension?: Record<string, any>[];
  modifierExtension?: Record<string, any>[];
  url: string;
  identifier?: Record<string, any>[];
  version?: string;
  name: string;
  title?: string;
  status: string;
  experimental?: boolean;
  date?: Date;
  publisher?: string;
  contact?: Record<string, any>[];
  description?: string;
  useContext?: Record<string, any>[];
  jurisdiction?: Record<string, any>[];
  purpose?: string;
  copyright?: string;
  keyword?: Record<string, any>[];
  fhirVersion?: string;
  mapping?: Record<string, any>[];
  kind: string;
  abstract: boolean;
  context?: Record<string, any>[];
  contextInvariant?: string[];
  type: string;
  baseDefinition?: string;
  derivation?: string;
  snapshot?: {
    element: ElementDefinition[];
  };
  differential?: {
    element: ElementDefinition[];
  };
}
