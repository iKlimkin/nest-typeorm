import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategyType } from '../../../../infra/enum/strategy.enum';

@Injectable()
export class GithubOauthGuard extends AuthGuard(StrategyType.Github) {}
