import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SepayController, SepayIpnController } from './sepay.controller';
import { SepayService } from './sepay.service';
import { SepayTransaction } from './entities/sepay-transaction.entity';
import { User } from '../../auth/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SepayTransaction, User])],
    controllers: [SepayController, SepayIpnController],
    providers: [SepayService],
    exports: [SepayService],
})
export class SepayModule { }
