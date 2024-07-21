import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LayerNoticeInterceptor } from '../infra/utils/interlay-error-handler.ts/error-layer-interceptor';

@Entity()
export abstract class BaseBanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  banReason: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  banEndDate: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  banDate: Date;

  @Index('IDX_banned')
  @Column({ type: 'boolean', default: false })
  isBanned: boolean;

  // static async create<T extends BaseBanEntity>(
  //   this: new () => T,
  //   restrictionDto: { banReason: string; isBanned: boolean; userId: string, entity: string },
  // ): Promise<LayerNoticeInterceptor<T>> {
  //   const notice = new LayerNoticeInterceptor<T>();
  //   const { banReason, isBanned, userId } = restrictionDto;
  //   const banInstance = new this();
  //   banInstance.banReason = banReason;
  //   banInstance.user = { id: userId } as UserAccount;
  //   banInstance.isBanned = isBanned;
  //   banInstance.banDate = isBanned ? new Date() : null;
  //   restrictionDto.entity ? banInstance.entity = restrictionDto.entity : null;

  //   await notice.validateFields(banInstance);
  //   notice.addData(banInstance);
  //   return notice;
  // }

  async updateBanInfo(
    isBanned: boolean,
    banReason: string,
  ): Promise<LayerNoticeInterceptor<this>> {
    const notice = new LayerNoticeInterceptor<this>();
    this.isBanned = isBanned;
    this.banReason = isBanned ? banReason : null;
    this.banDate = isBanned ? new Date() : null;

    await notice.validateFields(this);
    notice.addData(this);
    return notice;
  }
}
