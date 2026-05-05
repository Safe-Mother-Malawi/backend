import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

/**
 * Twilio Voice Token Controller
 * Generates access tokens for in-app calling using Twilio Voice SDK
 */
@Controller('ivr/twilio')
export class TwilioVoiceTokenController {
  private readonly logger = new Logger(TwilioVoiceTokenController.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * GET /api/v1/ivr/twilio/token
   * Generate Twilio access token for in-app calling
   * 
   * Query params:
   *   - identity: User identifier (phone number or user ID)
   */
  @Get('token')
  generateToken(@Query('identity') identity?: string): {
    token: string;
    identity: string;
  } {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const apiKey = this.config.get<string>('TWILIO_API_KEY');
    const apiSecret = this.config.get<string>('TWILIO_API_SECRET');
    const twilioNumber = this.config.get<string>('TWILIO_PHONE_NUMBER');

    // Validate required Twilio credentials
    if (!accountSid) {
      throw new Error('TWILIO_ACCOUNT_SID is not configured');
    }

    // Use account SID as API key if not set (for testing)
    const effectiveApiKey = apiKey || accountSid;
    const effectiveApiSecret = apiSecret || this.config.get<string>('TWILIO_AUTH_TOKEN') || '';

    // Generate unique identity if not provided
    const userIdentity = identity || `user_${Date.now()}`;

    // Create access token
    const accessToken = new AccessToken(
      accountSid,
      effectiveApiKey,
      effectiveApiSecret,
      { identity: userIdentity },
    );

    // Create voice grant
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: this.config.get<string>('TWILIO_TWIML_APP_SID'),
      incomingAllow: true, // Allow incoming calls
    });

    // Add grant to token
    accessToken.addGrant(voiceGrant);

    const token = accessToken.toJwt();

    this.logger.log(`Generated token for identity: ${userIdentity}`);

    return {
      token,
      identity: userIdentity,
    };
  }
}
