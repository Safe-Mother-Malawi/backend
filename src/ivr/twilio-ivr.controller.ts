import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  HttpCode,
  Logger,
  Query,
} from '@nestjs/common';
import type { Response } from 'express';
import { TwilioIvrService } from './twilio-ivr.service';
import { IvrCallLogService } from './ivr-call-log.service';
import { IvrMenuAction, IvrCallOutcome } from './entities/ivr-call-log.entity';

/**
 * Twilio IVR Controller
 * 
 * Webhook endpoints for Twilio voice calls
 * Configure in Twilio console:
 *   Voice URL: https://your-ngrok-url/api/v1/ivr/twilio/voice
 *   Status Callback: https://your-ngrok-url/api/v1/ivr/twilio/status
 */

@Controller('ivr/twilio')
export class TwilioIvrController {
  private readonly logger = new Logger(TwilioIvrController.name);

  constructor(
    private readonly twilioService: TwilioIvrService,
    private readonly callLog: IvrCallLogService,
  ) {}

  /**
   * POST /api/v1/ivr/twilio/voice
   * Initial voice webhook — called when someone calls your Twilio number
   */
  @Post('voice')
  @HttpCode(200)
  handleVoice(
    @Body() body: any,
    @Res() res: Response,
  ): void {
    const callSid = body.CallSid;
    const from = body.From;
    const to = body.To;

    this.logger.log(`Twilio voice call — SID=${callSid} from=${from} to=${to}`);

    // Log call start
    this.callLog.log({
      sessionId: callSid,
      callerPhone: from,
      action: IvrMenuAction.CALL_START,
    });

    // Generate welcome TwiML
    const twiml = this.twilioService.generateWelcomeVxml();

    res.setHeader('Content-Type', 'application/xml');
    res.send(twiml);
  }

  /**
   * POST /api/v1/ivr/twilio/menu
   * Handle main menu selection
   */
  @Post('menu')
  @HttpCode(200)
  handleMenu(
    @Body() body: any,
    @Res() res: Response,
  ): void {
    const callSid = body.CallSid;
    const from = body.From;
    const digit = body.Digits || '';

    this.logger.log(`Twilio menu — SID=${callSid} from=${from} digit=${digit}`);

    // Log menu selection
    this.callLog.log({
      sessionId: callSid,
      callerPhone: from,
      action: IvrMenuAction.MAIN_MENU,
      digitPressed: digit,
    });

    const twiml = this.twilioService.generateMenuVxml(digit);

    res.setHeader('Content-Type', 'application/xml');
    res.send(twiml);
  }

  /**
   * POST /api/v1/ivr/twilio/symptom-type
   * Handle symptom type selection (prenatal vs neonatal)
   */
  @Post('symptom-type')
  @HttpCode(200)
  handleSymptomType(
    @Body() body: any,
    @Res() res: Response,
  ): void {
    const callSid = body.CallSid;
    const from = body.From;
    const digit = body.Digits || '';

    this.logger.log(`Twilio symptom type — SID=${callSid} from=${from} digit=${digit}`);

    this.callLog.log({
      sessionId: callSid,
      callerPhone: from,
      action: IvrMenuAction.SYMPTOM_ANSWER,
      digitPressed: digit,
    });

    const twiml = this.twilioService.generateSymptomTypeVxml(digit);

    res.setHeader('Content-Type', 'application/xml');
    res.send(twiml);
  }

  /**
   * POST /api/v1/ivr/twilio/symptom-prenatal-1 through 5
   * Handle prenatal symptom questions
   */
  @Post('symptom-prenatal-1')
  @HttpCode(200)
  handlePrenatalSymptom1(@Body() body: any, @Res() res: Response): void {
    this.handlePrenatalSymptomQuestion(1, body, res);
  }

  @Post('symptom-prenatal-2')
  @HttpCode(200)
  handlePrenatalSymptom2(@Body() body: any, @Res() res: Response): void {
    this.handlePrenatalSymptomQuestion(2, body, res);
  }

  @Post('symptom-prenatal-3')
  @HttpCode(200)
  handlePrenatalSymptom3(@Body() body: any, @Res() res: Response): void {
    this.handlePrenatalSymptomQuestion(3, body, res);
  }

  @Post('symptom-prenatal-4')
  @HttpCode(200)
  handlePrenatalSymptom4(@Body() body: any, @Res() res: Response): void {
    this.handlePrenatalSymptomQuestion(4, body, res);
  }

  @Post('symptom-prenatal-5')
  @HttpCode(200)
  handlePrenatalSymptom5(@Body() body: any, @Res() res: Response): void {
    this.handlePrenatalSymptomQuestion(5, body, res);
  }

  private handlePrenatalSymptomQuestion(
    questionNumber: number,
    body: any,
    res: Response,
  ): void {
    const callSid = body.CallSid;
    const from = body.From;
    const digit = body.Digits || '';

    this.logger.log(
      `Twilio prenatal symptom Q${questionNumber} — SID=${callSid} from=${from} digit=${digit}`,
    );

    this.callLog.log({
      sessionId: callSid,
      callerPhone: from,
      action: IvrMenuAction.SYMPTOM_ANSWER,
      digitPressed: digit,
    });

    const twiml = this.twilioService.generatePrenatalSymptomVxml(questionNumber, digit);

    res.setHeader('Content-Type', 'application/xml');
    res.send(twiml);
  }

  /**
   * POST /api/v1/ivr/twilio/symptom-neonatal-1 through 5
   * Handle neonatal symptom questions
   */
  @Post('symptom-neonatal-1')
  @HttpCode(200)
  handleNeonatalSymptom1(@Body() body: any, @Res() res: Response): void {
    this.handleNeonatalSymptomQuestion(1, body, res);
  }

  @Post('symptom-neonatal-2')
  @HttpCode(200)
  handleNeonatalSymptom2(@Body() body: any, @Res() res: Response): void {
    this.handleNeonatalSymptomQuestion(2, body, res);
  }

  @Post('symptom-neonatal-3')
  @HttpCode(200)
  handleNeonatalSymptom3(@Body() body: any, @Res() res: Response): void {
    this.handleNeonatalSymptomQuestion(3, body, res);
  }

  @Post('symptom-neonatal-4')
  @HttpCode(200)
  handleNeonatalSymptom4(@Body() body: any, @Res() res: Response): void {
    this.handleNeonatalSymptomQuestion(4, body, res);
  }

  @Post('symptom-neonatal-5')
  @HttpCode(200)
  handleNeonatalSymptom5(@Body() body: any, @Res() res: Response): void {
    this.handleNeonatalSymptomQuestion(5, body, res);
  }

  private handleNeonatalSymptomQuestion(
    questionNumber: number,
    body: any,
    res: Response,
  ): void {
    const callSid = body.CallSid;
    const from = body.From;
    const digit = body.Digits || '';

    this.logger.log(
      `Twilio neonatal symptom Q${questionNumber} — SID=${callSid} from=${from} digit=${digit}`,
    );

    this.callLog.log({
      sessionId: callSid,
      callerPhone: from,
      action: IvrMenuAction.SYMPTOM_ANSWER,
      digitPressed: digit,
    });

    const twiml = this.twilioService.generateNeonatalSymptomVxml(questionNumber, digit);

    res.setHeader('Content-Type', 'application/xml');
    res.send(twiml);
  }

  /**
   * POST /api/v1/ivr/twilio/symptom-result
   * Generate risk assessment result
   */
  @Post('symptom-result')
  @HttpCode(200)
  handleSymptomResult(
    @Body() body: any,
    @Res() res: Response,
  ): void {
    const callSid = body.CallSid;
    const from = body.From;

    this.logger.log(`Twilio symptom result — SID=${callSid} from=${from}`);

    // In a real system, calculate risk based on answers
    // For now, return a sample result
    const riskLevel = 'Moderate Risk';
    const message = 'Some symptoms need attention. Please visit your health centre.';

    this.callLog.log({
      sessionId: callSid,
      callerPhone: from,
      action: IvrMenuAction.RISK_RESULT,
      riskCategory: 'MODERATE',
    });

    const twiml = this.twilioService.generateResultVxml(riskLevel, message);

    res.setHeader('Content-Type', 'application/xml');
    res.send(twiml);
  }

  /**
   * POST /api/v1/ivr/twilio/status
   * Twilio status callback — called when call ends
   */
  @Post('status')
  @HttpCode(200)
  handleStatus(
    @Body() body: any,
  ): { status: string } {
    const callSid = body.CallSid;
    const from = body.From;
    const callStatus = body.CallStatus;
    const duration = body.CallDuration || 0;

    this.logger.log(
      `Twilio call status — SID=${callSid} from=${from} status=${callStatus} duration=${duration}s`,
    );

    // Log call end
    this.callLog.log({
      sessionId: callSid,
      callerPhone: from,
      action: IvrMenuAction.CALL_END,
      outcome: callStatus === 'completed' ? IvrCallOutcome.RISK_COMPLETED : IvrCallOutcome.ABANDONED_EARLY,
    });

    return { status: 'ok' };
  }

  /**
   * GET /api/v1/ivr/twilio/health
   * Health check endpoint
   */
  @Get('health')
  health(): { status: string; service: string; ready: boolean } {
    return {
      status: 'ok',
      service: 'twilio-ivr',
      ready: true,
    };
  }

  /**
   * POST /api/v1/ivr/twilio/test-call
   * Test endpoint — make a test call to a number
   * Usage: POST /api/v1/ivr/twilio/test-call?to=+265885910300
   */
  @Post('test-call')
  @HttpCode(200)
  async testCall(
    @Query('to') toNumber: string,
  ): Promise<{ callSid: string; message: string }> {
    if (!toNumber) {
      throw new Error('Missing "to" parameter');
    }

    this.logger.log(`Test call initiated to ${toNumber}`);

    const callSid = await this.twilioService.makeCall(
      toNumber,
      'This is a test call from Safe Mother Malawi IVR system.',
    );

    return {
      callSid,
      message: `Test call initiated to ${toNumber}. Call SID: ${callSid}`,
    };
  }

  /**
   * POST /api/v1/ivr/twilio/test-sms
   * Test endpoint — send a test SMS
   * Usage: POST /api/v1/ivr/twilio/test-sms?to=+265885910300
   */
  @Post('test-sms')
  @HttpCode(200)
  async testSms(
    @Query('to') toNumber: string,
  ): Promise<{ messageSid: string; message: string }> {
    if (!toNumber) {
      throw new Error('Missing "to" parameter');
    }

    this.logger.log(`Test SMS initiated to ${toNumber}`);

    const messageSid = await this.twilioService.sendSms(
      toNumber,
      'Hello from Safe Mother Malawi! This is a test SMS from the IVR system.',
    );

    return {
      messageSid,
      message: `Test SMS sent to ${toNumber}. Message SID: ${messageSid}`,
    };
  }
}

