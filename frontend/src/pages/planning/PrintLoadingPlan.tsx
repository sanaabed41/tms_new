import React from 'react';
import { Table, Typography, Tag } from 'antd';
import dayjs from 'dayjs';
import { LoadingPlan, BonLivraison } from '../../types';

const { Title, Text } = Typography;

interface Props {
  plan: LoadingPlan;
}

const PrintLoadingPlan = React.forwardRef<HTMLDivElement, Props>(({ plan }, ref) => {
  const truck = plan.truck;
  const bls = plan.bonsLivraison || [];

  // Build article pivot: article rows × BL columns
  const blNums = bls.map((bl) => bl.numeroBl);
  const articleMap: Record<string, any> = {};
  for (const bl of bls) {
    for (const bla of bl.blArticles || []) {
      const key = bla.article.id;
      if (!articleMap[key]) {
        articleMap[key] = { code: bla.article.code, libelle: bla.article.libelle, unite: bla.article.unite };
        blNums.forEach((num) => { articleMap[key][num] = 0; });
      }
      articleMap[key][bl.numeroBl] += bla.quantite;
    }
  }

  const pivotData = Object.values(articleMap);
  const pivotColumns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 90 },
    { title: 'Désignation', dataIndex: 'libelle', key: 'libelle' },
    { title: 'Unité', dataIndex: 'unite', key: 'unite', width: 60 },
    ...blNums.map((num) => ({
      title: num, dataIndex: num, key: num, width: 80,
      render: (v: number) => v > 0 ? <b>{v}</b> : <span style={{ color: '#bbb' }}>—</span>,
    })),
    {
      title: 'Total', key: 'total', width: 70,
      render: (_: any, row: any) => <b>{blNums.reduce((s, n) => s + (row[n] || 0), 0)}</b>,
    },
  ];

  const blColumns = [
    {
      title: 'N° BL', dataIndex: 'numeroBl', key: 'numeroBl', width: 110,
      render: (v: string) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{v}</span>,
    },
    { title: 'Client', dataIndex: 'clientNom', key: 'clientNom' },
    {
      title: 'Trajet', key: 'trajet', width: 200,
      render: (_: any, r: BonLivraison) => (
        <span>{r.origine || '—'} → <b>{r.destination || '—'}</b></span>
      ),
    },
    {
      title: 'Expéditeur / Filière', key: 'expediteur', width: 150,
      render: (_: any, r: BonLivraison) => r.societeExpeditrice ? (
        <span>
          {r.societeExpeditrice.nom}
          {r.filiere ? <span style={{ color: '#888' }}> / {r.filiere.nom}</span> : ''}
        </span>
      ) : '—',
    },
    {
      title: 'Tonnage (T)', dataIndex: 'tonnageTotal', key: 'tonnage', width: 100,
      render: (v: number) => <b>{Number(v).toFixed(2)}</b>,
    },
    {
      title: 'Palettes', dataIndex: 'nombrePalettes', key: 'palettes', width: 80,
      render: (v: number) => truck.capacitePalettes > 0
        ? (v > 0 ? v : <span style={{ color: '#bbb' }}>—</span>)
        : <span style={{ color: '#bbb' }}>N/A</span>,
    },
  ];

  const totalTonnage = bls.reduce((s, bl) => s + Number(bl.tonnageTotal), 0);
  const totalPalettes = bls.reduce((s, bl) => s + Number(bl.nombrePalettes), 0);
  const tonnagePct = Math.round((totalTonnage / Number(truck.capaciteTonnage)) * 100);

  return (
    <div ref={ref} style={{ padding: 32, fontFamily: 'Arial, sans-serif', fontSize: 12, color: '#000' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, borderBottom: '2px solid #000', paddingBottom: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>PLAN DE CHARGE</Title>
          <Text>Référence : <b>{plan.reference}</b></Text>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Text>Date de livraison : <b>{dayjs(plan.dateLivraison).format('dddd DD MMMM YYYY')}</b></Text><br />
          <Text>Imprimé le : {dayjs().format('DD/MM/YYYY HH:mm')}</Text><br />
          {plan.isValidated && plan.validatedBy && (
            <Text>Validé par : <b>{plan.validatedBy.prenom} {plan.validatedBy.nom}</b></Text>
          )}
          {!plan.isValidated && <Tag color="warning" style={{ marginTop: 4 }}>Non validé</Tag>}
        </div>
      </div>

      {/* ── Truck info ── */}
      <div style={{ background: '#f5f5f5', padding: '10px 14px', borderRadius: 4, marginBottom: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ color: '#666', fontSize: 11 }}>Matricule</div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{truck.matricule}</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: 11 }}>Société de livraison</div>
          <div style={{ fontWeight: 600 }}>{truck.deliveryCompany?.nom || '—'}</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: 11 }}>Capacité tonnage</div>
          <div style={{ fontWeight: 600 }}>{truck.capaciteTonnage} T</div>
        </div>
        <div>
          <div style={{ color: '#666', fontSize: 11 }}>Capacité palettes</div>
          <div style={{ fontWeight: 600 }}>{truck.capacitePalettes > 0 ? truck.capacitePalettes : 'Sans palette'}</div>
        </div>
      </div>

      {/* ── Load summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: truck.capacitePalettes > 0 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ border: '1.5px solid #ddd', padding: '10px 14px', borderRadius: 4 }}>
          <div style={{ color: '#666', fontSize: 11 }}>Tonnage chargé</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: tonnagePct > 90 ? '#ff4d4f' : '#000' }}>
            {Number(plan.tonnageCharge).toFixed(2)} T
          </div>
          <div style={{ color: '#888', fontSize: 11 }}>{tonnagePct}% de {truck.capaciteTonnage} T</div>
        </div>
        {truck.capacitePalettes > 0 && (
          <div style={{ border: '1.5px solid #ddd', padding: '10px 14px', borderRadius: 4 }}>
            <div style={{ color: '#666', fontSize: 11 }}>Palettes chargées</div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{plan.palettesChargees}</div>
            <div style={{ color: '#888', fontSize: 11 }}>sur {truck.capacitePalettes} max</div>
          </div>
        )}
        <div style={{ border: '1.5px solid #ddd', padding: '10px 14px', borderRadius: 4 }}>
          <div style={{ color: '#666', fontSize: 11 }}>Nombre de BL</div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>{bls.length}</div>
          <div style={{ color: '#888', fontSize: 11 }}>bon{bls.length > 1 ? 's' : ''} de livraison</div>
        </div>
      </div>

      {/* ── BL list ── */}
      <Title level={5} style={{ marginBottom: 6 }}>Liste des Bons de Livraison</Title>
      <Table
        dataSource={bls}
        columns={blColumns}
        rowKey="id"
        pagination={false}
        size="small"
        bordered
        style={{ marginBottom: 20 }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={4}><b>Total</b></Table.Summary.Cell>
            <Table.Summary.Cell index={1}><b>{totalTonnage.toFixed(2)} T</b></Table.Summary.Cell>
            <Table.Summary.Cell index={2}>
              {truck.capacitePalettes > 0 ? <b>{totalPalettes}</b> : '—'}
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />

      {/* ── Article pivot ── */}
      {pivotData.length > 0 && (
        <>
          <Title level={5} style={{ marginBottom: 6 }}>Détail Articles par BL</Title>
          <Table
            dataSource={pivotData}
            columns={pivotColumns}
            rowKey="code"
            pagination={false}
            size="small"
            bordered
            style={{ marginBottom: 20 }}
          />
        </>
      )}

      {/* ── Signatures ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40, marginTop: 40, pageBreakInside: 'avoid' }}>
        <div style={{ borderTop: '1.5px solid #000', paddingTop: 8, textAlign: 'center' }}>
          <div style={{ color: '#666', fontSize: 11, marginBottom: 8 }}>Responsable Logistique</div>
          {plan.signature ? (
            <img src={plan.signature} alt="Signature" style={{ maxHeight: 70, maxWidth: '90%', display: 'block', margin: '0 auto 4px' }} />
          ) : (
            <div style={{ height: 60 }} />
          )}
          <div style={{ borderTop: '1px dashed #999', paddingTop: 4, fontSize: 10, color: '#999' }}>
            Signature & cachet
          </div>
        </div>
        {['Chauffeur', 'Réceptionnaire'].map((label) => (
          <div key={label} style={{ borderTop: '1.5px solid #000', paddingTop: 8, textAlign: 'center' }}>
            <div style={{ color: '#666', fontSize: 11, marginBottom: 60 }}>{label}</div>
            <div style={{ borderTop: '1px dashed #999', paddingTop: 4, fontSize: 10, color: '#999' }}>
              Signature & cachet
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

PrintLoadingPlan.displayName = 'PrintLoadingPlan';
export default PrintLoadingPlan;
