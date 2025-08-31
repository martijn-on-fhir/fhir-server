# FHIR Server - Project Structure Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FHIR SERVER ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                          HTTP Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   main.ts       │  │  app.controller │  │   Swagger UI    │ │
│  │  (Bootstrap)    │  │  (Health Check) │  │  (API Docs)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      Security & Middleware                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ SecurityGuard   │  │ AuthorizerGuard │  │FhirAuthGuard    │ │
│  │ (Rate Limiting) │  │ (Authentication)│  │ (FHIR Auth)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                        Controller Layer                        │
│  ┌─────────────────────────────────┐  ┌─────────────────────────│
│  │        FhirController           │  │   SubscriptionController│
│  │  ┌─────────────────────────────┐│  │ ┌─────────────────────────
│  │  │ • GET /fhir/:type           ││  │ │ • POST /subscription    
│  │  │ • GET /fhir/:type/:id       ││  │ │ • PUT /subscription/:id 
│  │  │ • POST /fhir/:type          ││  │ │ • DELETE /subscription  
│  │  │ • PUT /fhir/:type/:id       ││  │ │ • GET /subscription     
│  │  │ • DELETE /fhir/:type/:id    ││  │ └─────────────────────────
│  │  │ • POST /fhir/$validate      ││  │                         
│  │  │ • GET /fhir/metadata        ││  │                         
│  │  └─────────────────────────────┘│  │                         
│  └─────────────────────────────────┘  └─────────────────────────│
├─────────────────────────────────────────────────────────────────┤
│                         Service Layer                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   FhirService   │ │ValidationService│ │TerminologyService│  │
│  │ • CRUD Operations│ │• Structure Defs │ │ • ValueSet Val. │   │
│  │ • Search Logic  │ │• Resource Valid.│ │ • Terminology   │   │
│  │ • Bundle Creation│ │• FHIR Compliance│ │   Server Int.   │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│                                                                 │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │SubscriptionSvc  │ │  CronJobsService│ │  FsLoggerService│   │
│  │ • Event Matching│ │ • Cleanup Tasks │ │ • File Logging  │   │
│  │ • Notifications │ │ • System Metrics│ │ • Error Tracking│   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                        Library Layer                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Operations                               ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────┐ ││
│  │ │CreateOp     │ │ UpdateOp    │ │ DeleteOp    │ │SearchOp│ ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └────────┘ ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐││
│  │ │IncludeOp    │ │ RevIncludeOp│ │    QueryBuilder         │││
│  │ └─────────────┘ └─────────────┘ └─────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Utilities                                 ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐││
│  │ │FhirResponse │ │ Metadata    │ │   Authorization         │││
│  │ │ Builder     │ │ Generator   │ │   (FHIR Scopes)         │││
│  │ └─────────────┘ └─────────────┘ └─────────────────────────┘││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐││
│  │ │Subscriptions│ │ Provenance  │ │   Validation Utils      │││
│  │ │ Matching    │ │ Builder     │ │   (Type Validation)     │││
│  │ └─────────────┘ └─────────────┘ └─────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                         Event System                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                Event Emitter (NestJS)                      ││
│  │                                                             ││
│  │ ┌─────────────────┐              ┌─────────────────────────┐││
│  │ │FhirEventListener│────────────▶ │SubscriptionEventListener│││
│  │ │• Resource Change│              │ • Match Subscriptions   │││
│  │ │• Provenance Log │              │ • Send Notifications    │││
│  │ └─────────────────┘              └─────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                        Data Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     MongoDB + Mongoose                     ││
│  │                                                             ││
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐││
│  │ │  FhirResource   │ │StructureDefinition│ │   ValueSet    │││
│  │ │  (All FHIR      │ │   (Profiles)    │ │ (Terminology) │││
│  │ │   Resources)    │ │                 │ │               │││
│  │ └─────────────────┘ └─────────────────┘ └─────────────────┘││
│  │                                                             ││
│  │ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐││
│  │ │  Subscription   │ │   Provenance    │ │     System      │││
│  │ │  (Event Rules)  │ │   (Audit Log)   │ │   (Metrics)     │││
│  │ └─────────────────┘ └─────────────────┘ └─────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Module Structure

### 📁 Project Directory Layout

```
src/
├── 🚀 main.ts                          # Application bootstrap
├── 🔧 app.module.ts                    # Root module configuration
├── 🏥 app.controller.ts                # Health check endpoints
│
├── 📋 controllers/
│   ├── 🔄 fhir/fhir.controller.ts      # Main FHIR REST API
│   └── 📨 subscription/subscription.controller.ts
│
├── ⚙️ services/
│   ├── fhir/fhir.service.ts            # Core FHIR operations
│   ├── validation/validation.service.ts # FHIR validation
│   ├── terminology/terminology.service.ts # ValueSet validation
│   ├── subscription/subscription.service.ts # Event subscriptions
│   ├── logger/fs-logger.service.ts     # File system logging
│   └── cron-jobs/cron-jobs.service.ts  # Scheduled tasks
│
├── 🛡️ guards/
│   ├── security/security.guard.ts      # Rate limiting, CSRF
│   ├── authorizer/authorizer.guard.ts  # Authentication
│   └── fhir-authorizer/fhir-authorizer.guard.ts # FHIR permissions
│
├── 📚 lib/
│   ├── operations/                     # FHIR operation handlers
│   │   ├── create-operation.ts
│   │   ├── update-operation.ts
│   │   ├── delete-operation.ts
│   │   ├── search-operation.ts
│   │   ├── include-operation.ts
│   │   └── rev-include-operation.ts
│   │
│   ├── query-builder/query-builder.ts  # MongoDB query construction
│   ├── fhir-response.ts                # FHIR response formatting
│   ├── metadata.ts                     # CapabilityStatement generation
│   ├── authorization/                  # FHIR scope-based auth
│   ├── validation/                     # Type validation utilities
│   ├── subscriptions/                  # Subscription matching logic
│   ├── provenance-builder/             # Audit trail generation
│   └── backup/                         # Data backup utilities
│
├── 🗂️ schema/ (Mongoose Models)
│   ├── fhir-resource-schema.ts         # Universal FHIR resource
│   ├── structure-definition.schema.ts   # FHIR profiles
│   ├── value-set-schema.ts             # Terminology
│   ├── subscription-schema.ts          # Event subscriptions
│   ├── provenance-schema.ts            # Audit log
│   └── system-schema.ts                # System metrics
│
├── 🎭 dto/ (Data Transfer Objects)
│   ├── create-resource-dto.ts
│   ├── update-resource-dto.ts
│   ├── validate-resource-dto.ts
│   ├── fhir-search-params-dto.ts
│   └── subscription-*.dto.ts
│
├── 🎪 events/
│   ├── fhir-event-listener.ts          # Resource change events
│   └── subscription-event-listener.ts   # Subscription notifications
│
├── 🔒 filters/
│   ├── fhir-forbidden-exception.filter.ts
│   └── fhir-bad-request-exception.filter.ts
│
├── 🔗 interfaces/
│   ├── search-result.ts
│   ├── validation-result.ts
│   ├── user-context.ts
│   ├── authorization-context.ts
│   └── ... (various type definitions)
│
└── ⚙️ config/
    └── configuration.ts                # Environment-based config
```

## Data Flow Architecture

### 🔄 Request Processing Flow

```
HTTP Request
     │
     ▼
┌─────────────────┐
│ Security Guards │ ◄── Rate Limiting, CSRF Protection
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Auth Guards     │ ◄── JWT Validation, FHIR Scopes
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Controllers     │ ◄── Route Handling, DTO Validation
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Services        │ ◄── Business Logic
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Operations      │ ◄── FHIR-specific Operations
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Query Builder   │ ◄── MongoDB Query Construction
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ MongoDB         │ ◄── Data Persistence
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Event System    │ ◄── Resource Change Notifications
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ FHIR Response   │ ◄── Standardized FHIR Output
└─────────────────┘
```

### 📡 Event-Driven Architecture

```
Resource Change Event
          │
          ▼
┌─────────────────────────┐
│  FhirEventListener      │
│  • Validates change     │
│  • Creates provenance   │
│  • Emits event         │
└─────────────────────────┘
          │
          ▼
┌─────────────────────────┐
│ SubscriptionEventListener│
│  • Matches criteria     │
│  • Sends notifications  │
│  • Logs delivery        │
└─────────────────────────┘
```

## Key Design Patterns

### 🏗️ Architectural Patterns
- **Module Pattern**: NestJS dependency injection
- **Repository Pattern**: Mongoose schemas as repositories  
- **Command Pattern**: Operation classes for FHIR actions
- **Observer Pattern**: Event-driven subscriptions
- **Builder Pattern**: Query and response builders
- **Factory Pattern**: Subscription matching factory

### 🔐 Security Layers
1. **Network**: Helmet.js security headers
2. **Rate Limiting**: Throttler module
3. **Authentication**: JWT token validation
4. **Authorization**: FHIR scope-based permissions
5. **Input Validation**: Class-validator DTOs
6. **CSRF Protection**: Built-in middleware

### 📊 Monitoring & Observability
- **Logging**: File-based structured logging
- **Health Checks**: Terminus module endpoints
- **Metrics**: System usage tracking
- **Audit Trail**: Provenance resource generation
- **Scheduled Tasks**: Cleanup and maintenance jobs