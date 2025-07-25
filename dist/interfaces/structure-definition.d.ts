import { ElementDefinition } from './element-definition';
export interface StructureDefinition {
    resourceType: string;
    id: string;
    url: string;
    name: string;
    type: string;
    baseDefinition: string;
    snapshot: {
        element: ElementDefinition[];
    };
}
