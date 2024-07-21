import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import type { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { BaseEntity } from '../../../../domain/base-entity';

@Entity()
export class UserSession extends BaseEntity {
  @Column()
  ip: string;

  @ManyToOne('UserAccount', 'userSessions', {
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  userAccount: UserAccount;

  @Column()
  user_agent_info: string;

  @Column()
  device_id: string;

  @Column()
  refresh_token: string;

  @Column()
  rt_issued_at: Date;

  @Column()
  rt_expiration_date: Date;
}
