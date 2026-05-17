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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { existsSync, unlinkSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

@Controller('users/profile')
@UseGuards(JwtAuthGuard)
export class UsersProfileController {
  constructor(private readonly usersService: UsersService) {}

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/profile-photos',
        filename: (req, file, callback) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          callback(null, uniqueName);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
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
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.id;
    const photoUrl = `/api/v1/users/profile/photo/${file.filename}`;

    // Update user's profile photo URL
    await this.usersService.updateProfilePhoto(userId, photoUrl);

    return {
      message: 'Profile photo uploaded successfully',
      photoUrl,
    };
  }

  @Get('photo/:filename')
  async getProfilePhoto(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'profile-photos', filename);
    
    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    return res.sendFile(filePath);
  }

  @Delete('photo')
  async deleteProfilePhoto(@Request() req: any) {
    const userId = req.user.id;
    const user = await this.usersService.findById(userId);

    if (user?.profilePhotoUrl) {
      // Extract filename from URL
      const filename = user.profilePhotoUrl.split('/').pop();
      if (filename) {
        const filePath = join(process.cwd(), 'uploads', 'profile-photos', filename);
        
        // Delete file if it exists
        if (existsSync(filePath)) {
          unlinkSync(filePath);
        }
      }
    }

    // Remove photo URL from user record
    await this.usersService.updateProfilePhoto(userId, null);

    return {
      message: 'Profile photo deleted successfully',
    };
  }
}