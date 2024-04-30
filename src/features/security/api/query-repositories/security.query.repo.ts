import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../../domain/entities/security.entity';
import { getSessionViewModel } from '../models/security.view.models/security.view.model';
import { SecurityViewDeviceModel } from '../models/security.view.models/security.view.types';

@Injectable()
export class SecurityQueryRepo {
  constructor(
    @InjectRepository(UserSession)
    private readonly userSessions: Repository<UserSession>
  ) {}

  async getUserActiveSessions(
    userId: string
  ): Promise<SecurityViewDeviceModel[] | null> {
    try {
      const sessions = await this.userSessions.find({
        where: {
          userAccount: { id: userId },
        },
      });

      if (!sessions) return null;

      return sessions.map(getSessionViewModel);
    } catch (error) {
      console.log(`Database fails operate with find user sessions ${error}`);
      return null;
    }
  }

  async getUserSession(
    deviceId: string
  ): Promise<SecurityViewDeviceModel | null> {
    try {
      const sessions = await this.userSessions.find({
        where: {
          device_id: deviceId,
        },
      });

      if (!sessions) return null;

      return getSessionViewModel(sessions[0]);
    } catch (error) {
      console.log(`Database fails operate with find user session ${error}`);
      return null;
    }
  }
}
