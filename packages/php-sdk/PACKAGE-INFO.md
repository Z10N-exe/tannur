# Tannur PHP SDK - Package Information

## Package Structure

```
packages/php-sdk/
├── src/                          # Source code (PSR-4: Tannur\SDK\)
│   ├── TannurClient.php         # Main SDK client
│   ├── TannurConfig.php         # Configuration management
│   ├── TannurException.php      # Exception handling
│   └── Tannur.php               # Factory class
├── tests/                       # PHPUnit tests
├── examples/                    # Usage examples
│   ├── basic-usage.php         # Simple example
│   └── order-service.php       # Advanced CQRS example
├── composer.json               # Composer configuration
├── phpunit.xml                 # PHPUnit configuration
├── README.md                   # Main documentation
├── LICENSE                     # MIT License
├── CHANGELOG.md               # Version history
├── .gitignore                 # Git ignore rules
└── validate-package.php       # Package validation script
```

## PSR Compliance

- ✅ PSR-4 Autoloading: `Tannur\SDK\` → `src/`
- ✅ PSR-12 Coding Standards
- ✅ Semantic Versioning (SemVer)

## Composer Package Details

- **Name**: `tannur/sdk`
- **Type**: `library`
- **License**: `Apache-2.0`
- **PHP Version**: `^8.0`
- **Dependencies**: `guzzlehttp/guzzle ^7.0`

## Key Features

1. **Event Emission**: Send events to Tannur API
2. **State Querying**: Retrieve current projected state
3. **Error Handling**: Comprehensive exception handling
4. **Configuration**: Multiple API key resolution methods
5. **HTTP Client**: Guzzle-based with proper error handling
6. **Documentation**: Extensive examples and API reference

## Distribution Checklist

- [x] Composer configuration with proper metadata
- [x] PSR-4 autoloading structure
- [x] Apache 2.0 License file
- [x] Comprehensive README with examples
- [x] Changelog for version tracking
- [x] Example files for common use cases
- [x] Proper namespace structure
- [x] Error handling with custom exceptions
- [x] PHP 8.0+ compatibility
- [x] Semantic versioning ready

## Next Steps for Publication

1. **Test the package locally**:
   ```bash
   composer install
   composer test
   ```

2. **Validate package structure**:
   ```bash
   php validate-package.php
   ```

3. **Create Git repository and tag version**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Submit to Packagist**:
   - Go to https://packagist.org/packages/submit
   - Enter repository URL
   - Packagist will automatically detect the package

5. **Set up auto-updating**:
   - Configure GitHub webhook for automatic updates
   - Enable auto-updating in Packagist settings

## Quality Assurance

The package follows PHP best practices:
- Strict typing enabled (`declare(strict_types=1)`)
- Proper error handling and exceptions
- Comprehensive documentation
- PSR standards compliance
- Semantic versioning
- Clear separation of concerns