# Tannur PHP SDK

PHP SDK for Tannur Event-Sourced Backend-as-a-Service.

## What is Tannur?

Tannur is a **hosted Event-Sourced Backend-as-a-Service** that fundamentally changes how you build applications. Instead of storing only current state like traditional databases, Tannur stores **every action that ever occurred** as an immutable, cryptographically chained sequence of events.

### Why Event Sourcing Matters

**Traditional Problem**: Most applications lose historical context. When a user's account balance changes, you only see the current value—not the complete story of how it got there.

**Tannur's Solution**: Every action becomes an event (`balance_credited`, `order_placed`, `user_registered`). These events are:
- **Immutable**: Once written, they can never be changed
- **Cryptographically chained**: Each event is linked to the previous one via SHA-256 hashes
- **Auditable**: Complete audit trail for compliance (finance, healthcare, e-commerce)
- **Projectable**: Current state is computed from events using your custom logic

### Perfect For Compliance-Heavy Industries

- **Financial Services**: Immutable transaction history, regulatory compliance
- **Healthcare**: Patient record integrity, HIPAA audit trails  
- **E-commerce**: Order lifecycle tracking, fraud detection
- **Supply Chain**: Product provenance, quality assurance
- **Legal**: Document versioning, case management

### Key Benefits

1. **Complete Audit Trail**: Never lose the "why" behind data changes
2. **Time Travel**: Reconstruct application state at any point in history
3. **Compliance Ready**: Built-in tamper evidence for regulatory requirements
4. **Zero Infrastructure**: Hosted on zero-cost stack (Supabase, Upstash, Vercel)
5. **Developer Friendly**: Simple SDK, no complex event store setup

This PHP SDK provides a simple interface to emit events and query current state without managing your own event sourcing infrastructure.

## Installation

Install via Composer:

```bash
composer require tannur/sdk
```

## Requirements

- PHP 8.0 or higher
- Guzzle HTTP client (automatically installed)

## How It Works

Tannur follows a simple **Ingest → Ledger → Project → Snapshot** pipeline:

1. **Emit Events**: Your application sends events via this SDK
2. **Cryptographic Ledger**: Events are stored in an immutable, hash-chained ledger
3. **Custom Projections**: Your JavaScript logic transforms events into current state
4. **Fast Queries**: Query current state in milliseconds via Redis cache

```php
// 1. Emit events to build up state
$client->emit('order_placed', ['orderId' => '123', 'amount' => 99.99]);
$client->emit('payment_processed', ['orderId' => '123', 'method' => 'card']);
$client->emit('order_shipped', ['orderId' => '123', 'tracking' => 'TRK123']);

// 2. Query current state (computed from all events)
$orderState = $client->getState('orders:123');
// Returns: ['status' => 'shipped', 'amount' => 99.99, 'tracking' => 'TRK123']
```

### Event Sourcing vs Traditional Databases

| Traditional Database | Tannur Event Sourcing |
|---------------------|----------------------|
| Stores current state only | Stores complete event history |
| Updates overwrite data | Events are immutable |
| Limited audit trail | Complete audit trail |
| Hard to debug issues | Full reconstruction capability |
| Compliance challenges | Built-in compliance features |

## Quick Start

### Basic Usage

```php
<?php

require_once 'vendor/autoload.php';

use Tannur\SDK\TannurClient;
use Tannur\SDK\TannurException;

// Initialize the client
$client = new TannurClient([
    'apiKey' => 'your-api-key-here',
    'baseUrl' => 'https://api.tannur.xyz' // optional, defaults to production
]);

try {
    // Emit an event
    $result = $client->emit('order_placed', [
        'orderId' => '12345',
        'customerId' => 'user_789',
        'amount' => 99.99,
        'items' => [
            ['sku' => 'WIDGET-001', 'quantity' => 2, 'price' => 49.99]
        ]
    ], [
        'streamId' => 'orders:12345'
    ]);

    echo "Event emitted with sequence number: " . $result['sequenceNumber'] . "\n";
    echo "Event hash: " . $result['currentHash'] . "\n";

    // Query current state
    $state = $client->getState('orders:12345');
    echo "Current order state:\n";
    print_r($state);

} catch (TannurException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "HTTP Status: " . $e->getStatusCode() . "\n";
}
```

### Using the Factory Method

```php
<?php

use Tannur\SDK\Tannur;

// Alternative way to create a client
$client = Tannur::createClient([
    'apiKey' => 'your-api-key-here'
]);
```

### Configuration Options

The SDK supports multiple ways to provide your API key:

1. **Direct configuration** (recommended for production):
```php
$client = new TannurClient(['apiKey' => 'your-key-here']);
```

2. **Environment variable**:
```bash
export TANNUR_API_KEY=your-key-here
```
```php
$client = new TannurClient(); // Will use TANNUR_API_KEY
```

3. **Global config file** (created by `tannur login` CLI command):
```php
$client = new TannurClient(); // Will use ~/.tannur/config
```

## Use Cases

### Financial Applications
```php
// Immutable transaction history
$client->emit('account_credited', ['amount' => 1000, 'source' => 'wire_transfer']);
$client->emit('payment_sent', ['amount' => 250, 'recipient' => 'vendor_123']);

// Query current balance (computed from all transactions)
$balance = $client->getState('accounts:user_456');
```

### E-commerce Order Management
```php
// Complete order lifecycle
$client->emit('order_created', ['items' => [...], 'customer' => 'user_789']);
$client->emit('inventory_reserved', ['items' => [...]]);
$client->emit('payment_authorized', ['amount' => 199.99]);
$client->emit('order_fulfilled', ['tracking' => 'UPS123']);

// Real-time order status
$order = $client->getState('orders:ord_123');
```

### Healthcare Records
```php
// Immutable patient record updates
$client->emit('patient_admitted', ['patientId' => 'p123', 'condition' => 'surgery']);
$client->emit('medication_administered', ['drug' => 'aspirin', 'dosage' => '100mg']);
$client->emit('vitals_recorded', ['bp' => '120/80', 'temp' => '98.6F']);

// Current patient status
$patient = $client->getState('patients:p123');
```

### Supply Chain Tracking
```php
// Product journey from manufacture to delivery
$client->emit('product_manufactured', ['batch' => 'B123', 'facility' => 'Factory_A']);
$client->emit('quality_tested', ['result' => 'passed', 'inspector' => 'QA_001']);
$client->emit('shipped_to_distributor', ['distributor' => 'DIST_456']);
$client->emit('delivered_to_customer', ['customer' => 'CUST_789']);

// Complete provenance
$product = $client->getState('products:SKU_123');
```

## API Reference

### TannurClient

The main client class for interacting with the Tannur API.

#### Constructor

```php
$client = new TannurClient(array $config = [])
```

**Parameters:**
- `$config` (array): Configuration options
  - `$config['apiKey']` (string, optional): Your Tannur API key. If not provided, will be resolved from environment or global config
  - `$config['baseUrl']` (string, optional): API base URL, defaults to `https://api.tannur.xyz`

**Throws:** `TannurException` if no API key can be resolved

#### emit()

```php
$result = $client->emit(string $eventName, array $payload, array $options = [])
```

Emits an event to the Tannur platform.

**Parameters:**
- `$eventName` (string): Name of the event (e.g., 'order_placed', 'user_registered')
- `$payload` (array): Event data as associative array
- `$options` (array, optional): Additional options
  - `$options['streamId']` (string, optional): Target stream ID, defaults to 'default'

**Returns:** Array with the following keys:
- `sequenceNumber` (int): The sequence number of the event within its stream
- `currentHash` (string): SHA-256 hash of the event for integrity verification

**Throws:** `TannurException` on API errors

**Example:**
```php
$result = $client->emit('payment_processed', [
    'paymentId' => 'pay_123',
    'amount' => 50.00,
    'currency' => 'USD',
    'method' => 'credit_card'
], [
    'streamId' => 'payments:pay_123'
]);
```

#### getState()

```php
$state = $client->getState(string $streamId)
```

Retrieves the current state snapshot for a stream.

**Parameters:**
- `$streamId` (string): The stream identifier

**Returns:** Array representing the current state (result of projection execution)

**Throws:** 
- `TannurException` with status 404 if no state exists for the stream
- `TannurException` with other status codes for API errors

**Example:**
```php
$orderState = $client->getState('orders:12345');
// Returns something like:
// [
//     'orderId' => '12345',
//     'status' => 'completed',
//     'totalAmount' => 99.99,
//     'items' => [...]
// ]
```

### TannurException

Exception class for all SDK errors.

#### Methods

```php
$exception->getMessage(): string     // Error message
$exception->getStatusCode(): int     // HTTP status code (0 for non-HTTP errors)
```

#### Common Status Codes

- `400`: Bad Request (invalid event name, payload too large)
- `401`: Unauthorized (invalid API key)
- `403`: Forbidden (accessing another tenant's data)
- `404`: Not Found (stream has no projected state)
- `409`: Conflict (duplicate email during registration)

### Tannur (Factory Class)

Convenience factory for creating client instances.

#### createClient()

```php
$client = Tannur::createClient(array $config = [])
```

Equivalent to `new TannurClient($config)` but provides a more fluent API.

## Advanced Usage

### Event Sourcing Patterns

#### Command-Query Responsibility Segregation (CQRS)

```php
class OrderService
{
    private TannurClient $tannur;

    public function __construct(TannurClient $tannur)
    {
        $this->tannur = $tannur;
    }

    // Command: Emit events
    public function placeOrder(array $orderData): void
    {
        $this->tannur->emit('order_placed', $orderData, [
            'streamId' => 'orders:' . $orderData['orderId']
        ]);
    }

    public function processPayment(string $orderId, array $paymentData): void
    {
        $this->tannur->emit('payment_processed', $paymentData, [
            'streamId' => 'orders:' . $orderId
        ]);
    }

    // Query: Read current state
    public function getOrderStatus(string $orderId): array
    {
        return $this->tannur->getState('orders:' . $orderId);
    }
}
```

#### Aggregate Pattern

```php
class UserWallet
{
    private string $userId;
    private TannurClient $tannur;

    public function __construct(string $userId, TannurClient $tannur)
    {
        $this->userId = $userId;
        $this->tannur = $tannur;
    }

    public function credit(float $amount, string $reason): void
    {
        $this->tannur->emit('balance_credited', [
            'amount' => $amount,
            'reason' => $reason,
            'timestamp' => date('c')
        ], [
            'streamId' => 'wallets:' . $this->userId
        ]);
    }

    public function debit(float $amount, string $reason): void
    {
        // Check current balance first
        $state = $this->getCurrentBalance();
        if ($state['balance'] < $amount) {
            throw new \InvalidArgumentException('Insufficient funds');
        }

        $this->tannur->emit('balance_debited', [
            'amount' => $amount,
            'reason' => $reason,
            'timestamp' => date('c')
        ], [
            'streamId' => 'wallets:' . $this->userId
        ]);
    }

    public function getCurrentBalance(): array
    {
        try {
            return $this->tannur->getState('wallets:' . $this->userId);
        } catch (TannurException $e) {
            if ($e->getStatusCode() === 404) {
                return ['balance' => 0.0, 'transactions' => []];
            }
            throw $e;
        }
    }
}
```

## Compliance & Security Features

### Cryptographic Integrity
Every event is cryptographically linked to the previous event using SHA-256 hashes, creating an immutable chain that detects any tampering attempts.

### Audit Trail
Complete history of all changes with timestamps, making it perfect for:
- **SOX Compliance**: Financial transaction auditing
- **HIPAA**: Healthcare record integrity  
- **GDPR**: Data processing transparency
- **PCI DSS**: Payment card industry requirements

### Multi-Tenant Isolation
Row-Level Security ensures complete data isolation between tenants, preventing cross-tenant data access.

### Regulatory Benefits
- **Immutable Records**: Events cannot be altered after creation
- **Complete Traceability**: Full audit trail from day one
- **Time-based Queries**: Reconstruct state at any point in time
- **Tamper Detection**: Cryptographic verification of data integrity

## Error Handling

The SDK throws `TannurException` for all API errors:

```php
use Tannur\SDK\TannurException;

try {
    $client->emit('invalid_event', []);
} catch (TannurException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "HTTP Status: " . $e->getStatusCode() . "\n";
    
    // Handle specific error cases
    switch ($e->getStatusCode()) {
        case 400:
            echo "Bad request - check your event name and payload\n";
            break;
        case 401:
            echo "Unauthorized - check your API key\n";
            break;
        case 404:
            echo "Stream not found or no state projected yet\n";
            break;
        default:
            echo "Unexpected error occurred\n";
    }
}
```

### Retry Logic Example

```php
function emitWithRetry(TannurClient $client, string $eventName, array $payload, int $maxRetries = 3): array
{
    $attempt = 0;
    
    while ($attempt < $maxRetries) {
        try {
            return $client->emit($eventName, $payload);
        } catch (TannurException $e) {
            $attempt++;
            
            // Don't retry client errors (4xx)
            if ($e->getStatusCode() >= 400 && $e->getStatusCode() < 500) {
                throw $e;
            }
            
            // Retry server errors (5xx) with exponential backoff
            if ($attempt < $maxRetries) {
                sleep(pow(2, $attempt)); // 2, 4, 8 seconds
                continue;
            }
            
            throw $e;
        }
    }
}
```

## Testing

### Unit Testing with PHPUnit

```php
<?php

use PHPUnit\Framework\TestCase;
use Tannur\SDK\TannurClient;
use Tannur\SDK\TannurException;

class OrderServiceTest extends TestCase
{
    private TannurClient $tannur;
    
    protected function setUp(): void
    {
        $this->tannur = new TannurClient([
            'apiKey' => 'test-key',
            'baseUrl' => 'http://localhost:3000' // Test server
        ]);
    }
    
    public function testPlaceOrder(): void
    {
        $orderData = [
            'orderId' => 'test-123',
            'customerId' => 'user-456',
            'amount' => 99.99
        ];
        
        $result = $this->tannur->emit('order_placed', $orderData, [
            'streamId' => 'orders:test-123'
        ]);
        
        $this->assertArrayHasKey('sequenceNumber', $result);
        $this->assertArrayHasKey('currentHash', $result);
        $this->assertIsInt($result['sequenceNumber']);
        $this->assertIsString($result['currentHash']);
    }
    
    public function testGetOrderState(): void
    {
        // First emit an event
        $this->tannur->emit('order_placed', [
            'orderId' => 'test-456',
            'status' => 'pending'
        ], ['streamId' => 'orders:test-456']);
        
        // Then query the state
        $state = $this->tannur->getState('orders:test-456');
        
        $this->assertIsArray($state);
        // Add assertions based on your projection logic
    }
}
```

## Why Choose Tannur?

### vs. Building Your Own Event Store
- **Zero Infrastructure**: No Kafka, EventStore, or complex setup
- **Instant Compliance**: Built-in audit trails and tamper detection
- **Cost Effective**: Zero-cost hosting stack (Supabase + Upstash + Vercel)
- **Developer Friendly**: Simple SDK, not complex event sourcing frameworks

### vs. Traditional Databases
- **Complete History**: Never lose the story behind your data
- **Built-in Auditing**: Compliance-ready from day one
- **Time Travel**: Debug issues by replaying historical state
- **Immutable**: Events can never be accidentally deleted or modified

### vs. Other Event Sourcing Solutions
- **Hosted Service**: No infrastructure to manage
- **Multi-Language SDKs**: PHP, TypeScript, and more
- **Compliance Focus**: Designed for regulated industries
- **Simple Pricing**: Pay for what you use, no complex licensing

## Development

### Running Tests

```bash
composer test
```

### Test Coverage

```bash
composer test-coverage
```

### Code Style

This package follows PSR-12 coding standards. You can check code style with:

```bash
composer cs-check
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Changelog

### v1.0.0
- Initial release
- Support for event emission and state querying
- Comprehensive error handling
- PSR-4 autoloading
- Full test coverage

## License

Apache License 2.0 - see LICENSE file for details.

## Support

- Documentation: [https://docs.tannur.xyz](https://docs.tannur.xyz)
- Issues: [GitHub Issues](https://github.com/tannur/tannur/issues)
- Email: hello@tannur.xyz