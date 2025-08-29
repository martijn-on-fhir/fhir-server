import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateSubscriptionDto } from './update-subscription-dto';
import { SubscriptionStatus, SubscriptionChannelType } from '../schema/subscription-schema';

describe('UpdateSubscriptionDto', () => {
    
    describe('Class Structure', () => {
        it('should be defined', () => {
            expect(UpdateSubscriptionDto).toBeDefined();
        });

        it('should allow instantiation', () => {
            const dto = new UpdateSubscriptionDto();
            expect(dto).toBeInstanceOf(UpdateSubscriptionDto);
        });

        it('should have all optional fields', () => {
            const dto = new UpdateSubscriptionDto();
            expect(dto.status).toBeUndefined();
            expect(dto.criteria).toBeUndefined();
            expect(dto.channel).toBeUndefined();
            expect(dto.reason).toBeUndefined();
            expect(dto.end).toBeUndefined();
        });
    });

    describe('Status Field Validation', () => {
        it('should accept all valid SubscriptionStatus values', async () => {
            const validStatuses = Object.values(SubscriptionStatus);

            for (const status of validStatuses) {
                const dto = plainToInstance(UpdateSubscriptionDto, {
                    status: status
                });

                const errors = await validate(dto);
                const statusErrors = errors.filter(error => error.property === 'status');
                
                expect(statusErrors).toHaveLength(0);
            }
        });

        it('should accept REQUESTED status', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: SubscriptionStatus.REQUESTED
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');
            
            expect(statusErrors).toHaveLength(0);
        });

        it('should accept ACTIVE status', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: SubscriptionStatus.ACTIVE
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');
            
            expect(statusErrors).toHaveLength(0);
        });

        it('should accept ERROR status', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: SubscriptionStatus.ERROR
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');
            
            expect(statusErrors).toHaveLength(0);
        });

        it('should accept OFF status', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: SubscriptionStatus.OFF
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');
            
            expect(statusErrors).toHaveLength(0);
        });

        it('should accept missing status field', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {});

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');
            
            expect(statusErrors).toHaveLength(0);
        });

        it('should reject invalid status values', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: 'invalid-status'
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');
            
            expect(statusErrors).toHaveLength(1);
            expect(statusErrors[0].constraints).toHaveProperty('isEnum');
        });

        it('should reject non-string status', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: 123
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');
            
            expect(statusErrors).toHaveLength(1);
            expect(statusErrors[0].constraints).toHaveProperty('isEnum');
        });

        it('should handle null status', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: null
            });

            const errors = await validate(dto);
            const statusErrors = errors.filter(error => error.property === 'status');
            
            // Should not cause validation errors since it's optional
            expect(statusErrors).toHaveLength(0);
        });
    });

    describe('Criteria Field Validation', () => {
        it('should accept valid FHIR search criteria', async () => {
            const validCriteria = [
                'Patient?active=true',
                'Observation?category=vital-signs',
                'Patient?name=Smith',
                'Observation?_profile=http://example.com/profile',
                'Patient?_id=123',
                'Patient?active=false&gender=female'
            ];

            for (const criteria of validCriteria) {
                const dto = plainToInstance(UpdateSubscriptionDto, {
                    criteria: criteria
                });

                const errors = await validate(dto);
                const criteriaErrors = errors.filter(error => error.property === 'criteria');
                
                expect(criteriaErrors).toHaveLength(0);
            }
        });

        it('should accept updated criteria', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                criteria: 'Patient?active=false' // Changed from active=true
            });

            const errors = await validate(dto);
            const criteriaErrors = errors.filter(error => error.property === 'criteria');
            
            expect(criteriaErrors).toHaveLength(0);
        });

        it('should accept missing criteria field', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {});

            const errors = await validate(dto);
            const criteriaErrors = errors.filter(error => error.property === 'criteria');
            
            expect(criteriaErrors).toHaveLength(0);
        });

        it('should reject non-string criteria', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                criteria: 456
            });

            const errors = await validate(dto);
            const criteriaErrors = errors.filter(error => error.property === 'criteria');
            
            expect(criteriaErrors).toHaveLength(1);
            expect(criteriaErrors[0].constraints).toHaveProperty('isString');
        });

        it('should handle null criteria', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                criteria: null
            });

            const errors = await validate(dto);
            const criteriaErrors = errors.filter(error => error.property === 'criteria');
            
            // Should not cause validation errors since it's optional
            expect(criteriaErrors).toHaveLength(0);
        });
    });

    describe('Channel Field Validation', () => {
        it('should accept valid updated channel', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                channel: {
                    type: SubscriptionChannelType.REST_HOOK,
                    endpoint: 'https://updated.example.com/webhook',
                    payload: 'application/fhir+json'
                }
            });

            const errors = await validate(dto);
            const channelErrors = errors.filter(error => error.property === 'channel');
            
            expect(channelErrors).toHaveLength(0);
        });

        it('should accept channel with updated headers', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                channel: {
                    type: SubscriptionChannelType.REST_HOOK,
                    endpoint: 'https://example.com/webhook',
                    payload: 'application/fhir+json',
                    header: {
                        'Authorization': 'Bearer updated-token',
                        'X-Updated-Header': 'new-value'
                    }
                }
            });

            const errors = await validate(dto);
            const channelErrors = errors.filter(error => error.property === 'channel');
            
            expect(channelErrors).toHaveLength(0);
        });

        it('should accept missing channel field', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {});

            const errors = await validate(dto);
            const channelErrors = errors.filter(error => error.property === 'channel');
            
            expect(channelErrors).toHaveLength(0);
        });

        it('should handle null channel', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                channel: null
            });

            const errors = await validate(dto);
            const channelErrors = errors.filter(error => error.property === 'channel');
            
            // Should not cause validation errors since it's optional
            expect(channelErrors).toHaveLength(0);
        });
    });

    describe('Reason Field Validation', () => {
        it('should accept valid reason string', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                reason: 'Updated reason for subscription monitoring'
            });

            const errors = await validate(dto);
            const reasonErrors = errors.filter(error => error.property === 'reason');
            
            expect(reasonErrors).toHaveLength(0);
        });

        it('should accept updated reason', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                reason: 'Criteria updated to include additional patient statuses'
            });

            const errors = await validate(dto);
            const reasonErrors = errors.filter(error => error.property === 'reason');
            
            expect(reasonErrors).toHaveLength(0);
        });

        it('should accept empty reason string', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                reason: ''
            });

            const errors = await validate(dto);
            const reasonErrors = errors.filter(error => error.property === 'reason');
            
            expect(reasonErrors).toHaveLength(0);
        });

        it('should accept missing reason field', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {});

            const errors = await validate(dto);
            const reasonErrors = errors.filter(error => error.property === 'reason');
            
            expect(reasonErrors).toHaveLength(0);
        });

        it('should reject non-string reason', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                reason: 789
            });

            const errors = await validate(dto);
            const reasonErrors = errors.filter(error => error.property === 'reason');
            
            expect(reasonErrors).toHaveLength(1);
            expect(reasonErrors[0].constraints).toHaveProperty('isString');
        });

        it('should handle null reason', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                reason: null
            });

            const errors = await validate(dto);
            const reasonErrors = errors.filter(error => error.property === 'reason');
            
            // Should not cause validation errors since it's optional
            expect(reasonErrors).toHaveLength(0);
        });
    });

    describe('End Field Validation', () => {
        it('should accept valid end date string', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                end: '2026-12-31T23:59:59Z'
            });

            const errors = await validate(dto);
            const endErrors = errors.filter(error => error.property === 'end');
            
            expect(endErrors).toHaveLength(0);
        });

        it('should accept updated end date', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                end: '2025-06-30T23:59:59Z' // Extended subscription end date
            });

            const errors = await validate(dto);
            const endErrors = errors.filter(error => error.property === 'end');
            
            expect(endErrors).toHaveLength(0);
        });

        it('should accept ISO 8601 date formats', async () => {
            const validDates = [
                '2025-12-31T23:59:59Z',
                '2025-12-31T23:59:59.000Z',
                '2025-12-31T23:59:59+00:00',
                '2025-12-31T23:59:59-05:00'
            ];

            for (const dateString of validDates) {
                const dto = plainToInstance(UpdateSubscriptionDto, {
                    end: dateString
                });

                const errors = await validate(dto);
                const endErrors = errors.filter(error => error.property === 'end');
                
                expect(endErrors).toHaveLength(0);
            }
        });

        it('should accept missing end field', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {});

            const errors = await validate(dto);
            const endErrors = errors.filter(error => error.property === 'end');
            
            expect(endErrors).toHaveLength(0);
        });

        it('should reject invalid date string', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                end: 'invalid-date-format'
            });

            const errors = await validate(dto);
            const endErrors = errors.filter(error => error.property === 'end');
            
            expect(endErrors).toHaveLength(1);
            expect(endErrors[0].constraints).toHaveProperty('isDateString');
        });

        it('should reject non-string end date', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                end: 20251231
            });

            const errors = await validate(dto);
            const endErrors = errors.filter(error => error.property === 'end');
            
            expect(endErrors).toHaveLength(1);
            expect(endErrors[0].constraints).toHaveProperty('isDateString');
        });

        it('should handle null end', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                end: null
            });

            const errors = await validate(dto);
            const endErrors = errors.filter(error => error.property === 'end');
            
            // Should not cause validation errors since it's optional
            expect(endErrors).toHaveLength(0);
        });
    });

    describe('Complete Update Examples', () => {
        it('should validate minimal status update', async () => {
            const statusUpdate = {
                status: SubscriptionStatus.ACTIVE
            };

            const dto = plainToInstance(UpdateSubscriptionDto, statusUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate comprehensive subscription update', async () => {
            const comprehensiveUpdate = {
                status: SubscriptionStatus.ACTIVE,
                criteria: 'Observation?category=vital-signs&status=final',
                channel: {
                    type: SubscriptionChannelType.REST_HOOK,
                    endpoint: 'https://updated-webhook.medical-system.com/notifications',
                    payload: 'application/fhir+json',
                    header: {
                        'Authorization': 'Bearer updated-jwt-token',
                        'X-API-Version': '2.0',
                        'X-Updated-By': 'system-admin'
                    }
                },
                reason: 'Updated to monitor final vital signs observations only',
                end: '2026-01-31T23:59:59Z'
            };

            const dto = plainToInstance(UpdateSubscriptionDto, comprehensiveUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate criteria refinement update', async () => {
            const criteriaUpdate = {
                criteria: 'Patient?active=true&_lastUpdated=gt2024-01-01',
                reason: 'Refined criteria to include only recently updated active patients'
            };

            const dto = plainToInstance(UpdateSubscriptionDto, criteriaUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate subscription extension', async () => {
            const extensionUpdate = {
                end: '2027-12-31T23:59:59Z', // Extended end date
                reason: 'Extended subscription duration for long-term monitoring'
            };

            const dto = plainToInstance(UpdateSubscriptionDto, extensionUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate subscription deactivation', async () => {
            const deactivationUpdate = {
                status: SubscriptionStatus.OFF,
                reason: 'Temporarily disabled due to maintenance'
            };

            const dto = plainToInstance(UpdateSubscriptionDto, deactivationUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate empty update object', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {});

            const errors = await validate(dto);
            expect(errors).toHaveLength(0);
        });
    });

    describe('Real-world Update Scenarios', () => {
        it('should validate webhook endpoint update', async () => {
            const endpointUpdate = {
                channel: {
                    type: SubscriptionChannelType.REST_HOOK,
                    endpoint: 'https://new-webhook-server.hospital.com/fhir/subscriptions',
                    payload: 'application/fhir+json',
                    header: {
                        'Authorization': 'Bearer new-security-token',
                        'X-Webhook-Version': '2.1'
                    }
                },
                reason: 'Updated webhook endpoint due to server migration'
            };

            const dto = plainToInstance(UpdateSubscriptionDto, endpointUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate error recovery update', async () => {
            const errorRecovery = {
                status: SubscriptionStatus.ACTIVE, // Recovered from error
                channel: {
                    type: SubscriptionChannelType.REST_HOOK,
                    endpoint: 'https://backup-webhook.hospital.com/fhir/subscriptions',
                    payload: 'application/fhir+json'
                },
                reason: 'Recovered from error state with backup endpoint'
            };

            const dto = plainToInstance(UpdateSubscriptionDto, errorRecovery);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });

        it('should validate subscription refinement', async () => {
            const refinementUpdate = {
                criteria: 'Patient?active=true&_profile=http://nictiz.nl/fhir/StructureDefinition/nl-core-Patient',
                reason: 'Refined to monitor only Dutch core patient profile updates'
            };

            const dto = plainToInstance(UpdateSubscriptionDto, refinementUpdate);
            const errors = await validate(dto);
            
            expect(errors).toHaveLength(0);
        });
    });

    describe('Error Scenarios', () => {
        it('should handle multiple validation errors', async () => {
            const invalidData = {
                status: 'invalid-status', // Invalid enum
                criteria: 456, // Non-string
                channel: 'not-an-object', // Should be object
                reason: 789, // Non-string
                end: 'invalid-date' // Invalid date string
            };

            const dto = plainToInstance(UpdateSubscriptionDto, invalidData);
            const errors = await validate(dto);
            
            expect(errors.length).toBeGreaterThan(0);
            
            const errorsByProperty = errors.reduce((acc, error) => {
                acc[error.property] = error;
                return acc;
            }, {} as Record<string, any>);

            expect(errorsByProperty.status).toBeDefined();
            expect(errorsByProperty.criteria).toBeDefined();
            expect(errorsByProperty.channel).toBeDefined();
            expect(errorsByProperty.reason).toBeDefined();
            expect(errorsByProperty.end).toBeDefined();
        });

        it('should handle all null values', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: null,
                criteria: null,
                channel: null,
                reason: null,
                end: null
            });

            const errors = await validate(dto);
            
            // All fields are optional, so null should not cause errors
            expect(errors).toHaveLength(0);
        });

        it('should handle undefined values', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                status: undefined,
                criteria: undefined,
                channel: undefined,
                reason: undefined,
                end: undefined
            });

            const errors = await validate(dto);
            
            // All fields are optional, so undefined should not cause errors
            expect(errors).toHaveLength(0);
        });

        it('should handle nested channel validation errors', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                channel: {
                    type: 'invalid-channel-type', // Invalid enum for nested object
                    endpoint: 'not-a-url', // Invalid URL
                    payload: 123 // Non-string
                }
            });

            const errors = await validate(dto);
            
            // Should have nested validation errors for channel object
            expect(errors.length).toBeGreaterThan(0);
        });

        it('should reject boolean values for string fields', async () => {
            const dto = plainToInstance(UpdateSubscriptionDto, {
                criteria: true, // Boolean instead of string
                reason: false // Boolean instead of string
            });

            const errors = await validate(dto);
            
            const criteriaErrors = errors.filter(error => error.property === 'criteria');
            const reasonErrors = errors.filter(error => error.property === 'reason');
            
            expect(criteriaErrors).toHaveLength(1);
            expect(criteriaErrors[0].constraints).toHaveProperty('isString');
            expect(reasonErrors).toHaveLength(1);
            expect(reasonErrors[0].constraints).toHaveProperty('isString');
        });
    });
});