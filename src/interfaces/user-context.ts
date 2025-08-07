import { Permission } from './permission'

export interface UserContext {
  userId: string;
  permissions: Permission[];
  patientId?: string;
  practitionerId?: string;
  compartments: string[];
}