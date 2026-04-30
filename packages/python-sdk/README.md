# Tannur Python SDK

Official Python SDK for the Tannur Event-Sourced BaaS platform with both synchronous and asynchronous support.

## Installation

```bash
pip install tannur-python
```

## Usage

### Synchronous Client

```python
from tannur import TannurClient

# Create client
client = TannurClient(
    api_key="your-api-key",
    base_url="https://api.tannur.xyz"
)

# Emit an event
result = client.emit(
    event_name="user-created",
    payload={
        "user_id": "123",
        "email": "user@example.com"
    },
    stream_id="users"
)

print(f"Event emitted: sequence={result.sequence_number}, hash={result.current_hash}")

# Get stream state
state = client.get_state("users")
print(f"Current state: {state}")
```

### Asynchronous Client

```python
import asyncio
from tannur import AsyncTannurClient

async def main():
    # Create async client
    client = AsyncTannurClient(
        api_key="your-api-key",
        base_url="https://api.tannur.xyz"
    )
    
    # Emit an event
    result = await client.emit(
        event_name="user-created",
        payload={
            "user_id": "123",
            "email": "user@example.com"
        },
        stream_id="users"
    )
    
    print(f"Event emitted: sequence={result.sequence_number}, hash={result.current_hash}")
    
    # Get stream state
    state = await client.get_state("users")
    print(f"Current state: {state}")

asyncio.run(main())
```

### Context Manager Support

```python
from tannur import TannurSession

with TannurSession(api_key="your-api-key") as client:
    result = client.emit("user-created", {"user_id": "123"})
    print(f"Event emitted: {result.sequence_number}")
```

## Features

- Synchronous and asynchronous client interfaces
- Full type hints support
- PEP 8 compliant naming conventions
- Context manager support
- Comprehensive error handling
- asyncio and async/await patterns
- Pydantic models for data validation

## Documentation

See the [official documentation](https://docs.tannur.xyz/python) for more details.