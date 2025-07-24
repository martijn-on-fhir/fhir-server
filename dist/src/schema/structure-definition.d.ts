import { Document } from 'mongoose';
export type StructureDefinitionDocument = StructureDefinition & Document;
export declare class StructureDefinition {
    resourceType: string;
    url: string;
    release: number;
    definition: Record<string, any>;
}
export declare const structureDefinitionSchema: import("mongoose").Schema<StructureDefinition, import("mongoose").Model<StructureDefinition, any, any, any, Document<unknown, any, StructureDefinition, any> & StructureDefinition & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StructureDefinition, Document<unknown, {}, import("mongoose").FlatRecord<StructureDefinition>, {}> & import("mongoose").FlatRecord<StructureDefinition> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
