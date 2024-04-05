import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../../domain/base-entity';

@Entity()
export class TemporaryUserAccount extends BaseEntity {
  @Column()
  email: string;

  @Column()
  recovery_code: string;

  @Column()
  code_expiration_time: Date;
}
