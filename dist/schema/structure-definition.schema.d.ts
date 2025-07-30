import { Document } from 'mongoose';
export type StructureDefinitionDocument = StructureDefinitionSchema & Document;
export declare class StructureDefinitionSchema {
    resourceType: string;
    url: string;
    release: number;
    definition: Record<string, any>;
}
export declare const structureDefinitionSchema: import("mongoose").Schema<StructureDefinitionSchema, import("mongoose").Model<StructureDefinitionSchema, any, any, any, Document<unknown, any, StructureDefinitionSchema, any> & StructureDefinitionSchema & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StructureDefinitionSchema, Document<unknown, {}, import("mongoose").FlatRecord<StructureDefinitionSchema>, {}> & import("mongoose").FlatRecord<StructureDefinitionSchema> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
