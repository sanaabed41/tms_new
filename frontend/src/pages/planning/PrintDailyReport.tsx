import React from 'react';
import { Table, Typography, Divider } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { LoadingPlan, BonLivraison } from '../../types';

dayjs.locale('fr');

const { Title, Text } = Typography;

interface Props {
  plans: LoadingPlan[];
  date: string;
  companyNom?: string;
}

const PrintDailyReport = React.forwardRef<HTMLDivElement, Props>(({ plans, date, companyNom }, ref) => {
  const validatedPlans = plans.filter((p) => p.bonsLivraison?.length > 0);
  const totalBls = validatedPlans.reduce((s, p) => s + p.bonsLivraison.length, 0);
  const totalTonnage = validatedPlans.reduce((s, p) => s + Number(p.tonnageCharge), 0);
  const totalPalettes = validatedPlans.reduce((s, p) => s + Number(p.palettesChargees), 0);

  const blColumns = [
    { title: 'N° BL', dataIndex: 'numeroBl', key: 'num', width: 120,
      render: (v: string) => <b style={{ fontFamily: 'monospace' }}>{v}</b> },
    { title: 'Client', dataIndex: 'clientNom', key: 'client' },
    { title: 'Adresse', dataIndex: 'clientAdresse', key: 'addr',
      render: (v: string) => v || '—' },
    { title: 'Trajet', key: 'trajet',
      render: (_: any, bl: BonLivraison) => `${bl.origine || '—'} → ${bl.destination || '—'}` },
    { title: 'Type', dataIndex: 'typeChargement', key: 'type', width: 80 },
    { title: 'Tonnage', dataIndex: 'tonnageTotal', key: 't', width: 80,
      render: (v: number) => `${v} T` },
    { title: 'Palettes', dataIndex: 'nombrePalettes', key: 'p', width: 70,
      render: (v: number) => v > 0 ? v : '—' },
    { title: 'Notes', dataIndex: 'notes', key: 'notes',
      render: (v: string) => v || '—' },
  ];

  return (
    <div ref={ref} style={{ padding: 32, fontFamily: 'Arial, sans-serif', fontSize: 11 }}>
      {/* En-tête global */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #000', paddingBottom: 14, marginBottom: 20 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontSize: 22 }}>BILAN JOURNALIER DE CHARGEMENT</Title>
          <Text style={{ fontSize: 14 }}>{companyNom || 'Transport Management System'}</Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 14 }}>Date de livraison :</Text>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{dayjs(date).format('dddd DD MMMM YYYY')}</div>
          <Text type="secondary">Imprimé le {dayjs().format('DD/MM/YYYY à HH:mm')}</Text>
        </div>
      </div>

      {/* Récapitulatif global */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Camions utilisés', value: validatedPlans.length, unit: '' },
          { label: 'Bons de livraison', value: totalBls, unit: 'BL' },
          { label: 'Tonnage total', value: totalTonnage.toFixed(1), unit: 'T' },
          { label: 'Palettes totales', value: totalPalettes, unit: 'pal.' },
        ].map(({ label, value, unit }) => (
          <div key={label} style={{ border: '1.5px solid #000', padding: '10px 14px', borderRadius: 4, textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{value} <span style={{ fontSize: 12 }}>{unit}</span></div>
          </div>
        ))}
      </div>

      {/* Un bloc par camion */}
      {validatedPlans.map((plan, idx) => {
        const truck = plan.truck;
        const tonnagePct = Math.round((Number(plan.tonnageCharge) / Number(truck.capaciteTonnage)) * 100);

        return (
          <div key={plan.id} style={{ marginBottom: 32, pageBreakInside: 'avoid' }}>
            {/* Header camion */}
            <div style={{ background: '#222', color: 'white', padding: '8px 14px', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>🚛 {truck.matricule}</span>
                <span style={{ fontSize: 12 }}>{truck.deliveryCompany?.nom}</span>
                <span style={{ fontSize: 12, background: '#444', borderRadius: 3, padding: '2px 8px' }}>{truck.type}</span>
              </div>
              <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                <span>Charge : <b>{plan.tonnageCharge}T / {truck.capaciteTonnage}T ({tonnagePct}%)</b></span>
                <span>Palettes : <b>{plan.palettesChargees} / {truck.capacitePalettes}</b></span>
                <span>Réf : <b>{plan.reference}</b></span>
                {plan.isValidated && <span style={{ color: '#52c41a' }}>✓ VALIDÉ</span>}
              </div>
            </div>

            {/* Tableau BLs du camion */}
            <Table
              dataSource={plan.bonsLivraison}
              columns={blColumns}
              rowKey="id"
              pagination={false}
              size="small"
              bordered
              style={{ borderTop: 'none' }}
              summary={(rows) => {
                const sumT = rows.reduce((s, r) => s + Number(r.tonnageTotal), 0);
                const sumP = rows.reduce((s, r) => s + Number(r.nombrePalettes), 0);
                return (
                  <Table.Summary.Row style={{ background: '#fafafa' }}>
                    <Table.Summary.Cell index={0} colSpan={5}><b>Sous-total camion</b></Table.Summary.Cell>
                    <Table.Summary.Cell index={1}><b>{sumT.toFixed(1)} T</b></Table.Summary.Cell>
                    <Table.Summary.Cell index={2}><b>{sumP > 0 ? sumP : '—'}</b></Table.Summary.Cell>
                    <Table.Summary.Cell index={3} />
                  </Table.Summary.Row>
                );
              }}
            />

            {/* Ligne de signature */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 30, marginTop: 14, padding: '0 4px' }}>
              {['Responsable Logistique', 'Chauffeur', 'Réceptionnaire'].map((s) => (
                <div key={s} style={{ borderTop: '1px solid #888', paddingTop: 6, textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 10 }}>{s}</Text>
                  <div style={{ height: 40 }} />
                  <Text style={{ fontSize: 10 }}>Signature & cachet</Text>
                </div>
              ))}
            </div>

            {idx < validatedPlans.length - 1 && <Divider style={{ borderColor: '#ccc', margin: '24px 0 0' }} />}
          </div>
        );
      })}

      {validatedPlans.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
          Aucun plan de chargement pour cette date.
        </div>
      )}
    </div>
  );
});

PrintDailyReport.displayName = 'PrintDailyReport';
export default PrintDailyReport;
