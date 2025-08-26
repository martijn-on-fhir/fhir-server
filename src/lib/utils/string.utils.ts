/**
 * Capitalizes the first character of a string (equivalent to PHP's ucfirst function)
 * @param str - The string to capitalize
 * @returns The string with the first character capitalized
 */
export function ucfirst(str: string): string {
    if (!str || str.length === 0) {
        return str;
    }
    
    return str.charAt(0).toUpperCase() + str.slice(1);
}