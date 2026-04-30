<?php

/**
 * Basic usage example for Tannur PHP SDK
 * 
 * This example demonstrates how to:
 * 1. Initialize the Tannur client
 * 2. Emit events to build up state
 * 3. Query the current state
 * 
 * To run this example:
 * 1. Set your TANNUR_API_KEY environment variable
 * 2. Run: php examples/basic-usage.php
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Tannur\SDK\TannurClient;
use Tannur\SDK\TannurException;

try {
    // Initialize client (will use TANNUR_API_KEY env var)
    $client = new TannurClient();
    
    $streamId = 'examples:wallet:' . uniqid();
    
    echo "🚀 Tannur PHP SDK Example\n";
    echo "Stream ID: {$streamId}\n\n";
    
    // Emit some events to build up state
    echo "📝 Emitting events...\n";
    
    $events = [
        ['wallet_created', ['userId' => 'user123', 'initialBalance' => 0]],
        ['funds_added', ['amount' => 100.00, 'source' => 'bank_transfer']],
        ['purchase_made', ['amount' => 25.50, 'merchant' => 'Coffee Shop']],
        ['funds_added', ['amount' => 50.00, 'source' => 'gift_card']],
        ['purchase_made', ['amount' => 15.75, 'merchant' => 'Bookstore']],
    ];
    
    foreach ($events as [$eventName, $payload]) {
        $result = $client->emit($eventName, $payload, ['streamId' => $streamId]);
        echo "  ✅ {$eventName}: sequence #{$result['sequenceNumber']}\n";
    }
    
    echo "\n💾 Querying current state...\n";
    
    // Query the current state
    $state = $client->getState($streamId);
    
    echo "📊 Current wallet state:\n";
    echo json_encode($state, JSON_PRETTY_PRINT) . "\n";
    
} catch (TannurException $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "HTTP Status: " . $e->getStatusCode() . "\n";
    
    if ($e->getStatusCode() === 401) {
        echo "\n💡 Tip: Make sure to set your TANNUR_API_KEY environment variable\n";
        echo "   export TANNUR_API_KEY=your-api-key-here\n";
    }
} catch (Exception $e) {
    echo "❌ Unexpected error: " . $e->getMessage() . "\n";
}