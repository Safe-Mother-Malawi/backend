import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { EmergencyService } from '../services/emergency.service';

/**
 * Emergency Controller for IVR
 * Handles emergency dispatch endpoints
 */

@Controller('ivr/emergency')
export class EmergencyController {
  private readonly logger = new Logger(EmergencyController.name);

  constructor(private readonly emergencyService: EmergencyService) {}

  /**
   * GET /ivr/emergency/services
   * Get list of emergency services
   */
  @Get('services')
  getEmergencyServices() {
    this.logger.log('Fetching emergency services list');
    return this.emergencyService.getEmergencyServices('en');
  }

  /**
   * POST /ivr/emergency/ambulance/dispatch
   * Dispatch ambulance
   */
  @Post('ambulance/dispatch')
  async dispatchAmbulance(
    @Body()
    body: {
      sessionId: string;
      latitude: number;
      longitude: number;
      address: string;
      patientName?: string;
      patientPhone?: string;
      patientType?: 'prenatal' | 'neonatal';
    },
  ) {
    this.logger.log(`Ambulance dispatch request for session ${body.sessionId}`);

    const response = await this.emergencyService.dispatchAmbulance({
      sessionId: body.sessionId,
      location: {
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
      },
      patientName: body.patientName,
      patientPhone: body.patientPhone,
      patientType: body.patientType,
    });

    return response;
  }

  /**
   * POST /ivr/emergency/police/dispatch
   * Dispatch police
   */
  @Post('police/dispatch')
  async dispatchPolice(
    @Body()
    body: {
      sessionId: string;
      emergencyType: 'violence' | 'crime' | 'other';
      latitude: number;
      longitude: number;
      address: string;
      patientName?: string;
      patientPhone?: string;
    },
  ) {
    this.logger.log(
      `Police dispatch request for session ${body.sessionId} (${body.emergencyType})`,
    );

    const response = await this.emergencyService.dispatchPolice({
      sessionId: body.sessionId,
      emergencyType: body.emergencyType,
      location: {
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
      },
      patientName: body.patientName,
      patientPhone: body.patientPhone,
    });

    return response;
  }

  /**
   * POST /ivr/emergency/hospital/nearest
   * Find nearest hospital
   */
  @Post('hospital/nearest')
  async findNearestHospital(
    @Body()
    body: {
      sessionId: string;
      latitude: number;
      longitude: number;
      address?: string;
    },
  ) {
    this.logger.log(`Hospital lookup request for session ${body.sessionId}`);

    const hospital = await this.emergencyService.findNearestHospital({
      sessionId: body.sessionId,
      location: {
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address || 'Current Location',
      },
    });

    if (!hospital) {
      return {
        success: false,
        message: 'No hospitals found in your area',
      };
    }

    return {
      success: true,
      hospital,
    };
  }

  /**
   * POST /ivr/emergency/helpline/connect
   * Connect to helpline
   */
  @Post('helpline/connect')
  async connectToHelpline(
    @Body()
    body: {
      sessionId: string;
      patientName?: string;
      patientPhone?: string;
    },
  ) {
    this.logger.log(`Helpline connection request for session ${body.sessionId}`);

    const response = await this.emergencyService.connectToHelpline({
      sessionId: body.sessionId,
      patientName: body.patientName,
      patientPhone: body.patientPhone,
    });

    return response;
  }
}
