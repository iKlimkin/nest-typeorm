import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { UserAccount } from '../../../../admin/domain/entities/user-account.entity';
import { BaseEntity } from '../../../../../domain/base-entity';

@Entity()
export class TelegramMetaUser extends BaseEntity {
  @OneToOne(() => UserAccount, (user) => user.telegramMeta)
  @JoinColumn()
  user: UserAccount;
  @Column()
  userId: string;

  @Column({ nullable: true })
  telegramActivationCode: string;

  @Column({ nullable: true })
  telegramId: string;

  @Column({ nullable: true })
  telegramUsername: string;

  static create(userId: string): TelegramMetaUser {
    const telegramMeta = new TelegramMetaUser();
    telegramMeta.userId = userId;

    return telegramMeta;
  }

  setTelegramActivationCode(code: string) {
    this.telegramActivationCode = code;
  }
  setTelegramId(telegramId: string) {
    this.telegramId = telegramId;
  }
  setTelegramUsername(username: string) {
    this.telegramUsername = username;
  }
}
