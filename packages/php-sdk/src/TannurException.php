<?php

declare(strict_types=1);

namespace Tannur\SDK;

use Exception;

/**
 * Exception thrown by the SDK when the API returns a non-2xx response.
 * 
 * Requirements: 6.4
 */
class TannurException extends Exception
{
    private int $statusCode;

    public function __construct(int $statusCode, string $message, ?Exception $previous = null)
    {
        parent::__construct($message, 0, $previous);
        $this->statusCode = $statusCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}