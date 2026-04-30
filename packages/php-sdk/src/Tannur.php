<?php

declare(strict_types=1);

namespace Tannur\SDK;

/**
 * Main entry point for Tannur SDK.
 * Provides a convenient factory method for creating clients.
 */
class Tannur
{
    /**
     * Creates a new Tannur client instance.
     * 
     * @param array $config Configuration array
     * @return TannurClient
     */
    public static function createClient(array $config = []): TannurClient
    {
        return new TannurClient($config);
    }
}