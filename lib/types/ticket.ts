/**
 * Structured payload encoded in the attendee QR code.
 *
 * Security note: contains ONLY the raw registration token (never token_hash)
 * and the eventId. No auth credentials, no private profile data.
 *
 * Phase D scanner will:
 *   1. Decode QR → parse JSON → extract eventId + token
 *   2. SHA-256 hash the token
 *   3. Send hash to server for verification
 */
export type TicketPayload = {
  /** Payload version — always 1 for Phase C. */
  v: 1;
  /** UUID of the event this ticket is for. */
  eventId: string;
  /** Raw registration token (32 bytes, base64url encoded). Never stored in DB. */
  token: string;
};
