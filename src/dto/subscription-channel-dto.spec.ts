import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SubscriptionChannelDto } from './subscription-channel-dto';
import { SubscriptionChannelType } from '../schema/subscription-schema';

describe('SubscriptionChannelDto', () => {
    
    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(SubscriptionChannelDto).toBeDefined();
        });

        it('should allow instantiation', () => {
            const dto = new SubscriptionChannelDto();
            expect(dto).toBeInstanceOf(SubscriptionChannelDto);
        });
    });

    describe('Type Field Validation', () => {
        it('should require type field', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                // Missing type
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');
            
            expect(typeErrors).toHaveLength(1);
            expect(typeErrors[0].constraints).toHaveProperty('isEnum');
        });

        it('should accept all valid SubscriptionChannelType values', async () => {
            const validTypes = Object.values(SubscriptionChannelType);

            for (const type of validTypes) {
                const dto = plainToInstance(SubscriptionChannelDto, {
                    type: type
                });

                const errors = await validate(dto);
                const typeErrors = errors.filter(error => error.property === 'type');
                
                expect(typeErrors).toHaveLength(0);
            }
        });

        it('should accept REST_HOOK type', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');
            
            expect(typeErrors).toHaveLength(0);
        });

        it('should accept WEBSOCKET type', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.WEBSOCKET
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');
            
            expect(typeErrors).toHaveLength(0);
        });

        it('should accept EMAIL type', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.EMAIL
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');
            
            expect(typeErrors).toHaveLength(0);
        });

        it('should accept SMS type', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.SMS
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');
            
            expect(typeErrors).toHaveLength(0);
        });

        it('should accept MESSAGE type', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.MESSAGE
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');
            
            expect(typeErrors).toHaveLength(0);
        });

        it('should reject invalid type values', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: 'invalid-type'
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');
            
            expect(typeErrors).toHaveLength(1);
            expect(typeErrors[0].constraints).toHaveProperty('isEnum');
        });

        it('should reject non-string type', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: 123
            });

            const errors = await validate(dto);
            const typeErrors = errors.filter(error => error.property === 'type');
            
            expect(typeErrors).toHaveLength(1);
            expect(typeErrors[0].constraints).toHaveProperty('isEnum');
        });
    });

    describe('Endpoint Field Validation', () => {
        it('should accept valid HTTP endpoint', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                endpoint: 'http://example.com/fhir/webhook'
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            expect(endpointErrors).toHaveLength(0);
        });

        it('should accept valid HTTPS endpoint', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                endpoint: 'https://secure.example.com/fhir/webhook'
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            expect(endpointErrors).toHaveLength(0);
        });

        it('should reject websocket endpoint (non-HTTP URL)', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.WEBSOCKET,
                endpoint: 'wss://example.com/fhir/websocket'
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            expect(endpointErrors).toHaveLength(1);
            expect(endpointErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should reject email endpoint (non-HTTP URL)', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.EMAIL,
                endpoint: 'mailto:doctor@example.com'
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            expect(endpointErrors).toHaveLength(1);
            expect(endpointErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should accept missing endpoint field', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.WEBSOCKET
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            expect(endpointErrors).toHaveLength(0);
        });

        it('should reject invalid endpoint URL', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                endpoint: 'not-a-valid-url'
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            expect(endpointErrors).toHaveLength(1);
            expect(endpointErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should reject empty endpoint string', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                endpoint: ''
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            expect(endpointErrors).toHaveLength(1);
            expect(endpointErrors[0].constraints).toHaveProperty('isUrl');
        });

        it('should handle null endpoint', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.WEBSOCKET,
                endpoint: null
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            // Should not cause validation errors since it's optional
            expect(endpointErrors).toHaveLength(0);
        });

        it('should reject non-HTTP URL schemes', async () => {
            const nonHttpSchemes = [
                'wss://websocket.example.com/fhir',
                'mailto:test@example.com',
                'tel:+1234567890',
                'queue://notifications'
            ];

            for (const endpoint of nonHttpSchemes) {
                const dto = plainToInstance(SubscriptionChannelDto, {
                    type: SubscriptionChannelType.REST_HOOK,
                    endpoint: endpoint
                });

                const errors = await validate(dto);
                const endpointErrors = errors.filter(error => error.property === 'endpoint');
                
                expect(endpointErrors).toHaveLength(1);
                expect(endpointErrors[0].constraints).toHaveProperty('isUrl');
            }
        });

        it('should accept FTP URLs (standard URL schemes)', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                endpoint: 'ftp://example.com/file'
            });

            const errors = await validate(dto);
            const endpointErrors = errors.filter(error => error.property === 'endpoint');
            
            expect(endpointErrors).toHaveLength(0);
        });
    });

    describe('Payload Field Validation', () => {
        it('should accept valid JSON payload type', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                payload: 'application/fhir+json'
            });

            const errors = await validate(dto);
            const payloadErrors = errors.filter(error => error.property === 'payload');
            
            expect(payloadErrors).toHaveLength(0);
        });

        it('should accept valid XML payload type', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                payload: 'application/fhir+xml'
            });

            const errors = await validate(dto);
            const payloadErrors = errors.filter(error => error.property === 'payload');
            
            expect(payloadErrors).toHaveLength(0);
        });

        it('should accept standard JSON payload', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                payload: 'application/json'
            });

            const errors = await validate(dto);
            const payloadErrors = errors.filter(error => error.property === 'payload');
            
            expect(payloadErrors).toHaveLength(0);
        });

        it('should accept text payload', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.EMAIL,
                payload: 'text/plain'
            });

            const errors = await validate(dto);
            const payloadErrors = errors.filter(error => error.property === 'payload');
            
            expect(payloadErrors).toHaveLength(0);
        });

        it('should accept missing payload field', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK
            });

            const errors = await validate(dto);
            const payloadErrors = errors.filter(error => error.property === 'payload');
            
            expect(payloadErrors).toHaveLength(0);
        });

        it('should reject non-string payload', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                payload: 123
            });

            const errors = await validate(dto);
            const payloadErrors = errors.filter(error => error.property === 'payload');
            
            expect(payloadErrors).toHaveLength(1);
            expect(payloadErrors[0].constraints).toHaveProperty('isString');
        });

        it('should handle null payload', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                payload: null
            });

            const errors = await validate(dto);
            const payloadErrors = errors.filter(error => error.property === 'payload');
            
            // Should not cause validation errors since it's optional
            expect(payloadErrors).toHaveLength(0);
        });
    });

    describe('Header Field Validation', () => {
        it('should accept valid header object', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                header: {
                    'Authorization': 'Bearer token123',
                    'Content-Type': 'application/fhir+json'
                }
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            expect(headerErrors).toHaveLength(0);
        });

        it('should accept authorization header only', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                header: {
                    'Authorization': 'Bearer secret-token'
                }
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            expect(headerErrors).toHaveLength(0);
        });

        it('should accept custom headers', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                header: {
                    'X-API-Key': 'api-key-123',
                    'X-Custom-Header': 'custom-value',
                    'User-Agent': 'FHIR-Subscription-Client/1.0'
                }
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            expect(headerErrors).toHaveLength(0);
        });

        it('should accept empty header object', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                header: {}
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            expect(headerErrors).toHaveLength(0);
        });

        it('should accept missing header field', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            expect(headerErrors).toHaveLength(0);
        });

        it('should reject non-object header', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                header: 'not an object'
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            expect(headerErrors).toHaveLength(1);
            expect(headerErrors[0].constraints).toHaveProperty('isObject');
        });

        it('should reject array header', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                header: ['Authorization', 'Bearer token']
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            expect(headerErrors).toHaveLength(1);
            expect(headerErrors[0].constraints).toHaveProperty('isObject');
        });

        it('should handle null header', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                header: null
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            // Should not cause validation errors since it's optional
            expect(headerErrors).toHaveLength(0);
        });
    });

    describe('Channel Type Specific Examples', () => {
        it('should validate REST_HOOK channel with endpoint and headers', async () => {
            const restHookChannel = {
                type: SubscriptionChannelType.REST_HOOK,
                endpoint: 'https://webhook.example.com/fhir/subscription',
                payload: 'application/fhir+json',
                header: {
                    'Authorization': 'Bearer token123',
                    'Content-Type': 'application/fhir+json',
                    'X-Webhook-Secret': 'secret123'
                }
            };

            const dto = plainToInstance(SubscriptionChannelDto, restHookChannel);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate WEBSOCKET channel (without endpoint)', async () => {
            const websocketChannel = {
                type: SubscriptionChannelType.WEBSOCKET
                // No endpoint since websocket URLs aren't valid HTTP URLs
            };

            const dto = plainToInstance(SubscriptionChannelDto, websocketChannel);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate EMAIL channel (without endpoint)', async () => {
            const emailChannel = {
                type: SubscriptionChannelType.EMAIL,
                payload: 'text/html'
                // No endpoint since mailto URLs aren't valid HTTP URLs
            };

            const dto = plainToInstance(SubscriptionChannelDto, emailChannel);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate SMS channel (without endpoint)', async () => {
            const smsChannel = {
                type: SubscriptionChannelType.SMS,
                payload: 'text/plain'
                // No endpoint since tel URLs aren't valid HTTP URLs
            };

            const dto = plainToInstance(SubscriptionChannelDto, smsChannel);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate MESSAGE channel (without endpoint)', async () => {
            const messageChannel = {
                type: SubscriptionChannelType.MESSAGE,
                payload: 'application/json'
                // No endpoint since queue URLs aren't valid HTTP URLs
            };

            const dto = plainToInstance(SubscriptionChannelDto, messageChannel);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate minimal channel with type only', async () => {
            const minimalChannel = {
                type: SubscriptionChannelType.WEBSOCKET
            };

            const dto = plainToInstance(SubscriptionChannelDto, minimalChannel);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });
    });

    describe('Real-world Examples', () => {
        it('should validate typical webhook channel', async () => {
            const webhookChannel = {
                type: SubscriptionChannelType.REST_HOOK,
                endpoint: 'https://api.hospital-system.example.com/fhir/notifications',
                payload: 'application/fhir+json',
                header: {
                    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                    'X-API-Version': '1.0',
                    'X-Source-System': 'FHIR-Server'
                }
            };

            const dto = plainToInstance(SubscriptionChannelDto, webhookChannel);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate secure webhook with authentication', async () => {
            const secureWebhook = {
                type: SubscriptionChannelType.REST_HOOK,
                endpoint: 'https://secure-endpoint.medical-system.org/subscriptions/webhook',
                payload: 'application/fhir+json',
                header: {
                    'Authorization': 'Basic dXNlcjpwYXNzd29yZA==',
                    'X-Signature': 'sha256=signature-hash',
                    'User-Agent': 'FHIR-Subscription-Client/2.0'
                }
            };

            const dto = plainToInstance(SubscriptionChannelDto, secureWebhook);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate email notification channel (without endpoint)', async () => {
            const emailNotification = {
                type: SubscriptionChannelType.EMAIL,
                payload: 'text/html'
                // No endpoint since mailto URLs aren't valid HTTP URLs
            };

            const dto = plainToInstance(SubscriptionChannelDto, emailNotification);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate WebSocket real-time channel (without endpoint)', async () => {
            const websocketChannel = {
                type: SubscriptionChannelType.WEBSOCKET,
                payload: 'application/json'
                // No endpoint since websocket URLs aren't valid HTTP URLs
            };

            const dto = plainToInstance(SubscriptionChannelDto, websocketChannel);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                type: 'invalid-channel-type', // Invalid enum
                endpoint: 'not-a-url', // Invalid URL
                payload: 123, // Non-string
                header: 'not-an-object' // Non-object
            };

            const dto = plainToInstance(SubscriptionChannelDto, invalidData);
            const errors = await validate(dto);
            
            expect(errors.length).toBeGreaterThan(0);
            
            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            expect(errorsByProperty.type).toBeDefined();
            expect(errorsByProperty.endpoint).toBeDefined();
            expect(errorsByProperty.payload).toBeDefined();
            expect(errorsByProperty.header).toBeDefined();
        });

        it('should handle all null values', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK, // Required field must be valid
                endpoint: null,
                payload: null,
                header: null
            });

            const errors = await validate(dto);
            
            // Only required type field, others are optional so null should not cause errors
            const nonTypeErrors = errors.filter(error => error.property !== 'type');
            expect(nonTypeErrors).toHaveLength(0);
        });

        it('should handle undefined values', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.WEBSOCKET, // Required field must be valid
                endpoint: undefined,
                payload: undefined,
                header: undefined
            });

            const errors = await validate(dto);
            
            // Only required type field, others are optional so undefined should not cause errors
            const nonTypeErrors = errors.filter(error => error.property !== 'type');
            expect(nonTypeErrors).toHaveLength(0);
        });

        it('should fail validation when type is missing', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                endpoint: 'https://example.com/webhook',
                payload: 'application/fhir+json'
                // Missing required type field
            });

            const errors = await validate(dto);
            
            const typeErrors = errors.filter(error => error.property === 'type');
            expect(typeErrors.length).toBeGreaterThan(0);
            expect(typeErrors[0].constraints).toHaveProperty('isEnum');
        });

        it('should handle complex header validation edge cases', async () => {
            const dto = plainToInstance(SubscriptionChannelDto, {
                type: SubscriptionChannelType.REST_HOOK,
                header: {
                    'valid-header': 'valid-value',
                    'another-header': 123, // Mixed value types are allowed in Record<string, string>
                    '': 'empty-key', // Edge case: empty key
                    'null-value': null // Edge case: null value
                }
            });

            const errors = await validate(dto);
            const headerErrors = errors.filter(error => error.property === 'header');
            
            // IsObject validator should pass for any object structure
            expect(headerErrors).toHaveLength(0);
        });
    });
});