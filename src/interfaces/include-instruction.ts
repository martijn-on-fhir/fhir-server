export interface IncludeInstruction {
  sourceResource: string;
  searchParameter: string;
  targetResource?: string;
  modifier?: string;
  iterate?: boolean;
}
