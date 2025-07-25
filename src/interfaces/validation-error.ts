export interface ValidationError {
  path: string;
  severity: 'error' | 'warning';
  message: string;
  constraint?: string;
  code?: string;
}
