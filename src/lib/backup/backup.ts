export class Backup {

    directory: string

    constructor(directory: string) {
        this.directory = directory
    }

    execute(): void {

        console.log('Executing backup in directory: ' + this.directory + '..........................')
    }
}