<?php

/**
 * Advanced example: Order Service using CQRS pattern
 * 
 * This example demonstrates:
 * 1. Command-Query Responsibility Segregation (CQRS)
 * 2. Domain-driven design with aggregates
 * 3. Event sourcing patterns
 * 4. Error handling and validation
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Tannur\SDK\TannurClient;
use Tannur\SDK\TannurException;

class OrderService
{
    private TannurClient $tannur;

    public function __construct(TannurClient $tannur)
    {
        $this->tannur = $tannur;
    }

    // Commands (write operations)
    
    public function createOrder(string $orderId, string $customerId, array $items): void
    {
        $this->tannur->emit('order_created', [
            'orderId' => $orderId,
            'customerId' => $customerId,
            'items' => $items,
            'status' => 'pending',
            'createdAt' => date('c')
        ], ['streamId' => "orders:{$orderId}"]);
    }

    public function addItem(string $orderId, array $item): void
    {
        $this->tannur->emit('item_added', [
            'item' => $item,
            'addedAt' => date('c')
        ], ['streamId' => "orders:{$orderId}"]);
    }

    public function processPayment(string $orderId, array $paymentDetails): void
    {
        $this->tannur->emit('payment_processed', [
            'paymentMethod' => $paymentDetails['method'],
            'amount' => $paymentDetails['amount'],
            'transactionId' => $paymentDetails['transactionId'],
            'processedAt' => date('c')
        ], ['streamId' => "orders:{$orderId}"]);
    }

    public function shipOrder(string $orderId, string $trackingNumber): void
    {
        $this->tannur->emit('order_shipped', [
            'trackingNumber' => $trackingNumber,
            'carrier' => 'FedEx',
            'shippedAt' => date('c')
        ], ['streamId' => "orders:{$orderId}"]);
    }

    // Queries (read operations)
    
    public function getOrderDetails(string $orderId): ?array
    {
        try {
            return $this->tannur->getState("orders:{$orderId}");
        } catch (TannurException $e) {
            if ($e->getStatusCode() === 404) {
                return null; // Order doesn't exist
            }
            throw $e;
        }
    }

    public function getOrderStatus(string $orderId): ?string
    {
        $order = $this->getOrderDetails($orderId);
        return $order['status'] ?? null;
    }
}

// Example usage
try {
    $client = new TannurClient();
    $orderService = new OrderService($client);
    
    $orderId = 'order-' . uniqid();
    
    echo "🛒 Order Service Example\n";
    echo "Order ID: {$orderId}\n\n";
    
    // Create an order
    echo "1️⃣ Creating order...\n";
    $orderService->createOrder($orderId, 'customer-123', [
        ['sku' => 'LAPTOP-001', 'name' => 'Gaming Laptop', 'price' => 1299.99, 'quantity' => 1],
        ['sku' => 'MOUSE-001', 'name' => 'Wireless Mouse', 'price' => 49.99, 'quantity' => 1]
    ]);
    
    // Add another item
    echo "2️⃣ Adding item to order...\n";
    $orderService->addItem($orderId, [
        'sku' => 'KEYBOARD-001', 
        'name' => 'Mechanical Keyboard', 
        'price' => 129.99, 
        'quantity' => 1
    ]);
    
    // Process payment
    echo "3️⃣ Processing payment...\n";
    $orderService->processPayment($orderId, [
        'method' => 'credit_card',
        'amount' => 1479.97,
        'transactionId' => 'txn-' . uniqid()
    ]);
    
    // Ship the order
    echo "4️⃣ Shipping order...\n";
    $orderService->shipOrder($orderId, 'TRK' . strtoupper(uniqid()));
    
    // Query final state
    echo "\n📋 Final order details:\n";
    $orderDetails = $orderService->getOrderDetails($orderId);
    echo json_encode($orderDetails, JSON_PRETTY_PRINT) . "\n";
    
    echo "\n✅ Order processing complete!\n";
    echo "Status: " . $orderService->getOrderStatus($orderId) . "\n";
    
} catch (TannurException $e) {
    echo "❌ Tannur Error: " . $e->getMessage() . "\n";
    echo "HTTP Status: " . $e->getStatusCode() . "\n";
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}