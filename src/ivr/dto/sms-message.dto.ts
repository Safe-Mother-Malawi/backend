/**
 * Africa's Talking SMS message shape returned by the fetch messages API.
 * GET https://api.africastalking.com/version1/messaging
 *
 * Ref: https://developers.africastalking.com/docs/sms/fetch_messages
 */
export interface AtSmsMessage {
  /** Unique message ID — use as lastReceivedId on next poll */
  id: number;
  /** Message body */
  text: string;
  /** Recipient phone number (your shortcode / virtual number) */
  to: string;
  /** Sender phone number in E.164 format */
  from: string;
  /** ISO 8601 date string */
  date: string;
  /** Delivery status */
  linkId?: string;
}

export interface AtFetchMessagesResponse {
  SMSMessageData: {
    Messages: AtSmsMessage[];
  };
}
