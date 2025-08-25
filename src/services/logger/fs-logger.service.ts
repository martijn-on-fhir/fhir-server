import {ConsoleLogger, Injectable, LoggerService} from "@nestjs/common";

/**
 * Custom logger service extending NestJS ConsoleLogger for the FHIR Server.
 *
 * This service provides enhanced logging functionality with proper context handling
 * and consistent formatting throughout the FHIR server application. It extends the
 * built-in NestJS ConsoleLogger while providing improved context management.
 */
@Injectable()
export class FsLoggerService extends ConsoleLogger implements LoggerService {

    /**
     * Logs debug messages with optional context.
     *
     * Debug messages are typically used for detailed diagnostic information
     * that is most valuable when diagnosing problems.
     *
     * @param message - The debug message to log (can be string, object, or any serializable type)
     * @param context - Optional context identifier for the log message
     */
    debug(message: any, context?: string): void {

        if(context)
            super.debug(message, context)
        else
            super.debug(message)
    }

    /**
     * Logs general informational messages with optional context.
     *
     * This is the default logging level for general application flow
     * and important events that should be recorded during normal operation.
     *
     * @param message - The message to log (can be string, object, or any serializable type)
     * @param context - Optional context identifier for the log message
     */
    log(message: any, context?: string): void {

        if(context)
            super.log(message, context)
        else
            super.log(message)
    }

    /**
     * Logs error messages with optional context.
     *
     * Error messages indicate serious problems that occurred during execution
     * and require attention. These are logged even in production environments.
     *
     * @param message - The error message to log (can be string, Error object, or any serializable type)
     * @param context - Optional context identifier for the log message
     */
    error(message: any, context?: string): void {

        if(context)
            super.error(message, context)
        else
            super.error(message)
    }
}