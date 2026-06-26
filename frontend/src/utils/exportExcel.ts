import * as XLSX from 'xlsx';

export function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function autoWidth(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
  const cols = data[0]?.length ?? 0;
  const widths: number[] = Array(cols).fill(10);
  data.forEach((row) => {
    row.forEach((cell, i) => {
      const len = String(cell ?? '').length;
      if (len > widths[i]) widths[i] = Math.min(len + 2, 50);
    });
  });
  ws['!cols'] = widths.map((w) => ({ wch: w }));
}

// ─── Planning journalier ──────────────────────────────────────────────────────
export function exportPlanning(plans: any[], date: string, companyNom?: string) {
  const wb = XLSX.utils.book_new();

  // Feuille 1 — Récapitulatif camions
  const recap = plans
    .filter((p) => p.bonsLivraison?.length > 0)
    .map((p) => ({
      'Référence': p.reference,
      'Matricule': p.truck?.matricule ?? '',
      'Société transport': p.truck?.deliveryCompany?.nom ?? '',
      'Type': p.truck?.type ?? '',
      'Capacité (T)': p.truck?.capaciteTonnage ?? '',
      'Chargé (T)': Number(p.tonnageCharge).toFixed(2),
      'Remplissage %': p.truck?.capaciteTonnage
        ? Math.round((p.tonnageCharge / p.truck.capaciteTonnage) * 100)
        : '',
      'Palettes': p.palettesChargees || '',
      'Nb BL': p.bonsLivraison?.length ?? 0,
      'Statut': p.isValidated ? 'Validé' : 'En attente',
      'Validé par': p.validatedBy
        ? `${p.validatedBy.prenom} ${p.validatedBy.nom}`
        : '',
    }));

  const ws1 = XLSX.utils.json_to_sheet(recap);
  autoWidth(ws1);
  XLSX.utils.book_append_sheet(wb, ws1, 'Récapitulatif');

  // Feuille 2 — Détail BLs
  const rows: any[] = [];
  plans
    .filter((p) => p.bonsLivraison?.length > 0)
    .forEach((p) => {
      (p.bonsLivraison ?? []).forEach((bl: any) => {
        rows.push({
          'Camion': p.truck?.matricule ?? '',
          'Société transport': p.truck?.deliveryCompany?.nom ?? '',
          'N° BL': bl.numeroBl,
          'Client': bl.clientNom,
          'Adresse client': bl.clientAdresse ?? '',
          'Origine': bl.origine ?? '',
          'Destination': bl.destination ?? '',
          'Expéditeur': bl.societeExpeditrice?.nom ?? '',
          'Filière': bl.filiere?.nom ?? '',
          'Type chargement': bl.typeChargement,
          'Tonnage (T)': Number(bl.tonnageTotal).toFixed(2),
          'Palettes': bl.nombrePalettes || '',
          'Statut plan': p.isValidated ? 'Validé' : 'En attente',
        });
      });
    });

  const ws2 = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws2);
  XLSX.utils.book_append_sheet(wb, ws2, 'Détail BLs');

  // Feuille 3 — Par destination
  const byDest: Record<string, { bls: number; tonnage: number; clients: string[] }> = {};
  rows.forEach((r) => {
    const d = r['Destination'] || 'Non défini';
    if (!byDest[d]) byDest[d] = { bls: 0, tonnage: 0, clients: [] };
    byDest[d].bls++;
    byDest[d].tonnage += parseFloat(r['Tonnage (T)']);
    if (!byDest[d].clients.includes(r['Client'])) byDest[d].clients.push(r['Client']);
  });
  const destRows = Object.entries(byDest)
    .sort(([, a], [, b]) => b.tonnage - a.tonnage)
    .map(([dest, v]) => ({
      'Destination': dest,
      'Nb BL': v.bls,
      'Tonnage total (T)': v.tonnage.toFixed(2),
      'Nb clients': v.clients.length,
    }));
  const ws3 = XLSX.utils.json_to_sheet(destRows);
  autoWidth(ws3);
  XLSX.utils.book_append_sheet(wb, ws3, 'Par destination');

  const label = date.replace(/-/g, '');
  const company = companyNom ? `_${companyNom.replace(/\s+/g, '_')}` : '';
  downloadWorkbook(wb, `Planning_${label}${company}`);
}

// ─── Bons de Livraison ────────────────────────────────────────────────────────
export function exportBonsLivraison(bls: any[], label = 'BonsLivraison') {
  const wb = XLSX.utils.book_new();

  const rows = bls.map((bl) => ({
    'N° BL': bl.numeroBl,
    'Statut': bl.statut,
    'Client': bl.clientNom,
    'Adresse client': bl.clientAdresse ?? '',
    'Origine': bl.origine ?? '',
    'Destination': bl.destination ?? '',
    'Expéditeur': bl.societeExpeditrice?.nom ?? '',
    'Filière': bl.filiere?.nom ?? '',
    'Type chargement': bl.typeChargement,
    'Tonnage (T)': Number(bl.tonnageTotal).toFixed(2),
    'Palettes': bl.nombrePalettes || '',
    'Date livraison': bl.datelivraison
      ? new Date(bl.datelivraison).toLocaleDateString('fr-TN')
      : '',
    'Notes': bl.notes ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws);
  XLSX.utils.book_append_sheet(wb, ws, 'Bons de Livraison');
  downloadWorkbook(wb, `${label}_${new Date().toISOString().split('T')[0]}`);
}
