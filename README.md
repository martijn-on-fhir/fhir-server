# FHIR Server

A robust and scalable FHIR (Fast Healthcare Interoperability Resources) server implementation built with NestJS and
MongoDB. This server provides RESTful API endpoints for managing and querying FHIR resources, supporting healthcare data
interoperability standards.

## Features

- FHIR-compliant REST API endpoints
- Comprehensive search capabilities with support for:
    - Resource type filtering
    - Identifier-based search
    - Profile-based filtering
    - Pagination support
- MongoDB integration for efficient data storage
- Standardized FHIR response formatting
- Bundle support for multiple resource responses
- Error handling with FHIR-compliant OperationOutcome responses

The server implements core FHIR operations including:

- Resource retrieval by ID
- Search operations with filtering
- Pagination support with customizable page sizes
- Support for FHIR Bundles with proper linking
- Validation by terminology server and structure defination

