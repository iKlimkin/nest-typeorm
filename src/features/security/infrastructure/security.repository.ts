import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Not, Repository } from 'typeorm';
import { UserSessionRawDto } from '../../auth/api/models/dtos/user-session.dto';
import { UserSession } from '../domain/entities/security.entity';
import { OutputId } from '../../../domain/output.models';

@Injectable()
export class SecurityRepository {
  constructor(
    @InjectRepository(UserSession)
    private readonly userSessions: Repository<UserSession>,
  ) {}
  async createSession(
    sessionDto: Readonly<UserSessionRawDto>,
  ): Promise<OutputId | null> {
    try {
      const session = this.userSessions.create({
        ...sessionDto,
        userAccount: {
          id: sessionDto.user_id,
        },
      });

      const result = await this.userSessions.save(session);

      return {
        id: result.id,
      };
    } catch (error) {
      console.error(`
      Database fails operate with create session ${error}`);
      return null;
    }
  }

  async deleteRefreshTokensBannedUser(userId: string, manager: EntityManager) {
    try {
      await manager.delete(UserSession, { userAccount: { id: userId } });
    } catch (error) {
      throw new Error(`Database fails during delete operation ${error}`);
    }
  }

  async updateIssuedToken(
    deviceId: string,
    issuedAt: Date,
    exp: Date,
  ): Promise<boolean> {
    try {
      const result = await this.userSessions.update(
        { device_id: deviceId },
        { rt_issued_at: issuedAt, rt_expiration_date: exp },
      );

      return result.affected !== 0;
    } catch (error) {
      console.error(
        `Database fails operate with update token's issued at ${error}`,
      );
      return false;
    }
  }

  async deleteSpecificSession(deviceId: string): Promise<boolean> {
    try {
      const sessionToDelete = await this.userSessions.findOneBy({
        device_id: deviceId,
      });

      if (!sessionToDelete) return false;

      const result = await this.userSessions.remove(sessionToDelete);

      return !!result;
    } catch (error) {
      console.error(
        `Database fails operate with delete specific session ${error}`,
      );
      return false;
    }
  }

  async deleteOtherUserSessions(deviceId: string): Promise<boolean> {
    try {
      const otherSessions = await this.userSessions.findOneBy({
        device_id: Not(deviceId),
      });

      if (!otherSessions) return false;

      const result = await this.userSessions.remove(otherSessions);

      return !!result;
    } catch (error) {
      console.error(
        `Database fails operate with delete other sessions ${error}`,
      );
      return false;
    }
  }
}
