import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { UserPlan } from '../../common/enums/user-plan.enum';
import { Team } from './entities/team.entity';
import { TEAM_MAX_MEMBERS } from './team.constants';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async createTeam(user: User, name: string): Promise<Team> {
    // 1. Check if user is on TEAM plan
    if (user.plan !== UserPlan.TEAM) {
      throw new ForbiddenException(
        'Only users on the TEAM plan can create a team.',
      );
    }

    // 2. Check if user is already a leader of a team
    // (Requirement: "Plan Team thì mới dc tạo Team chỉ dc tạo 1 Team tối da")
    const existingTeam = await this.teamRepo.findOne({
      where: { leaderId: user.id },
    });
    if (existingTeam) {
      throw new BadRequestException(
        'You have already created a team. You can only create one team.',
      );
    }

    // 3. Create the team
    const team = this.teamRepo.create({
      name,
      leaderId: user.id,
    });
    const savedTeam = await this.teamRepo.save(team);

    // 4. Update user's teamId (User becomes a member of their own team)
    user.teamId = savedTeam.id;
    await this.userRepo.save(user);

    return savedTeam;
  }

  async addMember(leader: User, memberEmail: string): Promise<User> {
    // 1. Get the leader's team
    const team = await this.teamRepo.findOne({
      where: { leaderId: leader.id },
      relations: ['members'],
    });

    if (!team) {
      throw new NotFoundException(
        'Team not found. You must create a team first.',
      );
    }

    // 2. Check team size limit
    if (team.members.length >= TEAM_MAX_MEMBERS) {
      throw new BadRequestException(
        `Team size limit reached. Maximum ${TEAM_MAX_MEMBERS} members allowed.`,
      );
    }

    // 3. Find the user to add
    const member = await this.userRepo.findOne({
      where: { email: memberEmail },
    });
    if (!member) {
      throw new NotFoundException(`User with email ${memberEmail} not found.`);
    }

    // 4. Check if member is already in a team
    if (member.teamId) {
      throw new BadRequestException('User is already a member of a team.');
    }

    // 5. Add member to team
    member.teamId = team.id;
    return this.userRepo.save(member);
  }

  async getMyTeam(user: User): Promise<Team | null> {
    if (!user.teamId) {
      return null;
    }
    return this.teamRepo.findOne({
      where: { id: user.teamId },
      relations: ['members', 'leader'],
    });
  }
}
