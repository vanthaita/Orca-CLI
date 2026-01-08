import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserPlan } from '../../../common/enums/user-plan.enum';
import { UserRole } from '../../../common/enums/user-role.enum';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  picture!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId!: string | null;

  @Index()
  @Column({ type: 'text', nullable: true })
  projectRefreshTokenHash!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  projectRefreshTokenExpiresAt!: Date | null;

  @Index()
  @Column({ type: 'varchar', length: 32, default: 'free' })
  plan!: UserPlan;

  @Column({ type: 'varchar', length: 32, default: 'user' })
  role!: UserRole;

  @Column({ type: 'timestamptz', nullable: true })
  planExpiresAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  teamId!: string | null;

  @Column({ type: 'int', nullable: true })
  dailyRequestLimit!: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
