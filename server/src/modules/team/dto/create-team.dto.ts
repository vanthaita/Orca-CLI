import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TEAM_NAME_MAX_LENGTH } from '../team.constants';

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(TEAM_NAME_MAX_LENGTH)
  name!: string;
}
