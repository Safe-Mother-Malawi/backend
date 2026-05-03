import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

/**
 * Twilio IVR Service
 * Handles voice call flows using Twilio's TwiML (Twilio Markup Language)
 * 
 * Setup:
 * 1. Create Twilio account at https://www.twilio.com
 * 2. Get Account SID, Auth Token, and Twilio phone number
 * 3. Set webhook URL in Twilio console to: https://your-ngrok-url/api/v1/ivr/twilio/voice
 * 4. Add credentials to .env
 */

interface TwilioCallParams {
  callSid: string;
  accountSid: string;
  from: string;
  to: string;
  callStatus: string;
  digits?: string;
}

@Injectable()
export class TwilioIvrService {
  private readonly logger = new Logger(TwilioIvrService.name);
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly twilioPhone: string;
  private readonly client: any;

  constructor(private readonly config: ConfigService) {
    this.accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID', '');
    this.authToken = this.config.get<string>('TWILIO_AUTH_TOKEN', '');
    this.twilioPhone = this.config.get<string>('TWILIO_PHONE_NUMBER', '');

    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
      this.logger.log(`Twilio IVR initialized — phone=${this.twilioPhone}`);
    } else {
      this.logger.warn('Twilio credentials not configured');
    }
  }

  /**
   * Generate TwiML for voice call
   * Called when Twilio receives a call to your number
   */
  generateWelcomeVxml(): string {
    const response = new twilio.twiml.VoiceResponse();

    // Gather user input (1 digit, timeout 5 seconds)
    const gather = response.gather({
      numDigits: 1,
      action: '/api/v1/ivr/twilio/menu',
      method: 'POST',
      timeout: 5,
    });

    gather.say(
      {
        voice: 'woman',
        language: 'en-US',
      },
      'Welcome to Safe Mother Malawi. ' +
      'Press 1 to check your health symptoms. ' +
      'Press 2 to hear your next appointment. ' +
      'Press 3 for health tips. ' +
      'Press 0 for emergency contacts.',
    );

    // If no input, redirect back to welcome
    response.redirect('/api/v1/ivr/twilio/voice');

    return response.toString();
  }

  /**
   * Handle menu selection
   */
  generateMenuVxml(digit: string): string {
    const response = new twilio.twiml.VoiceResponse();

    switch (digit) {
      case '1':
        response.say(
          { voice: 'woman', language: 'en-US' },
          'Starting symptom check. Are you calling about a pregnancy or a newborn baby? ' +
          'Press 1 for pregnancy. Press 2 for newborn baby.',
        );
        response.gather({
          numDigits: 1,
          action: '/api/v1/ivr/twilio/symptom-type',
          method: 'POST',
          timeout: 5,
        });
        break;

      case '2':
        response.say(
          { voice: 'woman', language: 'en-US' },
          'Your next appointment information. ' +
          'Please contact your health centre for appointment details. ' +
          'Press 1 to return to the main menu.',
        );
        response.gather({
          numDigits: 1,
          action: '/api/v1/ivr/twilio/menu',
          method: 'POST',
          timeout: 5,
        });
        break;

      case '3':
        response.say(
          { voice: 'woman', language: 'en-US' },
          'Health tips. Attend all antenatal care visits. Eat a balanced diet. ' +
          'Take your iron and folic acid tablets daily. Rest adequately. ' +
          'If you feel unwell, visit your health centre immediately. ' +
          'Press 1 to return to the main menu.',
        );
        response.gather({
          numDigits: 1,
          action: '/api/v1/ivr/twilio/menu',
          method: 'POST',
          timeout: 5,
        });
        break;

      case '0':
        response.say(
          { voice: 'woman', language: 'en-US' },
          'Emergency contacts. For an ambulance, call 9 9 8. ' +
          'For the health emergency hotline, call 1 1 6. ' +
          'If you are in immediate danger, hang up and call 9 9 8 now. ' +
          'Press 1 to return to the main menu.',
        );
        response.gather({
          numDigits: 1,
          action: '/api/v1/ivr/twilio/menu',
          method: 'POST',
          timeout: 5,
        });
        break;

      default:
        response.say(
          { voice: 'woman', language: 'en-US' },
          'Invalid option. Please try again.',
        );
        response.redirect('/api/v1/ivr/twilio/voice');
    }

    return response.toString();
  }

  /**
   * Handle symptom type selection (prenatal vs neonatal)
   */
  generateSymptomTypeVxml(digit: string): string {
    const response = new twilio.twiml.VoiceResponse();

    if (digit === '1') {
      // Prenatal symptoms
      response.say(
        { voice: 'woman', language: 'en-US' },
        'Prenatal health check. Question 1 of 5. ' +
        'How are you feeling today? ' +
        'Press 1 for very well. Press 2 if you feel tired. ' +
        'Press 3 if you feel unwell. Press 4 if you are in pain.',
      );
      response.gather({
        numDigits: 1,
        action: '/api/v1/ivr/twilio/symptom-prenatal-1',
        method: 'POST',
        timeout: 5,
      });
    } else if (digit === '2') {
      // Neonatal symptoms
      response.say(
        { voice: 'woman', language: 'en-US' },
        'Neonatal health check. Question 1 of 5. ' +
        'How is your baby breathing? ' +
        'Press 1 for normal breathing. Press 2 for fast breathing. ' +
        'Press 3 for very fast or noisy breathing.',
      );
      response.gather({
        numDigits: 1,
        action: '/api/v1/ivr/twilio/symptom-neonatal-1',
        method: 'POST',
        timeout: 5,
      });
    } else {
      response.say(
        { voice: 'woman', language: 'en-US' },
        'Invalid option. Please try again.',
      );
      response.redirect('/api/v1/ivr/twilio/voice');
    }

    return response.toString();
  }

  /**
   * Prenatal symptom questions
   */
  generatePrenatalSymptomVxml(questionNumber: number, digit?: string): string {
    const response = new twilio.twiml.VoiceResponse();

    const questions = [
      {
        num: 1,
        text: 'How are you feeling today? Press 1 for very well. Press 2 if you feel tired. Press 3 if you feel unwell. Press 4 if you are in pain.',
        nextAction: '/api/v1/ivr/twilio/symptom-prenatal-2',
      },
      {
        num: 2,
        text: 'Do you have a headache? Press 1 for no headache. Press 2 for mild headache. Press 3 for severe headache. Press 4 for severe headache with blurred vision.',
        nextAction: '/api/v1/ivr/twilio/symptom-prenatal-3',
      },
      {
        num: 3,
        text: 'Do you have swelling? Press 1 for no swelling. Press 2 for mild swelling of feet. Press 3 for swelling of hands and face. Press 4 for sudden severe swelling.',
        nextAction: '/api/v1/ivr/twilio/symptom-prenatal-4',
      },
      {
        num: 4,
        text: 'Is your baby moving? Press 1 if baby is moving normally. Press 2 if baby is moving less than usual. Press 3 if baby has not moved today.',
        nextAction: '/api/v1/ivr/twilio/symptom-prenatal-5',
      },
      {
        num: 5,
        text: 'Do you have any bleeding or unusual discharge? Press 1 for none. Press 2 for light spotting. Press 3 for heavy bleeding. Press 4 for unusual discharge.',
        nextAction: '/api/v1/ivr/twilio/symptom-result',
      },
    ];

    const q = questions[questionNumber - 1];
    if (!q) {
      response.say(
        { voice: 'woman', language: 'en-US' },
        'Assessment complete. Thank you for using Safe Mother Malawi.',
      );
      response.hangup();
      return response.toString();
    }

    response.say(
      { voice: 'woman', language: 'en-US' },
      `Question ${q.num} of 5. ${q.text}`,
    );
    response.gather({
      numDigits: 1,
      action: q.nextAction,
      method: 'POST',
      timeout: 5,
    });

    return response.toString();
  }

  /**
   * Neonatal symptom questions
   */
  generateNeonatalSymptomVxml(questionNumber: number, digit?: string): string {
    const response = new twilio.twiml.VoiceResponse();

    const questions = [
      {
        num: 1,
        text: 'How is your baby breathing? Press 1 for normal breathing. Press 2 for fast breathing. Press 3 for very fast or noisy breathing.',
        nextAction: '/api/v1/ivr/twilio/symptom-neonatal-2',
      },
      {
        num: 2,
        text: 'How is your baby feeding? Press 1 if feeding well. Press 2 if feeding poorly. Press 3 if not feeding at all.',
        nextAction: '/api/v1/ivr/twilio/symptom-neonatal-3',
      },
      {
        num: 3,
        text: "What is your baby's skin colour? Press 1 for normal. Press 2 for pale or yellowish. Press 3 for blue or very yellow.",
        nextAction: '/api/v1/ivr/twilio/symptom-neonatal-4',
      },
      {
        num: 4,
        text: 'Does your baby have a fever or feel cold? Press 1 for normal temperature. Press 2 for mild fever. Press 3 for high fever or very cold.',
        nextAction: '/api/v1/ivr/twilio/symptom-neonatal-5',
      },
      {
        num: 5,
        text: 'How active is your baby? Press 1 if active and alert. Press 2 if less active than usual. Press 3 if very sleepy or not responding.',
        nextAction: '/api/v1/ivr/twilio/symptom-result',
      },
    ];

    const q = questions[questionNumber - 1];
    if (!q) {
      response.say(
        { voice: 'woman', language: 'en-US' },
        'Assessment complete. Thank you for using Safe Mother Malawi.',
      );
      response.hangup();
      return response.toString();
    }

    response.say(
      { voice: 'woman', language: 'en-US' },
      `Question ${q.num} of 5. ${q.text}`,
    );
    response.gather({
      numDigits: 1,
      action: q.nextAction,
      method: 'POST',
      timeout: 5,
    });

    return response.toString();
  }

  /**
   * Generate risk assessment result
   */
  generateResultVxml(riskLevel: string, message: string): string {
    const response = new twilio.twiml.VoiceResponse();

    response.say(
      { voice: 'woman', language: 'en-US' },
      `Your health assessment is complete. Your risk level is: ${riskLevel}. ${message} ` +
      'Thank you for using Safe Mother Malawi. Goodbye.',
    );
    response.hangup();

    return response.toString();
  }

  /**
   * Make an outbound call
   */
  async makeCall(toNumber: string, message: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const call = await this.client.calls.create({
        from: this.twilioPhone,
        to: toNumber,
        url: `${this.config.get('PUBLIC_URL')}/api/v1/ivr/twilio/voice`,
      });

      this.logger.log(`Outbound call created — SID=${call.sid} to=${toNumber}`);
      return call.sid;
    } catch (error) {
      this.logger.error(`Failed to make call to ${toNumber}`, error);
      throw error;
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSms(toNumber: string, message: string): Promise<string> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const sms = await this.client.messages.create({
        from: this.twilioPhone,
        to: toNumber,
        body: message,
      });

      this.logger.log(`SMS sent — SID=${sms.sid} to=${toNumber}`);
      return sms.sid;
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${toNumber}`, error);
      throw error;
    }
  }

  /**
   * Get call details
   */
  async getCallDetails(callSid: string): Promise<any> {
    if (!this.client) {
      throw new Error('Twilio client not initialized');
    }

    try {
      const call = await this.client.calls(callSid).fetch();
      return call;
    } catch (error) {
      this.logger.error(`Failed to fetch call ${callSid}`, error);
      throw error;
    }
  }
}
