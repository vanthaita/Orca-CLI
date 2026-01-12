import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { UserPlan } from '../../../common/enums/user-plan.enum';

export class UpdateUserPlanDto {
  @IsEnum(UserPlan)
  plan!: UserPlan;

  @IsOptional()
  @IsDateString()
  planExpiresAt?: string | null;
}
