# FHIR Server

Enterprise-ready FHIR R4 server built with NestJS, featuring comprehensive resource validation, terminology services, subscription support, IP whitelisting, automated backups, and scalable MongoDB storage for healthcare interoperability.

## 🚀 Features

### Core FHIR Capabilities
- **FHIR R4 Compliant** REST API endpoints
- **Comprehensive Resource Management** - Create, Read, Update, Delete operations
- **Advanced Search** with support for:
  - Resource type filtering
  - Identifier-based search  
  - Profile-based filtering
  - Complex parameter combinations
  - Pagination with customizable page sizes
- **Bundle Support** for batch operations and search results
- **FHIR-compliant Error Handling** with OperationOutcome responses

### Enterprise Security
- **IP Whitelisting Guard** with CIDR range support for network-level access control
- **Security Guard** protecting against common web vulnerabilities:
  - SQL injection detection
  - XSS protection
  - Command injection prevention
  - Path traversal blocking
  - Rate limiting
- **OAuth2 Integration** with token introspection
- **SMART on FHIR** support for healthcare applications

### Data Management & Validation
- **Structure Definition Validation** ensuring data integrity
- **Terminology Services Integration** for code validation and expansion
- **MongoDB Backend** with optimized schemas and indexing
- **Automated Resource Validation** against FHIR profiles
- **Provenance Tracking** for audit trails

### Real-time Features
- **FHIR Subscriptions** with webhook notifications
- **Event-driven Architecture** using NestJS EventEmitter
- **Real-time Notifications** for resource changes
- **Subscription Management** with criteria-based filtering

### Operations & Maintenance
- **Enterprise-scale Data Export** 
  - Batch processing for 1M+ records
  - ZIP compression and archival
  - Progress monitoring with ETA calculations
  - Memory-efficient streaming
- **Automated Backup Systems** with configurable scheduling
- **Health Checks** via Terminus integration
- **Comprehensive Logging** with structured output
- **Metrics Collection** and monitoring

### Developer Experience
- **TypeScript** throughout for type safety
- **Swagger/OpenAPI** documentation
- **Comprehensive Test Coverage** with Jest
- **CLI Tools** for data management
- **Docker Support** for containerized deployment
- **Environment-based Configuration** (dev/staging/production)

## 🏗️ Architecture

```
├── src/
│   ├── controllers/        # REST API endpoints
│   ├── services/          # Business logic layer
│   ├── guards/            # Security middleware
│   ├── schema/            # MongoDB schemas
│   ├── lib/               # Utility libraries
│   └── config/            # Configuration management
├── cli/                   # Command-line tools
├── config/                # Environment configs
└── test/                  # Test suites
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/martijn-on-fhir/fhir-server.git
   cd fhir-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp config/dev.json.example config/dev.json
   # Edit configuration as needed
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode  
   npm run build
   npm run start:prod
   ```

## 📚 API Documentation

The server provides comprehensive FHIR R4 endpoints:

### Resource Operations
- `GET /fhir/{resourceType}` - Search resources
- `GET /fhir/{resourceType}/{id}` - Get resource by ID
- `POST /fhir/{resourceType}` - Create new resource
- `PUT /fhir/{resourceType}/{id}` - Update resource
- `DELETE /fhir/{resourceType}/{id}` - Delete resource

### Search Parameters
- `_id` - Resource identifier
- `identifier` - Business identifier
- `_profile` - FHIR profile
- `_count` - Results per page (default: 20)
- `_page` - Page number for pagination

### Subscription Management
- `POST /subscription` - Create subscription
- `GET /subscription/{id}` - Get subscription status
- `DELETE /subscription/{id}` - Cancel subscription

## ⚙️ Configuration

Configure via environment-specific JSON files in the `config/` directory:

```json
{
  "mongodb": {
    "host": "localhost",
    "port": 27017,
    "database": "fhir-server"
  },
  "security": {
    "ipWhitelist": {
      "enabled": true,
      "allowedIPs": ["192.168.0.0/16", "10.0.0.0/8"],
      "allowLocalhost": true
    }
  },
  "terminology": {
    "enabled": true,
    "baseUrl": "https://tx.fhir.org/r4"
  }
}
```

## 🔧 CLI Tools

### Data Export
```bash
# Export all FHIR resources to compressed archive
ENV_NAME=prod npm run export:resource

# For large datasets (1M+ records)
node --max-old-space-size=8192 --expose-gc cli/export.ts
```

### Resource Import
```bash
npm run import:resource
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## 📦 Deployment

### Docker
```bash
# Build image
docker build -t fhir-server .

# Run container
docker run -p 3000:3000 -e ENV_NAME=production fhir-server
```

### Production Considerations
- Configure MongoDB connection with authentication
- Set up SSL/TLS termination
- Configure IP whitelisting for security
- Set up monitoring and logging
- Configure automated backups

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE.md) file for details.

## 🔗 Resources

- [FHIR R4 Specification](https://hl7.org/fhir/R4/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [SMART on FHIR](https://docs.smarthealthit.org/)

## 📞 Support

For questions, issues, or contributions, please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ for healthcare interoperability**