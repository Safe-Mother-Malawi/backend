import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

/**
 * Guard to check for user inactivity and auto-logout
 * Default timeout: 30 minutes (1800000 ms)
 */
@Injectable()
export class InactivityGuard implements CanActivate {
  private readonly inactivityTimeout: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    // Get timeout from env or default to 30 minutes
    const timeoutMinutes = this.configService.get<number>('INACTIVITY_TIMEOUT_MINUTES', 30);
    this.inactivityTimeout = timeoutMinutes * 60 * 1000; // Convert to milliseconds
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User not found in request');
    }

    try {
      const dbUser = await this.usersService.findById(user.id);
      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user is inactive
      if (dbUser.lastActiveAt) {
        const lastActiveTime = new Date(dbUser.lastActiveAt).getTime();
        const currentTime = new Date().getTime();
        const inactiveTime = currentTime - lastActiveTime;

        if (inactiveTime > this.inactivityTimeout) {
          // User has been inactive for too long
          throw new UnauthorizedException(
            `Session expired due to inactivity. Please login again.`,
          );
        }
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // If there's any other error, allow the request to proceed
      // (don't block on database errors)
      return true;
    }
  }
}
