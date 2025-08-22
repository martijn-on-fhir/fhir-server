import {IncomingMessage} from "node:http";

export interface EventPayload {
    resourceType: "string",
    id?: "string",
    searchParams?: "string"
    request: IncomingMessage
}