import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { BonLivraison } from './bon-livraison.entity';
import { BlArticle } from './bl-article.entity';
import { BlStatus } from '../common/enums/bl-status.enum';

@Injectable()
export class BonsLivraisonService {
  constructor(
    @InjectRepository(BonLivraison) private repo: Repository<BonLivraison>,
    @InjectRepository(BlArticle) private blArticleRepo: Repository<BlArticle>,
  ) {}

  findAll(companyId: string, statut?: BlStatus) {
    const where: any = { company: { id: companyId } };
    if (statut) where.statut = statut;
    return this.repo.find({
      where,
      relations: ['blArticles', 'blArticles.article', 'loadingPlan', 'societeExpeditrice', 'filiere'],
      order: { createdAt: 'DESC' },
    });
  }

  findAvailable(companyId: string) {
    return this.repo.find({
      where: { company: { id: companyId }, statut: BlStatus.VALIDATED, loadingPlan: IsNull() },
      relations: ['blArticles', 'blArticles.article', 'societeExpeditrice', 'filiere'],
    });
  }

  async findOne(id: string) {
    const bl = await this.repo.findOne({
      where: { id },
      relations: ['blArticles', 'blArticles.article', 'loadingPlan', 'company', 'societeExpeditrice', 'filiere'],
    });
    if (!bl) throw new NotFoundException('BL not found');
    return bl;
  }

  async create(dto: any, companyId: string) {
    const bl = this.repo.create({
      numeroBl: dto.numeroBl,
      clientNom: dto.clientNom,
      clientAdresse: dto.clientAdresse,
      origine: dto.origine,
      destination: dto.destination,
      typeChargement: dto.typeChargement,
      tonnageTotal: dto.tonnageTotal,
      nombrePalettes: dto.nombrePalettes ?? 0,
      datelivraison: dto.datelivraison,
      erpReference: dto.erpReference,
      notes: dto.notes,
      company: { id: companyId },
      ...(dto.societeExpediticeId ? { societeExpeditrice: { id: dto.societeExpediticeId } } : {}),
      ...(dto.filiereId ? { filiere: { id: dto.filiereId } } : {}),
    });
    const saved = await this.repo.save(bl);

    if (dto.articles?.length) {
      const blArticles = dto.articles.map((a: any) =>
        this.blArticleRepo.create({
          bonLivraison: { id: saved.id },
          article: { id: a.articleId },
          quantite: a.quantite,
          poidsTotal: a.poidsTotal,
        }),
      );
      await this.blArticleRepo.save(blArticles);
    }
    return this.findOne(saved.id);
  }

  async update(id: string, dto: any) {
    const bl = await this.findOne(id);
    if (bl.statut === BlStatus.LOADED && Object.keys(dto).some((k) => k !== 'statut')) {
      throw new BadRequestException('Cannot edit a loaded BL — only status change is allowed');
    }
    await this.repo.update(id, {
      clientNom: dto.clientNom,
      clientAdresse: dto.clientAdresse,
      origine: dto.origine,
      destination: dto.destination,
      typeChargement: dto.typeChargement,
      tonnageTotal: dto.tonnageTotal,
      nombrePalettes: dto.nombrePalettes,
      datelivraison: dto.datelivraison,
      notes: dto.notes,
      statut: dto.statut,
      ...(dto.societeExpediticeId !== undefined
        ? { societeExpeditrice: dto.societeExpediticeId ? { id: dto.societeExpediticeId } : null }
        : {}),
      ...(dto.filiereId !== undefined
        ? { filiere: dto.filiereId ? { id: dto.filiereId } : null }
        : {}),
    });
    return this.findOne(id);
  }

  async remove(id: string) {
    const bl = await this.findOne(id);
    if (bl.statut === BlStatus.LOADED) throw new BadRequestException('Cannot delete a loaded BL');
    return this.repo.remove(bl);
  }
}
