# FHIR Exception Filters

This directory contains NestJS exception filters that convert HTTP exceptions into FHIR-compliant OperationOutcome responses.

## Available Filters

### 🔧 FhirHttpExceptionFilter
**Purpose**: Catches all HttpException instances and converts them to FHIR OperationOutcome resources.

**Features**:
- ✅ Comprehensive HTTP status code mapping (400, 401, 403, 404, 405, 406, 409, 410, 412, 422, 429, 500, 501, 503, etc.)
- ✅ FHIR-compliant OperationOutcome responses
- ✅ Appropriate FHIR issue codes for each HTTP status
- ✅ Fallback handling for unmapped status codes

**Example Usage**:
```typescript
// Automatically applied globally in main.ts
// Will catch any HttpException and return FHIR OperationOutcome

// Example: Throwing exceptions in services/controllers
throw new HttpException('Resource not found', HttpStatus.NOT_FOUND)
// Returns:
// {
//   "resourceType": "OperationOutcome",
//   "issue": [{
//     "severity": "error",
//     "code": "not-found", 
//     "details": { "text": "Resource not found" }
//   }]
// }
```

### 🚫 FhirForbiddenExceptionFilter  
**Purpose**: Specific handling for ForbiddenException (403) errors.

### ❌ FhirBadRequestExceptionFilter
**Purpose**: Specific handling for BadRequestException (400) errors.

## HTTP Status → FHIR Code Mapping

| HTTP Status | FHIR Issue Code | Description |
|-------------|----------------|-------------|
| 400 | `invalid` / `bad request` | Bad Request |
| 401 | `security` | Unauthorized |
| 403 | `forbidden` | Forbidden |
| 404 | `not-found` | Resource Not Found |
| 405 | `not-supported` | Method Not Allowed |
| 406 | `not-supported` | Not Acceptable |
| 409 | `conflict` | Resource Conflict |
| 410 | `deleted` | Resource Gone/Deleted |
| 412 | `business-rule` | Precondition Failed |
| 422 | `processing` | Unprocessable Entity |
| 429 | `throttled` | Too Many Requests |
| 500 | `exception` | Internal Server Error |
| 501 | `not-supported` | Not Implemented |
| 503 | `transient` | Service Unavailable |

## Filter Order

Filters are applied in the order they are registered in `main.ts`:

1. **FhirForbiddenExceptionFilter** - Handles specific 403 errors
2. **FhirBadRequestExceptionFilter** - Handles specific 400 errors  
3. **FhirHttpExceptionFilter** - Catches all remaining HttpExceptions

## Implementation Details

### Global Registration
```typescript
// src/main.ts
app.useGlobalFilters(
  new FhirForbiddenExceptionFilter(),
  new FhirBadRequestExceptionFilter(), 
  new FhirHttpExceptionFilter()
)
```

### FHIR Compliance
All filters return responses conforming to FHIR R4 OperationOutcome specification:
- ✅ `resourceType: "OperationOutcome"`
- ✅ `issue` array with severity, code, and details
- ✅ Appropriate HTTP status codes
- ✅ Human-readable error messages

### Error Handling Examples

```typescript
// In a service or controller:

// 404 Not Found
throw new NotFoundException('Patient not found')

// 409 Conflict  
throw new ConflictException('Resource version conflict')

// 422 Unprocessable Entity
throw new UnprocessableEntityException('Invalid FHIR resource')

// 429 Too Many Requests
throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS)

// Custom status codes
throw new HttpException('Custom error', 418) // I'm a teapot
```

## Testing

Each filter includes comprehensive unit tests covering:
- ✅ All supported HTTP status codes
- ✅ FHIR compliance validation  
- ✅ Edge cases (empty messages, etc.)
- ✅ Response structure validation

Run filter tests:
```bash
npm test -- --testPathPattern="filter"
```