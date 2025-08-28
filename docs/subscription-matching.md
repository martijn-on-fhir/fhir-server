# FHIR Subscription Matching System

## Overview

The FHIR Subscription Matching System provides efficient matching of FHIR resources against subscription criteria stored in MongoDB. The system uses a two-phase approach for optimal performance:

1. **Database-level filtering** - Eliminates 80%+ of subscriptions using MongoDB queries
2. **Application-level matching** - Evaluates specific query parameters against resources

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Resource Change Event                        │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              SubscriptionEventListener                          │
│  • handleResourceCreatedEvent()                                 │
│  • handleResourceUpdatedEvent()                                 │
│  • handleResourceDeletedEvent()                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 MatchesFactory                                  │
│  • create(resource) → Matches                                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Matches                                       │
│  • findMatchingSubscriptions()                                  │
│  • matchesCriteria()                                           │
│  • evaluateQueryParameters()                                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              MongoDB Subscriptions                              │
│  Database Query + Application Logic                             │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Matches Class (`src/lib/subscriptions/matches.ts`)

The heart of the matching system. Takes a FHIR resource and evaluates it against subscription criteria.

**Key Methods:**
- `findMatchingSubscriptions()` - Returns all active subscriptions that match the resource
- `matchesCriteria(criteria)` - Checks if resource matches specific subscription criteria
- `matchProfile(profileUrl)` - FHIR profile matching for structured data
- `matchCode(codeValue)` - Coding system value matching
- `matchSubject(subjectRef)` - Patient/subject reference matching

### 2. MatchesFactory Service (`src/lib/subscriptions/matches-factory.ts`)

Injectable NestJS service that creates configured `Matches` instances with proper dependency injection.

### 3. SubscriptionEventListener (`src/events/subscription-event-listener.ts`)

Event handler that processes resource change events and finds matching subscriptions.

## Supported Query Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `_profile` | FHIR Profile URL | `Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure` |
| `status` | Resource status | `Patient?active=true` |
| `code` | Coding values | `Observation?code=85354-9` |
| `subject` | Subject reference | `Observation?subject=Patient/123` |

## Performance Optimizations

### Database Level
```typescript
// Efficient MongoDB query with indexes
{
  status: SubscriptionStatus.ACTIVE,
  criteria: new RegExp(`^${resourceType}(?:\\?|$)`, 'i'),
  $or: [
    { end: { $exists: false } },
    { end: { $gt: new Date() } }
  ]
}
```

### Application Level
```typescript
// Early exit on parameter mismatch
for (const [key, value] of params) {
  if (!this.matchParameter(key, value)) {
    return false; // Stop processing at first non-match
  }
}
```

### Required Database Indexes
```javascript
db.subscriptions.createIndex({ "status": 1, "criteria": 1 })
db.subscriptions.createIndex({ "channel.type": 1 })
db.subscriptions.createIndex({ "errorCount": 1 })
```

## Usage Examples

### Basic Setup
```typescript
@Injectable()
export class MyService {
  constructor(private matchesFactory: MatchesFactory) {}

  async processResource(resource: any) {
    const matcher = this.matchesFactory.create(resource);
    const subscriptions = await matcher.findMatchingSubscriptions();
    
    console.log(`Found ${subscriptions.length} matching subscriptions`);
    return subscriptions;
  }
}
```

### Blood Pressure Monitoring Example
```typescript
// Subscription in MongoDB
{
  "resourceType": "Subscription",
  "status": "active", 
  "criteria": "Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure",
  "channel": {
    "type": "rest-hook",
    "endpoint": "https://example.com/webhook"
  }
}

// Matching Resource
{
  "resourceType": "Observation",
  "meta": {
    "profile": ["http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure"]
  },
  "status": "final",
  "code": {
    "coding": [{ "system": "http://loinc.org", "code": "85354-9" }]
  }
}

// Result: Match! Subscription will be triggered
```

### Patient Status Monitoring
```typescript
// Subscription
{
  "criteria": "Patient?active=true",
  "channel": { "type": "websocket" }
}

// Matching Resource
{
  "resourceType": "Patient",
  "active": true,
  "name": [{"family": "Doe", "given": ["John"]}]
}

// Result: Match! WebSocket notification sent
```

## Event Flow

1. **Resource Change** - FHIR resource is created/updated/deleted
2. **Event Emission** - `resource.created`, `resource.updated`, or `resource.deleted` event
3. **Event Handling** - SubscriptionEventListener receives event
4. **Matching** - MatchesFactory creates Matches instance
5. **Database Query** - Find active subscriptions for resource type
6. **Criteria Evaluation** - Check each subscription's query parameters
7. **Result** - Return matching subscriptions for notification

## Configuration

### Module Registration
```typescript
@Module({
  providers: [
    MatchesFactory,
    SubscriptionEventListener,
    // ... other providers
  ]
})
export class AppModule {}
```

### Environment Requirements
- MongoDB with proper indexes
- NestJS EventEmitter configured
- Subscription schema registered in Mongoose

## Testing

### Unit Testing Example
```typescript
describe('Matches', () => {
  it('should match blood pressure observations', async () => {
    const resource = {
      resourceType: 'Observation',
      meta: { 
        profile: ['http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'] 
      }
    };
    
    const matcher = new Matches(resource, mockSubscriptionModel);
    const result = matcher.matchesCriteria(
      'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'
    );
    
    expect(result).toBe(true);
  });
});
```

### Integration Testing
```typescript
describe('Subscription Matching Integration', () => {
  it('should find matching subscriptions for blood pressure', async () => {
    // Create subscription in test DB
    await subscriptionModel.create({
      status: 'active',
      criteria: 'Observation?_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-BloodPressure'
    });

    const resource = { /* blood pressure observation */ };
    const matcher = matchesFactory.create(resource);
    const matches = await matcher.findMatchingSubscriptions();
    
    expect(matches).toHaveLength(1);
  });
});
```

## Extending the System

### Adding New Query Parameters
```typescript
// In Matches.matchParameter()
private matchParameter(param: string, value: string): boolean {
  switch (param) {
    case '_profile':
      return this.matchProfile(value);
    case 'category': // Add new parameter
      return this.matchCategory(value);
    default:
      return false;
  }
}

private matchCategory(categoryCode: string): boolean {
  const category = this.resource.category as any;
  if (!category) return false;
  
  return category.some((cat: any) => 
    cat.coding?.some((coding: any) => coding.code === categoryCode)
  );
}
```

### Custom Matching Logic
```typescript
// Extend Matches class for specific use cases
export class CustomMatches extends Matches {
  public matchesCriteria(criteria: string): boolean {
    // Add custom pre-processing
    const normalizedCriteria = this.normalizeCriteria(criteria);
    return super.matchesCriteria(normalizedCriteria);
  }
  
  private normalizeCriteria(criteria: string): string {
    // Custom criteria transformation
    return criteria.toLowerCase();
  }
}
```

## Troubleshooting

### Common Issues

**1. No Matching Subscriptions Found**
- Check subscription status is 'active'
- Verify criteria format: `ResourceType?param=value`
- Ensure database indexes exist
- Check subscription end date

**2. Performance Issues**
- Add missing database indexes
- Review query parameter complexity
- Consider resource payload size

**3. Parameter Matching Fails**
- Verify parameter name spelling
- Check resource structure matches expected format
- Add logging to `matchParameter()` method

### Debug Logging
```typescript
// Enable detailed matching logs
private matchParameter(param: string, value: string): boolean {
  console.log(`Matching parameter: ${param}=${value}`);
  console.log(`Resource:`, JSON.stringify(this.resource, null, 2));
  
  const result = this.doMatch(param, value);
  console.log(`Match result: ${result}`);
  return result;
}
```

## Future Enhancements

- [ ] **FHIRPath Support** - Full FHIRPath expression evaluation
- [ ] **Caching Layer** - Cache frequent subscription queries
- [ ] **Batch Processing** - Process multiple resources simultaneously
- [ ] **Advanced Operators** - Support for `$gt`, `$lt`, `$in` operators
- [ ] **Subscription Templates** - Reusable subscription patterns
- [ ] **Metrics & Monitoring** - Performance tracking and alerting

## License

This system is part of the FHIR Server project and follows the same licensing terms.