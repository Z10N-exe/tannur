# Tannur Go SDK

Official Go SDK for the Tannur Event-Sourced BaaS platform.

## Installation

```bash
go get github.com/tannur/go-sdk
```

## Usage

```go
package main

import (
    "context"
    "log"
    
    "github.com/tannur/go-sdk"
)

func main() {
    client := tannur.New(
        tannur.WithAPIKey("your-api-key"),
        tannur.WithBaseURL("https://api.tannur.xyz"),
    )
    
    ctx := context.Background()
    
    // Emit an event
    result, err := client.Emit(ctx, &tannur.EmitRequest{
        EventName: "user-created",
        Payload: map[string]interface{}{
            "userId": "123",
            "email": "user@example.com",
        },
    })
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Event emitted: sequence=%d, hash=%s", 
        result.SequenceNumber, result.CurrentHash)
    
    // Get stream state
    state, err := client.GetState(ctx, "default")
    if err != nil {
        log.Fatal(err)
    }
    
    log.Printf("Current state: %+v", state)
}
```

## Features

- Idiomatic Go patterns and conventions
- Context-aware operations with cancellation and timeouts
- Strongly-typed structs with validation
- Comprehensive error handling
- Go modules support

## Documentation

See [pkg.go.dev](https://pkg.go.dev/github.com/tannur/go-sdk) for full API documentation.