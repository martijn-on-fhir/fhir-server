import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { HttpException, HttpStatus } from '@nestjs/common'
import * as process from 'node:process'

/**
 * Retrieves the configuration settings based on the current environment.
 * @returns {object} The configuration settings.
 * @throws {HttpException} If the configuration file is not found.
 */
export default (): object => {

  const env = process.env.ENV_NAME
  
  /**
   * The path to the configuration file. if using webpack, the config file is located in another relative directory.
   */
  const configFilePath = resolve(__dirname, `../../config/${env}.json`)

  if (existsSync(configFilePath)) {
    
    const config = readFileSync(configFilePath, 'utf8').toString()
    return JSON.parse(config)
    
  } else {
    throw new HttpException(`Config file ${configFilePath} not found`, HttpStatus.NOT_FOUND, {
      description: `Config file ${configFilePath} not found`
    })
  }
}
