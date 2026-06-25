import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quai } from './quai.entity';
import { QuaisService } from './quais.service';
import { QuaisController } from './quais.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Quai])],
  providers: [QuaisService],
  controllers: [QuaisController],
  exports: [QuaisService],
})
export class QuaisModule {}
