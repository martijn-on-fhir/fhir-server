export interface Permission {
  scope: 'user' | 'patient' | 'system'
  resource: string
  actions: Set<'c' | 'r' | 'u' | 'd' | 's'>
}