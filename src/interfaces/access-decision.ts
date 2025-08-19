export interface AccessDecision {
    allowed: boolean;
    reasons?: string[];
    warnings?: string[];
    filteredIncludes?: string[];
}