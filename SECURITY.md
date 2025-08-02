# Security Policy

## Supported Versions

We actively provide security updates for the following versions of our project:

| Version | Supported          | End of Support |
| ------- | ------------------ | -------------- |
| 1.2.x   | :white_check_mark: | TBD            |
| 1.1.x   | :white_check_mark: | 2025-12-31     |
| 1.0.x   | :white_check_mark: | 2025-06-30     |
| < 1.0   | :x:                | Discontinued   |

**Note**: We recommend always using the latest stable version to ensure you have the most recent security patches.

## Reporting a Vulnerability

We take security vulnerabilities seriously and appreciate responsible disclosure. 

### How to Report

**For security vulnerabilities, please do NOT create a public GitHub issue.**

Instead, please report security vulnerabilities through one of these methods:

1. **Email**: Send details to `martijn.github@proton.me`
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature
3. **Bug Bounty Platform**: [If applicable] Submit through our bug bounty program at [platform]

### What to Include

When reporting a vulnerability, please provide:

- **Description**: Clear description of the vulnerability
- **Impact**: Potential impact and severity assessment
- **Reproduction Steps**: Detailed steps to reproduce the issue
- **Environment**: Affected versions, operating systems, configurations
- **Proof of Concept**: Code snippets, screenshots, or demo (if applicable)
- **Suggested Fix**: If you have ideas for remediation

### Response Timeline

We are committed to responding promptly to security reports:

- **Initial Response**: Within 48 hours of report submission
- **Status Updates**: Weekly updates on investigation progress
- **Resolution Timeline**: 
  - Critical vulnerabilities: 7 days
  - High severity: 30 days
  - Medium/Low severity: 90 days

### What to Expect

**If the vulnerability is accepted:**
- We will work with you to understand and reproduce the issue
- You will receive credit in our security advisory (if desired)
- We will coordinate disclosure timeline with you
- A security patch will be developed and released
- A CVE may be requested for tracking

**If the vulnerability is declined:**
- We will provide clear reasoning for our decision
- We may suggest alternative approaches or clarifications
- You are welcome to provide additional information for reconsideration

## Security Best Practices

### For Users
- Always use the latest supported version
- Enable automatic security updates when available
- Follow our configuration security guidelines
- Monitor security advisories and changelogs

### For Contributors
- Run security tests before submitting pull requests
- Follow secure coding practices
- Use dependency scanning tools
- Never commit secrets or sensitive data

## Security Advisories

Security advisories are published:
- On our [GitHub Security tab](https://github.com/yourorg/yourproject/security/advisories)
- Via email to security subscribers
- In our changelog and release notes

## Contact

For general security questions (non-vulnerabilities):
- Email: `martijn.github@proton.me`
- Documentation: /api

---

*This security policy is effective as of 2025-08-01 and may be updated periodically.*
