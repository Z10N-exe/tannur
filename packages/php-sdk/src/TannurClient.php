<?php

declare(strict_types=1);

namespace Tannur\SDK;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\GuzzleException;

/**
 * Tannur SDK Client for PHP.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
class TannurClient
{
    private Client $httpClient;
    private TannurConfig $config;
    private string $apiKey;

    public function __construct(array $config = [])
    {
        $this->config = new TannurConfig($config);
        $this->apiKey = $this->config->resolveApiKey();
        
        $this->httpClient = new Client([
            'base_uri' => $this->config->getBaseUrl(),
            'headers' => [
                'Content-Type' => 'application/json',
                'Authorization' => 'Bearer ' . $this->apiKey,
            ],
            'timeout' => 30,
        ]);
    }

    /**
     * Emits a named event with a payload.
     * 
     * Requirements: 6.2
     * 
     * @param string $eventName Name of the event (e.g., 'order_placed')
     * @param array $payload Event data as associative array
     * @param array $options Additional options (streamId, etc.)
     * @return array Array with sequenceNumber and currentHash
     * @throws TannurException on API errors
     */
    public function emit(string $eventName, array $payload, array $options = []): array
    {
        $body = [
            'streamId' => $options['streamId'] ?? 'default',
            'eventName' => $eventName,
            'payload' => $payload,
        ];

        return $this->request('POST', '/events', $body);
    }

    /**
     * Retrieves the latest projected state for a stream.
     * 
     * Requirements: 6.3
     * 
     * @param string $streamId The stream identifier
     * @return array The current state as associative array
     * @throws TannurException on API errors (including 404 if no state exists)
     */
    public function getState(string $streamId): array
    {
        return $this->request('GET', '/state/' . urlencode($streamId));
    }

    /**
     * Makes an HTTP request to the Tannur API.
     * 
     * @param string $method HTTP method
     * @param string $path API endpoint path
     * @param array|null $body Request body (will be JSON encoded)
     * @return array Decoded JSON response
     * @throws TannurException on API errors
     */
    private function request(string $method, string $path, ?array $body = null): array
    {
        try {
            $options = [];
            if ($body !== null) {
                $options['json'] = $body;
            }

            $response = $this->httpClient->request($method, $path, $options);
            $responseBody = $response->getBody()->getContents();
            
            return json_decode($responseBody, true, 512, JSON_THROW_ON_ERROR);
        } catch (RequestException $e) {
            $statusCode = $e->getResponse() ? $e->getResponse()->getStatusCode() : 0;
            $message = $e->getMessage();

            // Try to extract error message from response body
            if ($e->getResponse()) {
                try {
                    $responseBody = $e->getResponse()->getBody()->getContents();
                    $data = json_decode($responseBody, true, 512, JSON_THROW_ON_ERROR);
                    if (isset($data['error'])) {
                        $message = $data['error'];
                    }
                } catch (\JsonException $jsonException) {
                    // Ignore JSON parse errors, use original message
                }
            }

            throw new TannurException($statusCode, $message, $e);
        } catch (GuzzleException $e) {
            throw new TannurException(0, 'HTTP request failed: ' . $e->getMessage(), $e);
        } catch (\JsonException $e) {
            throw new TannurException(0, 'Failed to decode JSON response: ' . $e->getMessage(), $e);
        }
    }
}