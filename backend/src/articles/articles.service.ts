import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Article } from './article.entity';

@Injectable()
export class ArticlesService {
  constructor(@InjectRepository(Article) private repo: Repository<Article>) {}

  findAll(search?: string) {
    if (search) {
      return this.repo.find({ where: [{ code: Like(`%${search}%`) }, { libelle: Like(`%${search}%`) }] });
    }
    return this.repo.find();
  }

  async findOne(id: string) {
    const article = await this.repo.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  create(dto: Partial<Article>) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<Article>) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string) {
    const article = await this.findOne(id);
    return this.repo.remove(article);
  }
}
