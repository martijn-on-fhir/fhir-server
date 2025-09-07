# [0.14.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.13.3...v0.14.0) (2025-09-07)


### Bug Fixes

* Increase request size limits and make them configurable for FHIR resources ([c5164c6](https://github.com/martijn-on-fhir/fhir-server/commit/c5164c6c8b84abc0f9ccd03519bab64d9ab061d3))
* Resolve Jest worker process exceptions and test failures ([0db12e5](https://github.com/martijn-on-fhir/fhir-server/commit/0db12e5fe1761904e558194f9d357491868c47d3))
* Update rate limiting service tests for logger dependency injection ([adcf25c](https://github.com/martijn-on-fhir/fhir-server/commit/adcf25cb28121a7d654e5a0a360ed47ddebd5d75))


### Features

* Implement Redis-based distributed rate limiting for production scalability ([acd4cf9](https://github.com/martijn-on-fhir/fhir-server/commit/acd4cf9a8b8ec439e8aef37873e5086e145a839f))

## [0.13.3](https://github.com/martijn-on-fhir/fhir-server/compare/v0.13.2...v0.13.3) (2025-09-07)


### Bug Fixes

* Enhance security configuration and code quality ([c9bbe18](https://github.com/martijn-on-fhir/fhir-server/commit/c9bbe18d829be5253f1f9e428e7a219a3ef76ddb))

## [0.13.2](https://github.com/martijn-on-fhir/fhir-server/compare/v0.13.1...v0.13.2) (2025-09-02)


### Bug Fixes

* Update SearchParameterService findOne method and fix test ([0db1c54](https://github.com/martijn-on-fhir/fhir-server/commit/0db1c547bfb1c451c3ec60b8282800ac11730bb5))

## [0.13.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.13.0...v0.13.1) (2025-09-02)

# [0.13.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.12.1...v0.13.0) (2025-09-02)


### Features

* Update StructureDefinition schema and services to FHIR R4 specification ([84282d5](https://github.com/martijn-on-fhir/fhir-server/commit/84282d5bbc16a553a74caa74f40d7546839d8448))

## [0.12.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.12.0...v0.12.1) (2025-09-01)

# [0.12.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.11.1...v0.12.0) (2025-09-01)

## [0.11.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.11.0...v0.11.1) (2025-09-01)

# [0.11.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.10.0...v0.11.0) (2025-08-31)


### Features

* Add complete CRUD operations for ValueSet resources ([d81b399](https://github.com/martijn-on-fhir/fhir-server/commit/d81b3999fa3812b0bd4ba93e7f36f6b34efaf825))

# [0.10.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.9.1...v0.10.0) (2025-08-31)


### Features

* Add complete CRUD operations for StructureDefinition resources ([51bb74d](https://github.com/martijn-on-fhir/fhir-server/commit/51bb74d67522ad746b37b0ac353017674f3096aa))

## [0.9.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.9.0...v0.9.1) (2025-08-31)

# [0.9.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.8.3...v0.9.0) (2025-08-31)


### Features

* Add comprehensive FHIR SearchParameter management system ([bace156](https://github.com/martijn-on-fhir/fhir-server/commit/bace156b7e638d6ac02e46d406a0bc562fd593cc))

## [0.8.3](https://github.com/martijn-on-fhir/fhir-server/compare/v0.8.2...v0.8.3) (2025-08-30)

## [0.8.2](https://github.com/martijn-on-fhir/fhir-server/compare/v0.8.1...v0.8.2) (2025-08-30)

## [0.8.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.8.0...v0.8.1) (2025-08-30)

# [0.8.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.7.1...v0.8.0) (2025-08-30)


### Features

* Optimize export script for enterprise-scale data processing ([351bfaf](https://github.com/martijn-on-fhir/fhir-server/commit/351bfaf625034af3d3800d5ab8e0e4f41f624df9))

## [0.7.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.7.0...v0.7.1) (2025-08-30)

# [0.7.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.6.0...v0.7.0) (2025-08-30)


### Features

* Add IP whitelist guard for enhanced security ([da98897](https://github.com/martijn-on-fhir/fhir-server/commit/da988971985b6e5191328ad8c2a81684624b644d))

# [0.6.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.5.0...v0.6.0) (2025-08-30)


### Features

* Add comprehensive HttpException filter with FHIR OperationOutcome responses ([5f11568](https://github.com/martijn-on-fhir/fhir-server/commit/5f11568fcdc497586f9649480714337de867632d))

# [0.5.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.4.4...v0.5.0) (2025-08-30)


### Features

* Add JSDoc comments and monthly cleanup cron job ([cfa43e9](https://github.com/martijn-on-fhir/fhir-server/commit/cfa43e9f5c2cea1a31e2f1f0a58f7c1f1f0d69d6))
* Add JSDoc comments and monthly cleanup cron job ([bcf5afd](https://github.com/martijn-on-fhir/fhir-server/commit/bcf5afd73a0d01914cc7ceb5d70e2e2f0101a039))

## [0.4.4](https://github.com/martijn-on-fhir/fhir-server/compare/v0.4.3...v0.4.4) (2025-08-30)


### Bug Fixes

* Use MongoDB-compatible language code in FHIR resource schema test ([33a45c0](https://github.com/martijn-on-fhir/fhir-server/commit/33a45c0b56d8aaf1523052fd7d8bae9acb7fcee8))

## [0.4.3](https://github.com/martijn-on-fhir/fhir-server/compare/v0.4.2...v0.4.3) (2025-08-29)

## [0.4.2](https://github.com/martijn-on-fhir/fhir-server/compare/v0.4.1...v0.4.2) (2025-08-29)

## [0.4.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.4.0...v0.4.1) (2025-08-29)


### Bug Fixes

* Resolve object mutation in UpdateOperation causing test failures ([972e0ba](https://github.com/martijn-on-fhir/fhir-server/commit/972e0bad1ba08f330534e58b9691c13bce4ab4af))

# [0.4.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.3.2...v0.4.0) (2025-08-29)


### Features

* Add revinclude operation support and update search parameters ([c7a5485](https://github.com/martijn-on-fhir/fhir-server/commit/c7a54851f4537dd6996827103eece7d78bba4f5b))
* Implement FHIR _revinclude parameter support ([538a74e](https://github.com/martijn-on-fhir/fhir-server/commit/538a74e026d390c1e3b975d360434ba0ff79a0d9))

## [0.3.2](https://github.com/martijn-on-fhir/fhir-server/compare/v0.3.1...v0.3.2) (2025-08-29)

## [0.3.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.3.0...v0.3.1) (2025-08-29)


### Bug Fixes

* Refactor include-operation to improve resource handling and query efficiency ([49f9d6f](https://github.com/martijn-on-fhir/fhir-server/commit/49f9d6fa994da7dad0c3ca9e57873061daabc16a))

## [0.3.1-beta.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.3.0...v0.3.1-beta.1) (2025-08-29)


### Bug Fixes

* Refactor include-operation to improve resource handling and query efficiency ([49f9d6f](https://github.com/martijn-on-fhir/fhir-server/commit/49f9d6fa994da7dad0c3ca9e57873061daabc16a))

# [0.3.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.2.2...v0.3.0) (2025-08-29)


### Features

* **subscription:** First implementation subscription response ([4c1405e](https://github.com/martijn-on-fhir/fhir-server/commit/4c1405e4576b9d5b2a39040be29c6b194704436d))

## [0.2.2-beta.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.2.1...v0.2.2-beta.1) (2025-08-28)


### Bug Fixes

*  Eslint issues ([17c2c9d](https://github.com/martijn-on-fhir/fhir-server/commit/17c2c9dfe0f4ce9c5d81d7af9806d313bf30c7a5))

## [0.2.1-beta.2](https://github.com/martijn-on-fhir/fhir-server/compare/v0.2.1-beta.1...v0.2.1-beta.2) (2025-08-28)


### Bug Fixes

*  Eslint issues ([17c2c9d](https://github.com/martijn-on-fhir/fhir-server/commit/17c2c9dfe0f4ce9c5d81d7af9806d313bf30c7a5))

## [0.2.1-beta.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.2.0...v0.2.1-beta.1) (2025-08-26)


### Bug Fixes

* **subscription:** remove redundant regex escaping test in SubscriptionController ([d3d6db9](https://github.com/martijn-on-fhir/fhir-server/commit/d3d6db9b265705f17e6a1b0d1969dcbd132e05da))

# [0.2.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.1.0...v0.2.0) (2025-08-26)


### Features

* **tests:** add comprehensive unit tests for FHIR service, terminology service, logger, and utils ([3749902](https://github.com/martijn-on-fhir/fhir-server/commit/3749902a2cb175a6638492ef3cfb5bad39b94562))
* **tests:** add comprehensive unit tests for FHIR service, terminology service, logger, and utils ([c20b77a](https://github.com/martijn-on-fhir/fhir-server/commit/c20b77a4a6e8c51c56dd9c60ac24fde87aac9b67))

# [0.1.0](https://github.com/martijn-on-fhir/fhir-server/compare/v0.0.1...v0.1.0) (2025-08-26)


### Bug Fixes

* ESLint config and package-lock with additional dependencies: ([487e07a](https://github.com/martijn-on-fhir/fhir-server/commit/487e07a8e37cf022dae1204a8f3453d1b29588a1))
* **fhir:** resolve incorrect FHIRPath evaluation by wrapping path with template literal ([01e89a4](https://github.com/martijn-on-fhir/fhir-server/commit/01e89a40a7d0fa66bac6bc4e56d407bea3d63fc5))
* **fhir:** update bundle URLs to include host information and optimize search operation ([03c7dd4](https://github.com/martijn-on-fhir/fhir-server/commit/03c7dd479b6c8149a5cb8fe20c4a658c7ae1e026))
* **include paramter:** enhance null-checking in `IncludeOperation` and `ValidationService` ([69f1b33](https://github.com/martijn-on-fhir/fhir-server/commit/69f1b335f2c84a603e26dd0a3927ad897086a72f))
* **pencil:** Test semantic release ([cdd3a0d](https://github.com/martijn-on-fhir/fhir-server/commit/cdd3a0d8e46efb0a565392cfb58120452398336e))
* **subscription:** validate status and escape regex in filters ([4bd23e9](https://github.com/martijn-on-fhir/fhir-server/commit/4bd23e937280def5f40f543ae9ee7d8bdf84bf3e))
* **validation:** rename `currentValue` to `value` in `ValidationError` and update related logic ([a7f0a66](https://github.com/martijn-on-fhir/fhir-server/commit/a7f0a66bf6f6b0eb6a18ef5cee0b63d628a7a6f3))


### Features

* add search parameter map for FHIR resources ([8e3012b](https://github.com/martijn-on-fhir/fhir-server/commit/8e3012b0cddc12a63f193c5048f422470e3ae96d))
* add search parameter map for FHIR resources ([572c2fb](https://github.com/martijn-on-fhir/fhir-server/commit/572c2fb2fc70df58a9af8ed0c353369224c62a97))
* add subscription module with schema, services, and DTOs ([894f5c2](https://github.com/martijn-on-fhir/fhir-server/commit/894f5c2c12c2e621e8dda19705bc592f38bf94bf))
* add subscription module with schema, services, and DTOs ([4094aee](https://github.com/martijn-on-fhir/fhir-server/commit/4094aee94c2c1c24e06357d4b3a3cfd3e2cfe1c8))
* **authentication:** implement SMART on FHIR scope-based authorization ([dc48190](https://github.com/martijn-on-fhir/fhir-server/commit/dc481908157c6a9af1fae0946acc217c002951a1))
* **backup:** enhance backup support with improved mongodump utility ([917ba1f](https://github.com/martijn-on-fhir/fhir-server/commit/917ba1f7c3b7cfbf0bb9b8863a3919c522a48c4f))
* **backup:** enhance backup support with improved mongodump utility ([81ea2cd](https://github.com/martijn-on-fhir/fhir-server/commit/81ea2cdf48d4e2d49788c8b78fffb421cd9b3144))
* **ci:** implement semantic release with GitHub Actions integration ([40b8963](https://github.com/martijn-on-fhir/fhir-server/commit/40b89635d119c48cc1ce38b7236d61ae7694ad54))
* **config, cron-jobs:** enable configurable metrics collection in cron jobs ([cad54a2](https://github.com/martijn-on-fhir/fhir-server/commit/cad54a2d67a12168b7037a7619cd1e68ca29c5c9))
* **config, db:** add MongoDB configuration and dynamic connection logic ([a452b0c](https://github.com/martijn-on-fhir/fhir-server/commit/a452b0c61a992d5e87babad94c16485f66b4d115))
* **config, db:** add MongoDB configuration and dynamic connection logic ([ee465ee](https://github.com/martijn-on-fhir/fhir-server/commit/ee465ee33002eb97866ac5f3fbcf367409344f7e))
* **cron-jobs, config:** add backup cron job functionality and configuration ([2a38d09](https://github.com/martijn-on-fhir/fhir-server/commit/2a38d09f55f3ef8b0cbfc799b81bc890cdb2a80f))
* **cron-jobs:** add cron job service with scheduled task execution ([40199db](https://github.com/martijn-on-fhir/fhir-server/commit/40199db8e53649ebacc3e67aea62b317541ca5ab))
* **fhir:** add `BundleEntry` interface and update `SearchResult` to use it ([1d8a3fa](https://github.com/martijn-on-fhir/fhir-server/commit/1d8a3fafa64690a8b47977f06375749b04a57dc6))
* **fhir:** add `FhirAuthorizerGuard` to `FhirController` for enhanced authorization handling ([608d66e](https://github.com/martijn-on-fhir/fhir-server/commit/608d66e3a8a4baa59aeaa6ee081e0a06ca5efabd))
* **fhir:** add `findByType` operation for resource-level searches ([d145c5e](https://github.com/martijn-on-fhir/fhir-server/commit/d145c5ea6900087a55cea2f83b9b40a5dfe4007f))
* **fhir:** add `SearchParameters` interface and support for `_include` in search operations ([a3e1fee](https://github.com/martijn-on-fhir/fhir-server/commit/a3e1fee4ca1c58745f9c8fe249c145b2f162ac84))
* **fhir:** add host URL construction for `bundle` responses and enhance `findByType` ([b88066d](https://github.com/martijn-on-fhir/fhir-server/commit/b88066dc56ac588093bd925437a3109eaeec7f9c))
* **fhir:** add host URL construction for `bundle` responses and enhance `findByType` ([a085529](https://github.com/martijn-on-fhir/fhir-server/commit/a085529a2ed918082169650eb7ae28573c8ab509))
* **fhir:** add interfaces for `Compartment`, `Permission`, and `UserContext`; enhance `_include` handling in `SearchOperation` ([12c952d](https://github.com/martijn-on-fhir/fhir-server/commit/12c952d875dd840dcb712b598f8b7578d98335aa))
* **fhir:** add optional `searchParams` to `findById` method ([39a665b](https://github.com/martijn-on-fhir/fhir-server/commit/39a665b3111745408fa3ae2edb1b3c7a65d1fac3))
* **fhir:** add support for `_elements` search parameter in `SearchOperation` ([c8701ab](https://github.com/martijn-on-fhir/fhir-server/commit/c8701ab7a01d03660aa1c3d1535551e85b0e87ae))
* **fhir:** enhance `_include` handling in `SearchOperation` and add `getResponse` method ([a3a471d](https://github.com/martijn-on-fhir/fhir-server/commit/a3a471db5225aa5748a821457135be59c5581e8b))
* **fhir:** enhance `IncludeOperation` to fetch referenced resources ([b8de282](https://github.com/martijn-on-fhir/fhir-server/commit/b8de282e4e0c99ff70c5c97f790cb036f21a8a4b))
* **fhir:** implement `_summary` search parameter support in `SearchOperation` ([2590888](https://github.com/martijn-on-fhir/fhir-server/commit/25908882f7ea42e687a68c87aaae83ae2850a81c))
* **fhir:** inject `request` into `FhirService`, `SearchOperation`, and `IncludeOperation` for dynamic host URL handling ([3f451b0](https://github.com/martijn-on-fhir/fhir-server/commit/3f451b0e3d6139e4bfc2143b40447b27780542ab))
* **fhir:** inject `structureDefinitionModel` into `SearchOperation` and enhance `_summary` logic ([d11314b](https://github.com/martijn-on-fhir/fhir-server/commit/d11314b2176ac01e2b4b748bba989ceca968b1d0))
* **fhir:** refactor FHIR schema and operations for improved resource handling ([da9941e](https://github.com/martijn-on-fhir/fhir-server/commit/da9941e95b48c5678a803c71a44736d8e6edd5a0))
* **fhir:** refactor FHIR schema and operations for improved resource handling ([63b5ebe](https://github.com/martijn-on-fhir/fhir-server/commit/63b5ebee3e10321a5d4e819995d27afd4cf0aa85))
* **health-check:** add comprehensive health check endpoints ([51fd8e7](https://github.com/martijn-on-fhir/fhir-server/commit/51fd8e7152cfb9e4fd23865d33aafec9ceb8e7d9))
* introduce FHIR search-related interfaces and DTO ([215d060](https://github.com/martijn-on-fhir/fhir-server/commit/215d06043df1b6c2aa1bcaff70175cff609258c4))
* **logger:** introduce custom logger service and integrate with cron jobs ([b6c1a13](https://github.com/martijn-on-fhir/fhir-server/commit/b6c1a13a1ada83146396174e5f47859749584beb))
* **provenance-builder:** implement CRUD operation registration for Provenance resource ([41aaaef](https://github.com/martijn-on-fhir/fhir-server/commit/41aaaef595e3b274e5b495e97fbd42c5348765f7))
* **provenance:** add `fhir.read` event handling and centralized operation registration ([e98b258](https://github.com/martijn-on-fhir/fhir-server/commit/e98b258ecc60daeafacb26d5eaba5820342388c9))
* **provenance:** integrate ProvenanceBuilder with FHIR event handling ([6c4ebd0](https://github.com/martijn-on-fhir/fhir-server/commit/6c4ebd0aaaf738c725f98009eec08bb62f5321f1))
* **provenance:** introduce Provenance schema and FHIR event enhancements ([5c31fc3](https://github.com/martijn-on-fhir/fhir-server/commit/5c31fc393485b52a7d60d63f2d6c2f575db0b1ae))
* **provenance:** introduce Provenance schema and FHIR event enhancements ([4696a64](https://github.com/martijn-on-fhir/fhir-server/commit/4696a645f150a2d3d6a7dd963326c56110934c62))
* **search:** add `_security` search parameter and enhance query filters ([a251e34](https://github.com/martijn-on-fhir/fhir-server/commit/a251e34122b54278fb0a38da7dedc212eb36d071))
* **search:** add `_tag` parameter support and enhance sort utility ([dfacd59](https://github.com/martijn-on-fhir/fhir-server/commit/dfacd59a10e36f3c08c55c2b802498c1294c8613))
* **search:** add `_type` parameter support and enhance `findByType` ([6dcd633](https://github.com/martijn-on-fhir/fhir-server/commit/6dcd6337e512d9a13b157d24848f65f39d0c0ab2))
* **search:** add `getSortOrder` utility and integrate into `SearchOperation` ([b337e31](https://github.com/martijn-on-fhir/fhir-server/commit/b337e31650b73bb8707c01e9b90f2a07dac3140b))
* **search:** add text-based search support and improve query transformation ([cafd57f](https://github.com/martijn-on-fhir/fhir-server/commit/cafd57f6710ad3845112c8b1a7c753a396d31815))
* **search:** enhance `SearchOperation` functionality with expanded filter and pagination support ([2fc50bb](https://github.com/martijn-on-fhir/fhir-server/commit/2fc50bb40b04e0541d10b19eb5fa9f1146974ae5))
* **security, fhir:** add FHIR event listener and global security guard integration ([bff2790](https://github.com/martijn-on-fhir/fhir-server/commit/bff279038f8a3232ab1b37fd19c7efc80a5fad1f))
* **security, fhir:** add FHIR event listener and global security guard integration ([2d2609c](https://github.com/martijn-on-fhir/fhir-server/commit/2d2609c5a61f5012b81c7815615b35c551faa0c3))
* **security:** add JWT token expiration validation in FhirScopeAuthorization ([84d0146](https://github.com/martijn-on-fhir/fhir-server/commit/84d01465c2ddab926d52a90eeaa711bcc1805c64))
* **subscription:** add subscription event listener and update event handling ([e02a607](https://github.com/martijn-on-fhir/fhir-server/commit/e02a607ca745573b2d8c7308d0ea1fc00e954eee))
* **subscription:** enhance subscription handling with DTOs, service refinements, and new tests ([9660967](https://github.com/martijn-on-fhir/fhir-server/commit/96609671230b311e45bf8a68b294b6a7717b4441))
* **subscription:** implement axios for subscription notifications ([174fe9e](https://github.com/martijn-on-fhir/fhir-server/commit/174fe9ecbe623066a9362a9f602c16cd4a6570b1))
* **system-monitoring:** integrate system resource tracking and persistence ([34e5f2f](https://github.com/martijn-on-fhir/fhir-server/commit/34e5f2f485cba5957f825a39a8c39ac84757f872))
* **tests:** add comprehensive unit tests for FHIR service, terminology service, logger, and utils ([2eda411](https://github.com/martijn-on-fhir/fhir-server/commit/2eda411d0d83f87ac1e674c454854e991131e6eb))
* **tests:** add comprehensive unit tests for FHIR service, terminology service, logger, and utils ([9fbd3c7](https://github.com/martijn-on-fhir/fhir-server/commit/9fbd3c71bba0ea235ecc3cfb104a58305470fa55))

# [0.1.0-beta.1](https://github.com/martijn-on-fhir/fhir-server/compare/v0.0.1...v0.1.0-beta.1) (2025-08-26)


### Bug Fixes

* ESLint config and package-lock with additional dependencies: ([487e07a](https://github.com/martijn-on-fhir/fhir-server/commit/487e07a8e37cf022dae1204a8f3453d1b29588a1))
* **fhir:** resolve incorrect FHIRPath evaluation by wrapping path with template literal ([01e89a4](https://github.com/martijn-on-fhir/fhir-server/commit/01e89a40a7d0fa66bac6bc4e56d407bea3d63fc5))
* **fhir:** update bundle URLs to include host information and optimize search operation ([03c7dd4](https://github.com/martijn-on-fhir/fhir-server/commit/03c7dd479b6c8149a5cb8fe20c4a658c7ae1e026))
* **include paramter:** enhance null-checking in `IncludeOperation` and `ValidationService` ([69f1b33](https://github.com/martijn-on-fhir/fhir-server/commit/69f1b335f2c84a603e26dd0a3927ad897086a72f))
* **pencil:** Test semantic release ([cdd3a0d](https://github.com/martijn-on-fhir/fhir-server/commit/cdd3a0d8e46efb0a565392cfb58120452398336e))
* **subscription:** validate status and escape regex in filters ([4bd23e9](https://github.com/martijn-on-fhir/fhir-server/commit/4bd23e937280def5f40f543ae9ee7d8bdf84bf3e))
* **validation:** rename `currentValue` to `value` in `ValidationError` and update related logic ([a7f0a66](https://github.com/martijn-on-fhir/fhir-server/commit/a7f0a66bf6f6b0eb6a18ef5cee0b63d628a7a6f3))


### Features

* add search parameter map for FHIR resources ([8e3012b](https://github.com/martijn-on-fhir/fhir-server/commit/8e3012b0cddc12a63f193c5048f422470e3ae96d))
* add search parameter map for FHIR resources ([572c2fb](https://github.com/martijn-on-fhir/fhir-server/commit/572c2fb2fc70df58a9af8ed0c353369224c62a97))
* add subscription module with schema, services, and DTOs ([894f5c2](https://github.com/martijn-on-fhir/fhir-server/commit/894f5c2c12c2e621e8dda19705bc592f38bf94bf))
* add subscription module with schema, services, and DTOs ([4094aee](https://github.com/martijn-on-fhir/fhir-server/commit/4094aee94c2c1c24e06357d4b3a3cfd3e2cfe1c8))
* **authentication:** implement SMART on FHIR scope-based authorization ([dc48190](https://github.com/martijn-on-fhir/fhir-server/commit/dc481908157c6a9af1fae0946acc217c002951a1))
* **backup:** enhance backup support with improved mongodump utility ([917ba1f](https://github.com/martijn-on-fhir/fhir-server/commit/917ba1f7c3b7cfbf0bb9b8863a3919c522a48c4f))
* **backup:** enhance backup support with improved mongodump utility ([81ea2cd](https://github.com/martijn-on-fhir/fhir-server/commit/81ea2cdf48d4e2d49788c8b78fffb421cd9b3144))
* **ci:** implement semantic release with GitHub Actions integration ([40b8963](https://github.com/martijn-on-fhir/fhir-server/commit/40b89635d119c48cc1ce38b7236d61ae7694ad54))
* **config, cron-jobs:** enable configurable metrics collection in cron jobs ([cad54a2](https://github.com/martijn-on-fhir/fhir-server/commit/cad54a2d67a12168b7037a7619cd1e68ca29c5c9))
* **config, db:** add MongoDB configuration and dynamic connection logic ([a452b0c](https://github.com/martijn-on-fhir/fhir-server/commit/a452b0c61a992d5e87babad94c16485f66b4d115))
* **config, db:** add MongoDB configuration and dynamic connection logic ([ee465ee](https://github.com/martijn-on-fhir/fhir-server/commit/ee465ee33002eb97866ac5f3fbcf367409344f7e))
* **cron-jobs, config:** add backup cron job functionality and configuration ([2a38d09](https://github.com/martijn-on-fhir/fhir-server/commit/2a38d09f55f3ef8b0cbfc799b81bc890cdb2a80f))
* **cron-jobs:** add cron job service with scheduled task execution ([40199db](https://github.com/martijn-on-fhir/fhir-server/commit/40199db8e53649ebacc3e67aea62b317541ca5ab))
* **fhir:** add `BundleEntry` interface and update `SearchResult` to use it ([1d8a3fa](https://github.com/martijn-on-fhir/fhir-server/commit/1d8a3fafa64690a8b47977f06375749b04a57dc6))
* **fhir:** add `FhirAuthorizerGuard` to `FhirController` for enhanced authorization handling ([608d66e](https://github.com/martijn-on-fhir/fhir-server/commit/608d66e3a8a4baa59aeaa6ee081e0a06ca5efabd))
* **fhir:** add `findByType` operation for resource-level searches ([d145c5e](https://github.com/martijn-on-fhir/fhir-server/commit/d145c5ea6900087a55cea2f83b9b40a5dfe4007f))
* **fhir:** add `SearchParameters` interface and support for `_include` in search operations ([a3e1fee](https://github.com/martijn-on-fhir/fhir-server/commit/a3e1fee4ca1c58745f9c8fe249c145b2f162ac84))
* **fhir:** add host URL construction for `bundle` responses and enhance `findByType` ([b88066d](https://github.com/martijn-on-fhir/fhir-server/commit/b88066dc56ac588093bd925437a3109eaeec7f9c))
* **fhir:** add host URL construction for `bundle` responses and enhance `findByType` ([a085529](https://github.com/martijn-on-fhir/fhir-server/commit/a085529a2ed918082169650eb7ae28573c8ab509))
* **fhir:** add interfaces for `Compartment`, `Permission`, and `UserContext`; enhance `_include` handling in `SearchOperation` ([12c952d](https://github.com/martijn-on-fhir/fhir-server/commit/12c952d875dd840dcb712b598f8b7578d98335aa))
* **fhir:** add optional `searchParams` to `findById` method ([39a665b](https://github.com/martijn-on-fhir/fhir-server/commit/39a665b3111745408fa3ae2edb1b3c7a65d1fac3))
* **fhir:** add support for `_elements` search parameter in `SearchOperation` ([c8701ab](https://github.com/martijn-on-fhir/fhir-server/commit/c8701ab7a01d03660aa1c3d1535551e85b0e87ae))
* **fhir:** enhance `_include` handling in `SearchOperation` and add `getResponse` method ([a3a471d](https://github.com/martijn-on-fhir/fhir-server/commit/a3a471db5225aa5748a821457135be59c5581e8b))
* **fhir:** enhance `IncludeOperation` to fetch referenced resources ([b8de282](https://github.com/martijn-on-fhir/fhir-server/commit/b8de282e4e0c99ff70c5c97f790cb036f21a8a4b))
* **fhir:** implement `_summary` search parameter support in `SearchOperation` ([2590888](https://github.com/martijn-on-fhir/fhir-server/commit/25908882f7ea42e687a68c87aaae83ae2850a81c))
* **fhir:** inject `request` into `FhirService`, `SearchOperation`, and `IncludeOperation` for dynamic host URL handling ([3f451b0](https://github.com/martijn-on-fhir/fhir-server/commit/3f451b0e3d6139e4bfc2143b40447b27780542ab))
* **fhir:** inject `structureDefinitionModel` into `SearchOperation` and enhance `_summary` logic ([d11314b](https://github.com/martijn-on-fhir/fhir-server/commit/d11314b2176ac01e2b4b748bba989ceca968b1d0))
* **fhir:** refactor FHIR schema and operations for improved resource handling ([da9941e](https://github.com/martijn-on-fhir/fhir-server/commit/da9941e95b48c5678a803c71a44736d8e6edd5a0))
* **fhir:** refactor FHIR schema and operations for improved resource handling ([63b5ebe](https://github.com/martijn-on-fhir/fhir-server/commit/63b5ebee3e10321a5d4e819995d27afd4cf0aa85))
* **health-check:** add comprehensive health check endpoints ([51fd8e7](https://github.com/martijn-on-fhir/fhir-server/commit/51fd8e7152cfb9e4fd23865d33aafec9ceb8e7d9))
* introduce FHIR search-related interfaces and DTO ([215d060](https://github.com/martijn-on-fhir/fhir-server/commit/215d06043df1b6c2aa1bcaff70175cff609258c4))
* **logger:** introduce custom logger service and integrate with cron jobs ([b6c1a13](https://github.com/martijn-on-fhir/fhir-server/commit/b6c1a13a1ada83146396174e5f47859749584beb))
* **provenance-builder:** implement CRUD operation registration for Provenance resource ([41aaaef](https://github.com/martijn-on-fhir/fhir-server/commit/41aaaef595e3b274e5b495e97fbd42c5348765f7))
* **provenance:** add `fhir.read` event handling and centralized operation registration ([e98b258](https://github.com/martijn-on-fhir/fhir-server/commit/e98b258ecc60daeafacb26d5eaba5820342388c9))
* **provenance:** integrate ProvenanceBuilder with FHIR event handling ([6c4ebd0](https://github.com/martijn-on-fhir/fhir-server/commit/6c4ebd0aaaf738c725f98009eec08bb62f5321f1))
* **provenance:** introduce Provenance schema and FHIR event enhancements ([5c31fc3](https://github.com/martijn-on-fhir/fhir-server/commit/5c31fc393485b52a7d60d63f2d6c2f575db0b1ae))
* **provenance:** introduce Provenance schema and FHIR event enhancements ([4696a64](https://github.com/martijn-on-fhir/fhir-server/commit/4696a645f150a2d3d6a7dd963326c56110934c62))
* **search:** add `_security` search parameter and enhance query filters ([a251e34](https://github.com/martijn-on-fhir/fhir-server/commit/a251e34122b54278fb0a38da7dedc212eb36d071))
* **search:** add `_tag` parameter support and enhance sort utility ([dfacd59](https://github.com/martijn-on-fhir/fhir-server/commit/dfacd59a10e36f3c08c55c2b802498c1294c8613))
* **search:** add `_type` parameter support and enhance `findByType` ([6dcd633](https://github.com/martijn-on-fhir/fhir-server/commit/6dcd6337e512d9a13b157d24848f65f39d0c0ab2))
* **search:** add `getSortOrder` utility and integrate into `SearchOperation` ([b337e31](https://github.com/martijn-on-fhir/fhir-server/commit/b337e31650b73bb8707c01e9b90f2a07dac3140b))
* **search:** add text-based search support and improve query transformation ([cafd57f](https://github.com/martijn-on-fhir/fhir-server/commit/cafd57f6710ad3845112c8b1a7c753a396d31815))
* **search:** enhance `SearchOperation` functionality with expanded filter and pagination support ([2fc50bb](https://github.com/martijn-on-fhir/fhir-server/commit/2fc50bb40b04e0541d10b19eb5fa9f1146974ae5))
* **security, fhir:** add FHIR event listener and global security guard integration ([bff2790](https://github.com/martijn-on-fhir/fhir-server/commit/bff279038f8a3232ab1b37fd19c7efc80a5fad1f))
* **security, fhir:** add FHIR event listener and global security guard integration ([2d2609c](https://github.com/martijn-on-fhir/fhir-server/commit/2d2609c5a61f5012b81c7815615b35c551faa0c3))
* **security:** add JWT token expiration validation in FhirScopeAuthorization ([84d0146](https://github.com/martijn-on-fhir/fhir-server/commit/84d01465c2ddab926d52a90eeaa711bcc1805c64))
* **subscription:** add subscription event listener and update event handling ([e02a607](https://github.com/martijn-on-fhir/fhir-server/commit/e02a607ca745573b2d8c7308d0ea1fc00e954eee))
* **subscription:** enhance subscription handling with DTOs, service refinements, and new tests ([9660967](https://github.com/martijn-on-fhir/fhir-server/commit/96609671230b311e45bf8a68b294b6a7717b4441))
* **subscription:** implement axios for subscription notifications ([174fe9e](https://github.com/martijn-on-fhir/fhir-server/commit/174fe9ecbe623066a9362a9f602c16cd4a6570b1))
* **system-monitoring:** integrate system resource tracking and persistence ([34e5f2f](https://github.com/martijn-on-fhir/fhir-server/commit/34e5f2f485cba5957f825a39a8c39ac84757f872))
* **tests:** add comprehensive unit tests for FHIR service, terminology service, logger, and utils ([2eda411](https://github.com/martijn-on-fhir/fhir-server/commit/2eda411d0d83f87ac1e674c454854e991131e6eb))
* **tests:** add comprehensive unit tests for FHIR service, terminology service, logger, and utils ([9fbd3c7](https://github.com/martijn-on-fhir/fhir-server/commit/9fbd3c71bba0ea235ecc3cfb104a58305470fa55))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Semantic release configuration for automated versioning and releases
- JWT token expiration validation in FhirScopeAuthorization
- Comprehensive unit tests for FHIR service, terminology service, logger, and utils
- FHIR event listener and global security guard integration
- System resource tracking and persistence
- Cron job service with scheduled task execution
- Custom logger service integration

### Changed
- Security guard cleanup by removing redundant patterns

### Fixed
- GitIgnore configuration updates

### Security
- Enhanced JWT token validation with expiration checks
