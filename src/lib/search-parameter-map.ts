export const searchParameterMap = new Map<string, any>([
 
  // Patient includes
  ['Patient:general-practitioner', {
    path: 'generalPractitioner.reference',
    target: ['Practitioner', 'Organization', 'PractitionerRole']
  }],
  ['Patient:organization', {
    path: 'managingOrganization.reference',
    target: ['Organization']
  }],
  ['Patient:link', {
    path: 'link.other.reference',
    target: ['Patient', 'RelatedPerson']
  }],
  
  // Observation includes
  ['Observation:patient', {
    path: 'subject.reference',
    target: ['Patient']
  }],
  ['Observation:performer', {
    path: 'performer.reference',
    target: ['Practitioner', 'PractitionerRole', 'Organization', 'CareTeam', 'Patient', 'RelatedPerson']
  }],
  ['Observation:encounter', {
    path: 'encounter.reference',
    target: ['Encounter']
  }],
  ['Observation:device', {
    path: 'device.reference',
    target: ['Device', 'DeviceMetric']
  }],
  
  // Encounter includes
  ['Encounter:patient', {
    path: 'subject.reference',
    target: ['Patient']
  }],
  ['Encounter:practitioner', {
    path: 'participant.individual.reference',
    target: ['Practitioner', 'PractitionerRole']
  }],
  ['Encounter:service-provider', {
    path: 'serviceProvider.reference',
    target: ['Organization']
  }],
  ['Encounter:location', {
    path: 'location.location.reference',
    target: ['Location']
  }],
  
  // Practitioner includes
  ['Practitioner:qualification-issuer', {
    path: 'qualification.issuer.reference',
    target: ['Organization']
  }],
  
  // Organization includes
  ['Organization:partof', {
    path: 'partOf.reference',
    target: ['Organization']
  }],
  ['Organization:endpoint', {
    path: 'endpoint.reference',
    target: ['Endpoint']
  }],
]);
