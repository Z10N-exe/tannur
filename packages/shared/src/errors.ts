/**
 * Typed error thrown by the SDK when the API returns a non-2xx response.
 * Requirements: 6.4
 */
export class TannurError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "TannurError";
    this.status = status;
    // Maintain proper prototype chain in transpiled environments
    Object.setPrototypeOf(this, TannurError.prototype);
  }
}
