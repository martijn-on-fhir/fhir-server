import { BadRequestException } from '@nestjs/common';
import { IncludeInstruction } from '../../interfaces/include-instruction';

export class OperationHelpers {
  
  /**
   * Parses an include or revinclude instruction string into structured format.
   * Format: sourceResource:searchParameter[:targetResource[:modifier]]
   * @param instruction - The include/revinclude instruction string to parse
   * @returns Parsed instruction object
   * @throws BadRequestException if the instruction format is invalid
   */
  static parseInstruction(instruction: string): IncludeInstruction {
    
    const parts = instruction.split(':')
    
    if (parts.length < 2) {
      throw new BadRequestException(`Invalid _include/_revinclude format: ${instruction}`)
    }
    
    const [sourceResource, searchParameter, targetResource, modifier] = parts
    
    return {
      sourceResource,
      searchParameter,
      targetResource: targetResource !== '*' ? targetResource : undefined,
      modifier,
      iterate: modifier === 'iterate'
    }
  }
}