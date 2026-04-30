<?php

declare(strict_types=1);

namespace Tannur\SDK;

/**
 * Configuration class for Tannur SDK.
 * 
 * Requirements: 6.1
 */
class TannurConfig
{
    private ?string $apiKey;
    private string $baseUrl;

    public function __construct(array $config = [])
    {
        $this->apiKey = $config['apiKey'] ?? null;
        $this->baseUrl = rtrim($config['baseUrl'] ?? 'https://api.tannur.xyz', '/');
    }

    public function getApiKey(): ?string
    {
        return $this->apiKey;
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    /**
     * Resolves API key from various sources.
     * Priority: provided config → TANNUR_API_KEY env var → global ~/.tannur/config
     */
    public function resolveApiKey(): string
    {
        // 1. Use provided key if given
        if ($this->apiKey !== null) {
            return $this->apiKey;
        }

        // 2. Check environment variable
        $envKey = getenv('TANNUR_API_KEY');
        if ($envKey !== false && $envKey !== '') {
            return $envKey;
        }

        // 3. Check global config (~/.tannur/config)
        $homeDir = getenv('HOME') ?: getenv('USERPROFILE');
        if ($homeDir !== false) {
            $globalConfigPath = $homeDir . DIRECTORY_SEPARATOR . '.tannur' . DIRECTORY_SEPARATOR . 'config';
            if (file_exists($globalConfigPath)) {
                $contents = trim(file_get_contents($globalConfigPath) ?: '');
                if (preg_match('/^(?:TANNUR_API_KEY=)?(.+)$/m', $contents, $matches)) {
                    $key = trim($matches[1]);
                    if ($key !== '') {
                        return $key;
                    }
                }
            }
        }
        throw new TannurException(
            0,
            "No API key found. Please provide apiKey in config, set TANNUR_API_KEY environment variable, or run 'tannur login'."
        );
    }
}