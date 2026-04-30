# Changelog

All notable changes to the Tannur PHP SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-01-XX

### Added
- Initial release of Tannur PHP SDK
- `TannurClient` class for event emission and state querying
- `emit()` method for sending events to Tannur API
- `getState()` method for retrieving current stream state
- `TannurException` for comprehensive error handling
- Support for multiple API key resolution methods (config, env var, global file)
- PSR-4 autoloading compliance
- Comprehensive documentation and examples
- Support for PHP 8.0+
- Guzzle HTTP client integration
- JSON encoding/decoding with proper error handling

### Security
- Bearer token authentication for all API requests
- Secure API key handling and resolution
- Apache 2.0 licensed for enterprise use

[Unreleased]: https://github.com/tannur/tannur/compare/php-sdk-v1.0.0...HEAD
[1.0.0]: https://github.com/tannur/tannur/releases/tag/php-sdk-v1.0.0