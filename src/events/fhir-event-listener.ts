/**
 * @fileoverview FHIR Event Listener Service
 *
 * This module provides event-driven provenance tracking for FHIR resource operations.
 * It listens to various FHIR events (create, update, delete, read, search) and automatically
 * generates provenance records using the ProvenanceBuilder service.
 *
 * The service integrates with NestJS Event Emitter to provide decoupled, asynchronous
 * provenance tracking that doesn't interfere with the main FHIR operation flow.
 *
 * @author FHIR Server Team
 * @version 1.0.0
 * @since 1.0.0
 */

import {OnEvent} from '@nestjs/event-emitter'
import {Injectable} from '@nestjs/common'
import {ProvenanceBuilder} from "../lib/provenance-builder/provenance-builder";
import {InjectModel} from "@nestjs/mongoose";
import {ProvenanceDocument, ProvenanceResource} from "../schema/provenance-schema";
import {Model} from "mongoose";
import {ConfigService} from '@nestjs/config'

/**
 * Enumeration of FHIR events that can trigger provenance tracking.
 * These events correspond to standard FHIR operations and are used
 * throughout the application to maintain audit trails.
 *
 * @enum {string}
 * @readonly
 * @since 1.0.0
 * @see {@link https://www.hl7.org/fhir/provenance.html|FHIR Provenance Resource}
 */
export enum FhirEvent {
    /** Fired when a new FHIR resource is created */
    CREATED = 'fhir.created',
    /** Fired when an existing FHIR resource is updated */
    UPDATED = 'fhir.updated',
    /** Fired when a FHIR resource is deleted */
    DELETED = 'fhir.deleted',
    /** Fired when a FHIR resource is read/accessed */
    READ = 'fhir.read',
    /** Fired when a FHIR search operation is performed */
    SEARCH = 'fhir.search',
}

/**
 * Service responsible for listening to FHIR events and creating provenance records.
 *
 * This injectable service acts as a centralized event listener that automatically
 * tracks provenance for all FHIR resource operations. It uses the ProvenanceBuilder
 * to create standardized provenance records that comply with FHIR specifications.
 *
 * The service operates asynchronously and independently from the main FHIR operations,
 * ensuring that provenance tracking doesn't impact performance or reliability of
 * core FHIR functionality.
 *
 * @injectable
 * @since 1.0.0
 * @see {@link ProvenanceBuilder} for provenance record creation
 * @see {@link FhirEvent} for supported event types
 * @see {@link https://docs.nestjs.com/techniques/events|NestJS Event Emitter}
 */
@Injectable()
export class FhirEventListener {

    /** Instance of ProvenanceBuilder used to create provenance records */
    provenanceBuilder: ProvenanceBuilder

    /**
     * Creates a new FhirEventListener instance.
     *
     * @param {Model<ProvenanceDocument>} provenanceModel - Mongoose model for provenance documents
     * @param _configService
     * @since 1.0.0
     * @see {@link ProvenanceDocument} for document schema
     * @see {@link ProvenanceResource} for resource schema
     */
    constructor(@InjectModel(ProvenanceResource.name) private provenanceModel: Model<ProvenanceDocument>, private readonly _config: ConfigService) {

        if (this._config.get('authorization.provenance.enabled') === true) {
            this.provenanceBuilder = new ProvenanceBuilder(provenanceModel)
        }
    }

    /**
     * Handles FHIR resource creation events.
     *
     * This method is automatically invoked when a 'fhir.created' event is emitted.
     * It creates a provenance record with activity type 'create' to track the
     * creation of a new FHIR resource.
     *
     * @param {any} payload - Event payload containing resource data and metadata
     * @param {string} payload.resourceType - The type of FHIR resource created
     * @param {string} payload.resourceId - The ID of the created resource
     * @param {object} payload.resource - The created FHIR resource
     * @param {object} payload.request - HTTP request information
     * @param {object} payload.user - User/agent who performed the operation
     * @returns {void}
     * @since 1.0.0
     * @see {@link FhirEvent.CREATED} for event type
     * @see {@link ProvenanceBuilder.register} for registration logic
     */
    @OnEvent('fhir.created')
    handleFhirCreatedEvent(payload: any): void {

        if (this._config.get('authorization.provenance.enabled') === true) {
            this.provenanceBuilder.register(payload, 'create')
        }
    }

    /**
     * Handles FHIR resource update events.
     *
     * This method is automatically invoked when a 'fhir.updated' event is emitted.
     * It creates a provenance record with activity type 'update' to track
     * modifications to existing FHIR resources.
     *
     * @param {any} payload - Event payload containing resource data and metadata
     * @param {string} payload.resourceType - The type of FHIR resource updated
     * @param {string} payload.resourceId - The ID of the updated resource
     * @param {object} payload.resource - The updated FHIR resource
     * @param {object} payload.previousResource - The resource state before update
     * @param {object} payload.request - HTTP request information
     * @param {object} payload.user - User/agent who performed the operation
     * @returns {void}
     * @since 1.0.0
     * @see {@link FhirEvent.UPDATED} for event type
     * @see {@link ProvenanceBuilder.register} for registration logic
     */
    @OnEvent('fhir.updated')
    handleFhirUpdatedEvent(payload: any): void {

        if (this._config.get('authorization.provenance.enabled') === true) {
            this.provenanceBuilder.register(payload, 'update')
        }
    }

    /**
     * Handles FHIR resource deletion events.
     *
     * This method is automatically invoked when a 'fhir.deleted' event is emitted.
     * It creates a provenance record with activity type 'delete' to track
     * the removal of FHIR resources.
     *
     * @param {any} payload - Event payload containing resource data and metadata
     * @param {string} payload.resourceType - The type of FHIR resource deleted
     * @param {string} payload.resourceId - The ID of the deleted resource
     * @param {object} payload.resource - The deleted FHIR resource
     * @param {object} payload.request - HTTP request information
     * @param {object} payload.user - User/agent who performed the operation
     * @returns {void}
     * @since 1.0.0
     * @see {@link FhirEvent.DELETED} for event type
     * @see {@link ProvenanceBuilder.register} for registration logic
     */
    @OnEvent('fhir.deleted')
    handleFhirDeletedEvent(payload: any): void {

        if (this._config.get('authorization.provenance.enabled') === true) {
            this.provenanceBuilder.register(payload, 'delete')
        }
    }

    /**
     * Handles FHIR resource read events.
     *
     * This method is automatically invoked when a 'fhir.read' event is emitted.
     * It creates a provenance record with activity type 'read' to track
     * access to FHIR resources.
     *
     * @param {any} payload - Event payload containing resource data and metadata
     * @param {string} payload.resourceType - The type of FHIR resource read
     * @param {string} payload.resourceId - The ID of the accessed resource
     * @param {object} payload.resource - The accessed FHIR resource
     * @param {object} payload.request - HTTP request information
     * @param {object} payload.user - User/agent who performed the operation
     * @returns {void}
     * @since 1.0.0
     * @see {@link FhirEvent.READ} for event type
     * @see {@link ProvenanceBuilder.register} for registration logic
     */
    @OnEvent('fhir.read')
    handleFhirReadEvent(payload: any): void {

        if (this._config.get('authorization.provenance.enabled') === true) {
            this.provenanceBuilder.register(payload, 'read')
        }
    }

    /**
     * Handles FHIR search operation events.
     *
     * This method is automatically invoked when a 'fhir.search' event is emitted.
     * It creates a provenance record with activity type 'execute' to track
     * search operations performed on FHIR resources.
     *
     * @param {any} payload - Event payload containing search data and metadata
     * @param {string} payload.resourceType - The type of FHIR resource searched
     * @param {object} payload.searchParameters - The search parameters used
     * @param {object} payload.results - The search results returned
     * @param {object} payload.request - HTTP request information
     * @param {object} payload.user - User/agent who performed the operation
     * @returns {void}
     * @since 1.0.0
     * @see {@link FhirEvent.SEARCH} for event type
     * @see {@link ProvenanceBuilder.register} for registration logic
     */
    @OnEvent('fhir.search')
    handleFhirSearchEvent(payload: any): void {

        if (this._config.get('authorization.provenance.enabled') === true) {
            this.provenanceBuilder.register(payload, 'execute')
        }
    }
}