import * as process from 'process'

/**
 * Monitors and provides system resource usage statistics including memory and CPU metrics.
 * Tracks RSS memory, heap usage, external memory, and CPU utilization.
 */
export class Usage {

    /** Resident Set Size (RSS) memory usage in megabytes */
    private _rss: number

    /** Heap memory usage in megabytes */
    private _heap: number

    /** External memory usage in megabytes */
    private _external: number

    /** CPU usage statistics for system and user time */
    private _cpu: {
        system: number
        user: number
    }

    constructor() {
        this.init()
    }

    /**
     * Initializes system usage metrics by collecting current memory and CPU statistics
     */
    private init(): void {

        const memory = process.memoryUsage()

        this._rss = +(memory.rss / 1024 / 1024).toFixed(2)
        this._heap = +(memory.heapUsed / 1024 / 1024).toFixed(2)
        this._external = +(memory.external / 1024 / 1024).toFixed(2)
        this._cpu = process.cpuUsage()
    }

    /**
     * Returns the current system usage metrics as an object
     * @returns Object containing RSS, heap, external memory (in MB) and CPU usage statistics (in MB)
     */
    snapshot(): object {
        return {
            memory: {
                rss: this._rss,
                heap: this._heap,
                external: this._external,
                total: +(process.availableMemory() / 1024 / 1024).toFixed(2),
            },
            cpu: {
                system: +(this._cpu.system / 1024 / 1024).toFixed(2),
                user: +(this._cpu.user / 1024 / 1024).toFixed(2),
            }
        }
    }
}