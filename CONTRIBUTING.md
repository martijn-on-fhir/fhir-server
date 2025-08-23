# Contributing to Martijn-On-Fhir

Thank you for your interest in contributing to this project! We welcome contributions from everyone and appreciate your help in making this project better.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

This project adheres to a code of conduct that we expect all participants to follow. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to help us maintain a welcoming and inclusive community.

## How to Contribute

There are many ways to contribute to this project:

- **Report bugs** by creating detailed issue reports
- **Suggest features** or enhancements
- **Submit pull requests** with bug fixes or new features
- **Improve documentation** by fixing typos or adding examples
- **Help other contributors** by reviewing pull requests or answering questions
- **Share the project** with others who might find it useful

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/project-name.git
   cd project-name
   ```
3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/originalowner/project-name.git
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- Node.js (version X.X or higher)
- npm or yarn
- Git
- MongoDB

### Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

2. Set up environment variables (if applicable):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Making Changes

### Before You Start

- Check the [issues](../../issues) to see if someone else is already working on the same thing
- Create an issue to discuss major changes before implementing them
- Make sure your changes align with the project's goals and scope

### Development Process

1. **Keep your fork up to date**:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a new branch** for each feature or bug fix:
   ```bash
   git checkout -b feature/descriptive-name
   ```

3. **Make your changes** following the project's coding standards

4. **Test your changes** thoroughly

5. **Commit your changes** with clear, descriptive messages:
   ```bash
   git add .
   git commit -m "Add feature: brief description of what you did"
   ```

## Submitting Changes

### Pull Request Process

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a pull request** from your fork to the main repository

3. **Fill out the PR template** completely:
    - Describe what your changes do
    - Reference any related issues
    - Include screenshots for UI changes
    - List any breaking changes

4. **Wait for review** and be responsive to feedback

### Pull Request Guidelines

- **One feature per PR**: Keep pull requests focused and atomic
- **Clear description**: Explain what you changed and why
- **Reference issues**: Use "Fixes #123" or "Closes #123" to link issues
- **Update documentation**: Include relevant documentation updates
- **Add tests**: Ensure your changes are covered by tests
- **Keep it small**: Large PRs are harder to review

## Style Guidelines

### Code Style

- Follow the existing code style and formatting
- Use meaningful variable and function names
- Write clear, concise comments
- Follow language-specific conventions:
    - JavaScript: Use ESLint and Prettier configurations
    - Python: Follow PEP 8 guidelines
    - CSS: Use consistent naming conventions

### Commit Messages

Use the conventional commit format:

```
type(scope): brief description

Longer description if needed

Fixes #123
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.js
```

### Writing Tests

- Write tests for all new features and bug fixes
- Follow existing test patterns and conventions
- Aim for good test coverage but focus on quality over quantity
- Include both positive and negative test cases

## Documentation

### Types of Documentation

- **Code comments**: Explain complex logic and algorithms
- **README updates**: Keep the main README current
- **API documentation**: Document public APIs and interfaces
- **Examples**: Provide usage examples for new features

### Documentation Standards

- Use clear, simple language
- Include code examples where helpful
- Keep documentation up to date with code changes
- Follow the project's documentation style

## Community

### Getting Help

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and general discussion
- **Discord/Slack**: For real-time chat (if applicable)
- **Email**: maintainer@project.com for private matters

### Review Process

1. **Automated checks**: CI/CD pipelines will run automatically
2. **Maintainer review**: Core team members will review your PR
3. **Community feedback**: Other contributors may provide input
4. **Approval and merge**: Maintainers will merge approved PRs

### Recognition

We appreciate all contributions and will:
- Add contributors to our README
- Mention significant contributions in release notes
- Provide feedback and guidance to help you grow

## Questions?

Don't hesitate to ask questions! We're here to help:

- Open an issue for bugs or feature requests
- Start a discussion for questions or ideas
- Reach out to maintainers directly if needed

Thank you for contributing to Martijn-On-Fhir! 🎉