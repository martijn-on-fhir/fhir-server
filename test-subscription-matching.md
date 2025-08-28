# Test Scenario: Subscription Matching

## Overzicht
De nieuwe subscription matching implementatie gebruikt een twee-fase approach:

1. **Database filtering** - Elimineert 80%+ subscriptions op basis van resource type
2. **Application-level matching** - Evalueert specifieke query parameters

## Test Setup

### 1. Maak een Blood Pressure subscription aan:
```json
{
  "resourceType": "Subscription",
  "status": "active",
  "criteria": "Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure",
  "channel": {
    "type": "rest-hook",
    "endpoint": "https://example.com/webhook"
  }
}
```

### 2. Test Resource - Blood Pressure Observation:
```json
{
  "resourceType": "Observation",
  "id": "bp-001",
  "meta": {
    "profile": ["http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure"]
  },
  "status": "final",
  "code": {
    "coding": [{
      "system": "http://loinc.org",
      "code": "85354-9",
      "display": "Blood pressure panel"
    }]
  },
  "subject": {
    "reference": "Patient/123"
  }
}
```

### 3. Test Resource - Andere Observation (geen match):
```json
{
  "resourceType": "Observation", 
  "id": "temp-001",
  "meta": {
    "profile": ["http://nictiz.nl/fhir/StructureDefinition/nl-core-BodyTemperature"]
  },
  "status": "final"
}
```

## Verwacht Gedrag

### Scenario 1: Blood Pressure Observation wordt gecreëerd
```typescript
// Event payload:
{
  eventType: 'create',
  resourceType: 'Observation',
  resourceId: 'bp-001',
  resource: { /* Blood Pressure Observation */ }
}

// Console output:
// Resource Observation/bp-001 created
// Found 1 matching subscriptions: ["Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure"]
```

### Scenario 2: Temperature Observation wordt gecreëerd
```typescript
// Event payload:
{
  eventType: 'create',
  resourceType: 'Observation',
  resourceId: 'temp-001',
  resource: { /* Temperature Observation */ }
}

// Console output:
// Resource Observation/temp-001 created
// Found 0 matching subscriptions: []
```

## Performance Voordelen

1. **MongoDB Query Optimalisatie:**
   - Index op `status + criteria` elimineert inactive subscriptions
   - RegExp filter `^Observation(?:\\?|$)` matcht alleen relevante resource types
   - Compound queries met end date filtering

2. **Application-level Filtering:**
   - URLSearchParams voor efficiënte parameter parsing
   - Early exit bij eerste non-match
   - Type-specific matching per parameter

3. **Memory Efficiency:**
   - Alleen matching subscriptions worden in memory geladen
   - Geen onnodige resource serialization
   - Factory pattern voorkomt duplicate instantiation

## Ondersteunde Query Parameters

- `_profile` - Profile URL matching
- `status` - Status value matching  
- `code` - Coding array matching
- `subject` - Reference matching
- *Uitbreidbaar voor meer parameters*

## Database Indexes (voor optimale performance)

```javascript
// Bestaande indexes in subscription-schema.ts:
db.subscriptions.createIndex({ "status": 1, "criteria": 1 })
db.subscriptions.createIndex({ "channel.type": 1 })
db.subscriptions.createIndex({ "errorCount": 1 })
```

Deze implementatie geeft je een schaalbare, efficiënte oplossing voor FHIR subscription matching zonder de complexiteit van een volledige FHIRPath evaluator.