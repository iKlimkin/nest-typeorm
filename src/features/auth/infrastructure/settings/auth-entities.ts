import { UserAccount } from '../../../admin/domain/entities/user-account.entity';
import { UserSession } from '../../../security/domain/entities/security.entity';
import { TemporaryUserAccount } from '../../domain/entities/temp-account.entity';

export const authEntities = [UserAccount, UserSession, TemporaryUserAccount];
