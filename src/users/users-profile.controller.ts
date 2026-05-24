import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  BadRequestException,
  Delete,
  Get,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { existsSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Controller('users/profile')
@UseGuards(JwtAuthGuard)
export class UsersProfileController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Upload profile photo
   * POST /users/profile/photo
   */
  @Post('photo')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: (req, file, callback) => {
          const uploadDir = join(process.cwd(), 'uploads', 'profile-photos');
          callback(null, uploadDir);
        },
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        // Validate file type
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed (jpg, jpeg, png, gif, webp)'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
  async uploadProfilePhoto(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      // Delete old photo if exists
      const existingUser = await this.usersService.findById(user.id);
      if (existingUser?.profilePhotoUrl) {
        const oldFilename = existingUser.profilePhotoUrl.split('/').pop();
        if (oldFilename) {
          const oldFilePath = join(process.cwd(), 'uploads', 'profile-photos', oldFilename);
          if (existsSync(oldFilePath)) {
            try {
              unlinkSync(oldFilePath);
            } catch (err) {
              console.error('Failed to delete old profile photo:', err);
            }
          }
        }
      }

      // Generate photo URL
      const photoUrl = `/uploads/profile-photos/${file.filename}`;

      // Update user's profile photo URL
      const updatedUser = await this.usersService.updateProfilePhoto(user.id, photoUrl);

      return {
        success: true,
        message: 'Profile photo uploaded successfully',
        photoUrl,
        user: {
          id: updatedUser.id,
          fullName: updatedUser.fullName,
          profilePhotoUrl: updatedUser.profilePhotoUrl,
        },
      };
    } catch (error) {
      // Clean up uploaded file on error
      if (file && existsSync(file.path)) {
        unlinkSync(file.path);
      }
      throw new BadRequestException(`Failed to upload photo: ${error.message}`);
    }
  }

  /**
   * Get profile photo by filename
   * GET /users/profile/photo/:filename
   */
  @Get('photo/:filename')
  @HttpCode(HttpStatus.OK)
  async getProfilePhoto(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
      throw new BadRequestException('Invalid filename');
    }

    const filePath = join(process.cwd(), 'uploads', 'profile-photos', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Photo not found');
    }

    return res.sendFile(filePath);
  }

  /**
   * Delete profile photo
   * DELETE /users/profile/photo
   */
  @Delete('photo')
  @HttpCode(HttpStatus.OK)
  async deleteProfilePhoto(@CurrentUser() user: User) {
    const existingUser = await this.usersService.findById(user.id);

    if (existingUser?.profilePhotoUrl) {
      // Extract filename from URL
      const filename = existingUser.profilePhotoUrl.split('/').pop();
      if (filename) {
        const filePath = join(process.cwd(), 'uploads', 'profile-photos', filename);

        // Delete file if it exists
        if (existsSync(filePath)) {
          try {
            unlinkSync(filePath);
          } catch (err) {
            console.error('Failed to delete profile photo file:', err);
          }
        }
      }
    }

    // Remove photo URL from user record
    await this.usersService.updateProfilePhoto(user.id, null);

    return {
      success: true,
      message: 'Profile photo deleted successfully',
    };
  }

  /**
   * Get current user's profile
   * GET /users/profile
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getProfile(@CurrentUser() user: User) {
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      user: {
        id: fullUser.id,
        email: fullUser.email,
        phone: fullUser.phone,
        fullName: fullUser.fullName,
        role: fullUser.role,
        profilePhotoUrl: fullUser.profilePhotoUrl,
        age: fullUser.age,
        nationality: fullUser.nationality,
        district: fullUser.district,
        facilityName: fullUser.facilityName,
        region: fullUser.region,
        zone: fullUser.zone,
        createdAt: fullUser.createdAt,
        updatedAt: fullUser.updatedAt,
      },
    };
  }
}