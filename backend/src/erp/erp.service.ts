import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../articles/article.entity';
import { BonLivraison } from '../bons-livraison/bon-livraison.entity';
import { BlArticle } from '../bons-livraison/bl-article.entity';
import { BlStatus } from '../common/enums/bl-status.enum';

@Injectable()
export class ErpService {
  constructor(
    @InjectRepository(Article) private artRepo: Repository<Article>,
    @InjectRepository(BonLivraison) private blRepo: Repository<BonLivraison>,
    @InjectRepository(BlArticle) private blaRepo: Repository<BlArticle>,
  ) {}

  /** Upsert articles by code — idempotent */
  async upsertArticles(articles: { code: string; libelle: string; poidsUnitaire: number; unite?: string }[]) {
    const results: { code: string; action: 'created' | 'updated' }[] = [];
    for (const dto of articles) {
      const existing = await this.artRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        await this.artRepo.update(existing.id, {
          libelle: dto.libelle,
          poidsUnitaire: dto.poidsUnitaire,
          ...(dto.unite ? { unite: dto.unite } : {}),
        });
        results.push({ code: dto.code, action: 'updated' });
      } else {
        await this.artRepo.save(this.artRepo.create({
          code: dto.code,
          libelle: dto.libelle,
          poidsUnitaire: dto.poidsUnitaire,
          unite: dto.unite || 'Unité',
        }));
        results.push({ code: dto.code, action: 'created' });
      }
    }
    return results;
  }

  /**
   * Upsert BLs from ERP.
   * Identified by erpReference. If already exists → updates metadata only (not if status >= LOADED).
   * Articles are re-created each time (delete + insert) to reflect ERP truth.
   */
  async upsertBons(
    companyId: string,
    bons: {
      erpReference: string;
      numeroBl: string;
      clientNom: string;
      clientAdresse?: string;
      origine?: string;
      destination?: string;
      typeChargement?: string;
      tonnageTotal: number;
      nombrePalettes?: number;
      datelivraison?: string;
      notes?: string;
      articles?: { code: string; quantite: number }[];
    }[],
  ) {
    const results: { erpReference: string; numeroBl: string; action: 'created' | 'updated' | 'skipped' }[] = [];

    for (const dto of bons) {
      const existing = await this.blRepo.findOne({
        where: { erpReference: dto.erpReference, company: { id: companyId } },
        relations: ['blArticles'],
      });

      if (existing) {
        if (existing.statut === BlStatus.LOADED || existing.statut === BlStatus.DELIVERED) {
          results.push({ erpReference: dto.erpReference, numeroBl: existing.numeroBl, action: 'skipped' });
          continue;
        }
        await this.blRepo.update(existing.id, {
          clientNom: dto.clientNom,
          ...(dto.clientAdresse !== undefined ? { clientAdresse: dto.clientAdresse } : {}),
          ...(dto.origine !== undefined ? { origine: dto.origine } : {}),
          ...(dto.destination !== undefined ? { destination: dto.destination } : {}),
          tonnageTotal: dto.tonnageTotal,
          ...(dto.nombrePalettes !== undefined ? { nombrePalettes: dto.nombrePalettes } : {}),
          ...(dto.datelivraison ? { datelivraison: new Date(dto.datelivraison) } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        });

        if (dto.articles?.length) {
          await this.blaRepo.delete({ bonLivraison: { id: existing.id } });
          await this.syncArticles(existing.id, dto.articles);
        }
        results.push({ erpReference: dto.erpReference, numeroBl: existing.numeroBl, action: 'updated' });
      } else {
        const bl = await this.blRepo.save(this.blRepo.create({
          numeroBl: dto.numeroBl,
          erpReference: dto.erpReference,
          clientNom: dto.clientNom,
          clientAdresse: dto.clientAdresse,
          origine: dto.origine,
          destination: dto.destination,
          typeChargement: (dto.typeChargement as any) || 'VRAC',
          tonnageTotal: dto.tonnageTotal,
          nombrePalettes: dto.nombrePalettes ?? 0,
          datelivraison: dto.datelivraison ? new Date(dto.datelivraison) : undefined,
          notes: dto.notes,
          statut: BlStatus.VALIDATED,
          company: { id: companyId },
        }));

        if (dto.articles?.length) await this.syncArticles(bl.id, dto.articles);
        results.push({ erpReference: dto.erpReference, numeroBl: dto.numeroBl, action: 'created' });
      }
    }

    return { processed: results.length, results };
  }

  private async syncArticles(blId: string, lines: { code: string; quantite: number }[]) {
    for (const line of lines) {
      const article = await this.artRepo.findOne({ where: { code: line.code } });
      if (!article) continue;
      await this.blaRepo.save(this.blaRepo.create({
        bonLivraison: { id: blId },
        article,
        quantite: line.quantite,
        poidsTotal: article.poidsUnitaire * line.quantite,
      }));
    }
  }
}
