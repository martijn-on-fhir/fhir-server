import { Document } from 'mongoose';
export type ValueSetDocument = ValueSetSchema & Document;
export declare class ValueSetSchema {
    url: string;
    resourceType: string;
    expansion: Record<string, any>[];
    value: Record<string, any>;
}
export declare const valueSetSchema: import("mongoose").Schema<ValueSetSchema, import("mongoose").Model<ValueSetSchema, any, any, any, Document<unknown, any, ValueSetSchema, any> & ValueSetSchema & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ValueSetSchema, Document<unknown, {}, import("mongoose").FlatRecord<ValueSetSchema>, {}> & import("mongoose").FlatRecord<ValueSetSchema> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
