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