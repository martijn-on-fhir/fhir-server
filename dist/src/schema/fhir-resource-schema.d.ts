import { Document } from 'mongoose';
export type FhirResourceDocument = FhirResource & Document;
export declare class FhirResource {
    id: string;
    resourceType: string;
    resource: Record<string, any>;
    tags: string[];
}
export declare const fhirResourceSchema: import("mongoose").Schema<FhirResource, import("mongoose").Model<FhirResource, any, any, any, Document<unknown, any, FhirResource, any> & FhirResource & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, FhirResource, Document<unknown, {}, import("mongoose").FlatRecord<FhirResource>, {}> & import("mongoose").FlatRecord<FhirResource> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
