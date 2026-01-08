import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { UserPlan } from '../../../../common/enums/user-plan.enum';

export enum TransactionStatus {
    PENDING = 'pending',
    PROCESSED = 'processed',
    FAILED = 'failed',
}

@Entity({ name: 'sepay_transactions' })
export class SepayTransaction {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 100, unique: true })
    sepayId!: string;

    @Column({ type: 'varchar', length: 100 })
    gateway!: string;

    @Column({ type: 'timestamptz' })
    transactionDate!: Date;

    @Column({ type: 'varchar', length: 50 })
    accountNumber!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'varchar', length: 10 })
    transferType!: string;

    @Column({ type: 'bigint' })
    transferAmount!: number;

    @Column({ type: 'varchar', length: 100, nullable: true })
    referenceCode!: string | null;

    @Index()
    @Column({ type: 'uuid', nullable: true })
    userId!: string | null;

    @Column({ type: 'varchar', length: 32, nullable: true })
    planUpgrade!: UserPlan | null;

    @Column({ type: 'varchar', length: 10, nullable: true })
    duration!: string | null;

    @Index()
    @Column({ type: 'varchar', length: 20, default: TransactionStatus.PENDING })
    status!: TransactionStatus;

    @Column({ type: 'text', nullable: true })
    errorMessage!: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt!: Date;
}
