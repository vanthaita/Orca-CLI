import { User } from '../entities/user.entity';
import { UserPlan } from '../../../common/enums/user-plan.enum';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * Safe DTO for user responses.
 * Only includes fields that are safe to expose to clients.
 * Excludes sensitive fields like tokens, API keys, and internal identifiers.
 */
export class UserResponseDto {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  plan: UserPlan;
  role: UserRole;
  planExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: User) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.picture = user.picture;
    this.plan = user.plan;
    this.role = user.role;
    this.planExpiresAt = user.planExpiresAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  /**
   * Convert array of User entities to UserResponseDto array
   */
  static fromArray(users: User[]): UserResponseDto[] {
    return users.map((user) => new UserResponseDto(user));
  }
}
