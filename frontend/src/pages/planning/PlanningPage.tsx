import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  DndContext, DragOverlay, DragStartEvent, DragEndEvent,
  pointerWithin, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  Row, Col, Card, DatePicker, Typography, Spin, Empty, Badge, message,
  Divider, Tag, Button, Tooltip, Input, Select, Collapse, Space,
  Popconfirm, notification, Segmented, Modal, Checkbox,
} from 'antd';
import {
  FileTextOutlined, EnvironmentOutlined, PrinterOutlined,
  SearchOutlined, FilterOutlined, TruckOutlined, TeamOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, WarningOutlined,
  ApartmentOutlined, PlusSquareOutlined, MinusSquareOutlined,
  CaretRightOutlined, CaretDownOutlined, FileExcelOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { exportPlanning } from '../../utils/exportExcel';
import dayjs from 'dayjs';
import { arrayMove } from '@dnd-kit/sortable';
import { loadingPlansAPI, blAPI, trucksAPI, truckAvailabilityAPI } from '../../api';
import { BonLivraison, LoadingPlan, Truck, TruckAvailability } from '../../types';
import BLCard, { BLCardContent, getDestinationColor } from './BLCard';
import TruckColumn from './TruckColumn';
import TruckViewDrawer from './TruckViewDrawer';
import PrintLoadingPlan from './PrintLoadingPlan';
import PrintDailyReport from './PrintDailyReport';
import { useReactToPrint } from 'react-to-print';
import { useDroppable } from '@dnd-kit/core';
import { useAuth } from '../../contexts/AuthContext';
import BlDetailDrawer from '../bons-livraison/BlDetailDrawer';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const BL_PAGE_SIZE = 40;

// ──────────────────────────────────────────────────────────────────────────────
// BL droppable zone — supports grouping by destination or by expéditeur/filière
// ──────────────────────────────────────────────────────────────────────────────
const AvailableZone: React.FC<{
  bls: BonLivraison[];
  page: number;
  groupBy: 'destination' | 'expediteur';
  onBlClick: (bl: BonLivraison) => void;
}> = ({ bls, page, groupBy, onBlClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'available-zone' });
  const visible = bls.slice(0, page * BL_PAGE_SIZE);

  // Track what's OPEN — empty = all closed by default
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedSocs, setExpandedSocs] = useState<Set<string>>(new Set());

  // Reset to all-closed when groupBy changes
  useEffect(() => { setExpanded(new Set()); setExpandedSocs(new Set()); }, [groupBy]);

  const toggleKey = (key: string, soc = false) => {
    const setter = soc ? setExpandedSocs : setExpanded;
    setter((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  // ── Group by destination → société → filière
  const destGroups = useMemo(() => {
    if (groupBy !== 'destination') return [];
    const map: Record<string, Record<string, { label: string; color: string; filieres: Record<string, { label: string; bls: BonLivraison[] }> }>> = {};
    visible.forEach((bl) => {
      const dest = bl.destination || 'Non défini';
      const expId = bl.societeExpeditrice?.id || '__none__';
      const expLabel = bl.societeExpeditrice?.nom || 'Sans expéditeur';
      const expColor = bl.societeExpeditrice?.couleur || '#8c8c8c';
      const filId = bl.filiere?.id || '__none__';
      const filLabel = bl.filiere?.nom || '';
      if (!map[dest]) map[dest] = {};
      if (!map[dest][expId]) map[dest][expId] = { label: expLabel, color: expColor, filieres: {} };
      if (!map[dest][expId].filieres[filId]) map[dest][expId].filieres[filId] = { label: filLabel, bls: [] };
      map[dest][expId].filieres[filId].bls.push(bl);
    });
    const sumDest = (exps: typeof map[string]) =>
      Object.values(exps).reduce((s, e) =>
        s + Object.values(e.filieres).reduce((ss, f) =>
          ss + f.bls.reduce((sss: number, bl: BonLivraison) => sss + Number(bl.tonnageTotal), 0), 0), 0);
    return Object.entries(map).sort(([, a], [, b]) => sumDest(b) - sumDest(a));
  }, [visible, groupBy]);

  // ── Group by expéditeur → filière
  const expGroups = useMemo(() => {
    if (groupBy !== 'expediteur') return [];
    const map: Record<string, { label: string; color: string; filieres: Record<string, { label: string; bls: BonLivraison[] }> }> = {};
    visible.forEach((bl) => {
      const expId = bl.societeExpeditrice?.id || '__none__';
      const expLabel = bl.societeExpeditrice?.nom || 'Sans expéditeur';
      const expColor = bl.societeExpeditrice?.couleur || '#8c8c8c';
      const filId = bl.filiere?.id || '__none__';
      const filLabel = bl.filiere?.nom || 'Sans filière';
      if (!map[expId]) map[expId] = { label: expLabel, color: expColor, filieres: {} };
      if (!map[expId].filieres[filId]) map[expId].filieres[filId] = { label: filLabel, bls: [] };
      map[expId].filieres[filId].bls.push(bl);
    });
    return Object.entries(map).sort(([, a], [, b]) => a.label.localeCompare(b.label));
  }, [visible, groupBy]);

  // ── Expand / collapse all logic
  const topKeys = groupBy === 'destination' ? destGroups.map(([d]) => d) : expGroups.map(([id]) => id);
  const allOpen = topKeys.length > 0 && topKeys.every((k) => expanded.has(k));

  const toggleAll = () => {
    if (allOpen) {
      setExpanded(new Set());
      setExpandedSocs(new Set());
    } else {
      setExpanded(new Set(topKeys));
      if (groupBy === 'destination') {
        const socKeys = destGroups.flatMap(([dest, exps]) =>
          Object.keys(exps).map((expId) => `${dest}::${expId}`),
        );
        setExpandedSocs(new Set(socKeys));
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 200, padding: 4, borderRadius: 6,
        border: isOver ? '1.5px dashed #1890ff' : '1.5px dashed transparent',
        background: isOver ? '#f0f8ff' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      {bls.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ fontSize: 12, color: '#bfbfbf' }}>Aucun BL disponible</span>}
          style={{ margin: '40px 0' }}
        />
      ) : (
        <>
          {/* ── Barre expand/collapse all ── */}
          {topKeys.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
              <Button
                type="link"
                size="small"
                icon={allOpen ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
                onClick={toggleAll}
                style={{ fontSize: 11, padding: '0 2px', height: 20, color: '#8c8c8c' }}
              >
                {allOpen ? 'Tout replier' : 'Tout déplier'}
              </Button>
            </div>
          )}

          {groupBy === 'destination' ? (
            destGroups.map(([dest, exps]) => {
              const destColor = getDestinationColor(dest);
              const allBls = Object.values(exps).flatMap((e) => Object.values(e.filieres).flatMap((f) => f.bls));
              const totalT = allBls.reduce((s: number, bl: BonLivraison) => s + Number(bl.tonnageTotal), 0);
              const expEntries = Object.entries(exps).sort(([, a], [, b]) => a.label.localeCompare(b.label));
              const isOpen = expanded.has(dest);
              return (
                <div key={dest} style={{ marginBottom: 6 }}>
                  {/* ── Niveau 1 : Destination ── */}
                  <div
                    onClick={() => toggleKey(dest)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
                      background: destColor + '12', borderLeft: `3px solid ${destColor}`,
                      userSelect: 'none', marginBottom: isOpen ? 5 : 0,
                    }}
                  >
                    {isOpen
                      ? <CaretDownOutlined style={{ color: destColor, fontSize: 10 }} />
                      : <CaretRightOutlined style={{ color: destColor, fontSize: 10 }} />
                    }
                    <EnvironmentOutlined style={{ color: destColor, fontSize: 11 }} />
                    <Tag color={destColor} style={{ fontWeight: 700, fontSize: 11, margin: 0 }}>{dest}</Tag>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                      {allBls.length} BL · {totalT.toFixed(1)} T
                    </Text>
                  </div>

                  {/* ── Niveau 2 : Sociétés expéditrices ── */}
                  {isOpen && expEntries.map(([expId, expGroup]) => {
                    const filEntries = Object.entries(expGroup.filieres);
                    const expBls = filEntries.flatMap(([, f]) => f.bls);
                    const expT = expBls.reduce((s: number, bl: BonLivraison) => s + Number(bl.tonnageTotal), 0);
                    const hasFiliere = filEntries.some(([fid]) => fid !== '__none__');
                    const socKey = `${dest}::${expId}`;
                    const isSocOpen = expandedSocs.has(socKey);
                    return (
                      <div key={expId} style={{ marginBottom: 4, paddingLeft: 10 }}>
                        {expId !== '__none__' ? (
                          <div
                            onClick={() => toggleKey(socKey, true)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '3px 6px', borderRadius: 4, cursor: 'pointer',
                              background: expGroup.color + '15', borderLeft: `2px solid ${expGroup.color}`,
                              userSelect: 'none', marginBottom: isSocOpen ? 4 : 0,
                            }}
                          >
                            {isSocOpen
                              ? <CaretDownOutlined style={{ color: expGroup.color, fontSize: 9 }} />
                              : <CaretRightOutlined style={{ color: expGroup.color, fontSize: 9 }} />
                            }
                            <ApartmentOutlined style={{ color: expGroup.color, fontSize: 10 }} />
                            <Text strong style={{ fontSize: 11, color: expGroup.color, flex: 1 }}>{expGroup.label}</Text>
                            <Text type="secondary" style={{ fontSize: 10 }}>{expBls.length} BL · {expT.toFixed(1)} T</Text>
                          </div>
                        ) : null}

                        {/* ── Niveau 3 : Filières + BLs ── */}
                        {(expId === '__none__' || isSocOpen) && filEntries.map(([filId, filGroup]) => (
                          <div key={filId} style={{ paddingLeft: expId !== '__none__' && hasFiliere ? 12 : expId !== '__none__' ? 10 : 0 }}>
                            {filId !== '__none__' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, marginTop: 2 }}>
                                <Tag style={{
                                  fontSize: 10, margin: 0, padding: '0 5px',
                                  background: expGroup.color + '18', color: expGroup.color,
                                  borderColor: expGroup.color + '50',
                                }}>
                                  {filGroup.label}
                                </Tag>
                                <Text type="secondary" style={{ fontSize: 10 }}>{filGroup.bls.length} BL</Text>
                              </div>
                            )}
                            {filGroup.bls.map((bl) => (
                              <div key={bl.id} onDoubleClick={() => onBlClick(bl)}><BLCard bl={bl} /></div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  {isOpen && <Divider style={{ margin: '5px 0' }} />}
                </div>
              );
            })
          ) : (
            expGroups.map(([expId, expGroup]) => {
              const filieres = Object.entries(expGroup.filieres);
              const totalBls = filieres.reduce((s, [, f]) => s + f.bls.length, 0);
              const totalT = filieres.reduce((s, [, f]) => s + f.bls.reduce((ss, bl) => ss + Number(bl.tonnageTotal), 0), 0);
              const isOpen = expanded.has(expId);
              return (
                <div key={expId} style={{ marginBottom: 8 }}>
                  {/* ── Niveau 1 : Expéditeur ── */}
                  <div
                    onClick={() => toggleKey(expId)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 6px', marginBottom: isOpen ? 5 : 0,
                      background: expGroup.color + '18', borderRadius: 6,
                      borderLeft: `3px solid ${expGroup.color}`,
                      cursor: 'pointer', userSelect: 'none',
                    }}
                  >
                    {isOpen
                      ? <CaretDownOutlined style={{ color: expGroup.color, fontSize: 10 }} />
                      : <CaretRightOutlined style={{ color: expGroup.color, fontSize: 10 }} />
                    }
                    <ApartmentOutlined style={{ color: expGroup.color, fontSize: 12 }} />
                    <Text strong style={{ fontSize: 12, color: expGroup.color }}>{expGroup.label}</Text>
                    <Text type="secondary" style={{ fontSize: 10, marginLeft: 'auto' }}>
                      {totalBls} BL · {totalT.toFixed(1)} T
                    </Text>
                  </div>
                  {/* ── Niveau 2 : Filières + BLs ── */}
                  {isOpen && filieres.map(([filId, filGroup]) => (
                    <div key={filId} style={{ marginBottom: 5, paddingLeft: 10 }}>
                      {filId !== '__none__' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <Tag style={{
                            fontSize: 10, margin: 0, padding: '0 6px',
                            background: expGroup.color + '15', color: expGroup.color,
                            borderColor: expGroup.color + '50',
                          }}>
                            {filGroup.label}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: 10 }}>{filGroup.bls.length} BL</Text>
                        </div>
                      )}
                      {filGroup.bls.map((bl) => (
                        <div key={bl.id} onDoubleClick={() => onBlClick(bl)}><BLCard bl={bl} /></div>
                      ))}
                    </div>
                  ))}
                  {isOpen && <Divider style={{ margin: '5px 0' }} />}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
};

// Détecte si la liste de BLs a des filières entrelacées (ex: AMT, MCSR, AMT)
function hasInterleavingFilieres(bls: BonLivraison[]): boolean {
  const closed = new Set<string>();
  let last: string | null = null;
  for (const bl of bls) {
    const f = bl.filiere?.id ?? '__none__';
    if (f !== last) {
      if (last !== null) closed.add(last);
      if (closed.has(f)) return true;
      last = f;
    }
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main planning page
// ──────────────────────────────────────────────────────────────────────────────
const PlanningPage: React.FC = () => {
  const [plans, setPlans] = useState<LoadingPlan[]>([]);
  const [availableBls, setAvailableBls] = useState<BonLivraison[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [activeBl, setActiveBl] = useState<BonLivraison | null>(null);
  const [printPlan, setPrintPlan] = useState<LoadingPlan | null>(null);
  const [detailBl, setDetailBl] = useState<BonLivraison | null>(null);
  const [viewPlan, setViewPlan] = useState<LoadingPlan | null>(null);
  const [availabilities, setAvailabilities] = useState<TruckAvailability[]>([]);
  const [availModalOpen, setAvailModalOpen] = useState(false);
  const [availSelected, setAvailSelected] = useState<string[]>([]);
  const [availSaving, setAvailSaving] = useState(false);
  const [openCompanies, setOpenCompanies] = useState<string[]>([]);
  const [blPage, setBlPage] = useState(1);
  const [blGroupBy, setBlGroupBy] = useState<'destination' | 'expediteur'>('destination');

  // BL panel filters
  const [blSearch, setBlSearch] = useState('');
  const [blDestFilter, setBlDestFilter] = useState<string | null>(null);
  const [blExpFilter, setBlExpFilter] = useState<string | null>(null);

  // BL sort — alphabetical by destination (localStorage persisted)
  const [autoSort, setAutoSort] = useState<boolean>(() => {
    try { return localStorage.getItem('tms_bl_autosort') !== 'false'; } catch { return true; }
  });
  const toggleAutoSort = () => {
    setAutoSort((prev) => {
      const next = !prev;
      try { localStorage.setItem('tms_bl_autosort', String(next)); } catch { /* */ }
      return next;
    });
  };

  // Config globale ordre BLs (localStorage persisted)
  type BlOrderMode    = 'libre' | 'grouper_filiere';
  type BlOrderEnforce = 'avertir' | 'confirmer' | 'bloquer';
  const [blOrderMode, setBlOrderMode] = useState<BlOrderMode>(() => {
    try { return (localStorage.getItem('tms_bl_order_mode') as BlOrderMode) || 'libre'; } catch { return 'libre'; }
  });
  const [blOrderEnforce, setBlOrderEnforce] = useState<BlOrderEnforce>(() => {
    try { return (localStorage.getItem('tms_bl_order_enforce') as BlOrderEnforce) || 'avertir'; } catch { return 'avertir'; }
  });
  const saveBlOrderMode = (mode: BlOrderMode) => {
    setBlOrderMode(mode);
    try { localStorage.setItem('tms_bl_order_mode', mode); } catch { /* */ }
  };
  const saveBlOrderEnforce = (enforce: BlOrderEnforce) => {
    setBlOrderEnforce(enforce);
    try { localStorage.setItem('tms_bl_order_enforce', enforce); } catch { /* */ }
  };

  // Truck panel filters
  const [truckSearch, setTruckSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);

  // Signature modal
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [sigPlanId, setSigPlanId] = useState<string | 'all' | null>(null);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigDrawingRef = useRef(false);
  const sigLastPosRef = useRef<{ x: number; y: number } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const dailyPrintRef = useRef<HTMLDivElement>(null);
  const companyPrintRef = useRef<HTMLDivElement>(null);
  const blListRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: printRef });
  const handlePrintDaily = useReactToPrint({ contentRef: dailyPrintRef });
  const handleCompanyPrint = useReactToPrint({ contentRef: companyPrintRef });

  const [printCompanyPlans, setPrintCompanyPlans] = useState<LoadingPlan[]>([]);
  const [printCompanyNom, setPrintCompanyNom] = useState('');
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [plansRes, blsRes, trucksRes, availRes] = await Promise.all([
        loadingPlansAPI.getAll(selectedDate),
        blAPI.getAvailable(),
        trucksAPI.getAll(),
        truckAvailabilityAPI.getByDate(selectedDate),
      ]);
      setPlans(plansRes.data);
      setAvailableBls(blsRes.data);
      setTrucks(trucksRes.data.filter((t: Truck) => t.isActive));
      setAvailabilities(availRes.data);
    } finally {
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setBlPage(1); }, [blSearch, blDestFilter, blExpFilter, blGroupBy]);
  useEffect(() => {
    if (sigModalOpen) setTimeout(() => clearSig(), 50);
  }, [sigModalOpen]);

  // ── Derived: unique destinations
  const destinations = useMemo(() => {
    const seen: Record<string, true> = {};
    availableBls.forEach((bl) => { if (bl.destination) seen[bl.destination] = true; });
    return Object.keys(seen).sort();
  }, [availableBls]);

  // ── Derived: unique expéditeurs from BLs
  const expediteurs = useMemo(() => {
    const seen: Record<string, { nom: string; couleur: string }> = {};
    availableBls.forEach((bl) => {
      if (bl.societeExpeditrice) seen[bl.societeExpeditrice.id] = { nom: bl.societeExpeditrice.nom, couleur: bl.societeExpeditrice.couleur };
    });
    return Object.entries(seen).map(([id, v]) => ({ id, ...v })).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [availableBls]);

  // ── Derived: unique delivery companies
  const deliveryCompanies = useMemo(() => {
    const seen: Record<string, string> = {};
    trucks.forEach((t) => { if (t.deliveryCompany) seen[t.deliveryCompany.id] = t.deliveryCompany.nom; });
    return Object.entries(seen).map(([id, nom]) => ({ id, nom })).sort((a, b) => a.nom.localeCompare(b.nom));
  }, [trucks]);

  // ── Filtered BLs (with optional auto-sort: group by filière then destination)
  const filteredBls = useMemo(() => {
    const q = blSearch.trim().toLowerCase();
    const filtered = availableBls.filter((bl) => {
      const matchSearch = !q ||
        bl.numeroBl.toLowerCase().includes(q) ||
        bl.clientNom.toLowerCase().includes(q) ||
        (bl.destination || '').toLowerCase().includes(q) ||
        (bl.origine || '').toLowerCase().includes(q) ||
        (bl.societeExpeditrice?.nom || '').toLowerCase().includes(q) ||
        (bl.filiere?.nom || '').toLowerCase().includes(q);
      const matchDest = !blDestFilter || bl.destination === blDestFilter;
      const matchExp = !blExpFilter || bl.societeExpeditrice?.id === blExpFilter;
      return matchSearch && matchDest && matchExp;
    });
    if (!autoSort) return filtered;
    // Auto-sort: ordre alphabétique par destination
    return [...filtered].sort((a, b) =>
      (a.destination ?? '').localeCompare(b.destination ?? ''),
    );
  }, [availableBls, blSearch, blDestFilter, blExpFilter, autoSort]);

  const filteredBlTonnage = useMemo(
    () => filteredBls.reduce((s, bl) => s + Number(bl.tonnageTotal), 0),
    [filteredBls],
  );

  // ── Filtered trucks grouped by delivery company (tous les camions actifs)
  const trucksByCompany = useMemo(() => {
    const q = truckSearch.trim().toLowerCase();
    const filtered = trucks.filter((t) => {
      const matchSearch = !q ||
        t.matricule.toLowerCase().includes(q) ||
        (t.type || '').toLowerCase().includes(q) ||
        (t.deliveryCompany?.nom || '').toLowerCase().includes(q);
      const matchCompany = !companyFilter || t.deliveryCompany?.id === companyFilter;
      return matchSearch && matchCompany;
    });
    const groups: Record<string, { nom: string; trucks: Truck[] }> = {};
    filtered.forEach((t) => {
      const key = t.deliveryCompany?.id || '__unknown__';
      const nom = t.deliveryCompany?.nom || 'Société inconnue';
      if (!groups[key]) groups[key] = { nom, trucks: [] };
      groups[key].trucks.push(t);
    });
    return Object.entries(groups).sort(([, a], [, b]) => a.nom.localeCompare(b.nom));
  }, [trucks, truckSearch, companyFilter]);

  // ── Plan helpers
  const getPlanForTruck = (truckId: string) => plans.find((p) => p.truck?.id === truckId);
  const getPlanContainingBl = (blId: string) =>
    plans.find((p) => p.bonsLivraison?.some((b) => b.id === blId));

  // ── Force-assign after capacity warning
  const forceAssign = async (planId: string, blId: string, draggedBl: BonLivraison | undefined) => {
    try {
      await loadingPlansAPI.assignBl(planId, blId, true);
      message.success('BL chargé (surcharge acceptée)');
    } catch {
      if (draggedBl) setAvailableBls((prev) => [...prev, draggedBl]);
      message.error('Erreur lors du chargement forcé');
    }
    fetchData();
  };

  const handleDragStart = (event: DragStartEvent) => {
    const blId = event.active.id as string;
    const bl =
      availableBls.find((b) => b.id === blId) ||
      plans.flatMap((p) => p.bonsLivraison || []).find((b) => b.id === blId);
    setActiveBl(bl || null);
  };

  // ── Transfer BL to a truck (from available zone OR from another truck) ─────
  const transferBl = async (
    blId: string,
    targetTruckId: string,
    sourcePlan: LoadingPlan | undefined,
    draggedBl: BonLivraison | undefined,
  ) => {
    // ── Contrôle entrelacement filières AVANT suppression optimiste ──────────
    let targetPlan = getPlanForTruck(targetTruckId);
    if (blOrderMode === 'grouper_filiere' && draggedBl && targetPlan && (targetPlan.bonsLivraison?.length ?? 0) > 0) {
      const existingBls = targetPlan.bonsLivraison ?? [];
      const simulatedList = [...existingBls, draggedBl];
      const mismatch = hasInterleavingFilieres(simulatedList);
      if (mismatch) {
        if (blOrderEnforce === 'bloquer') {
          message.error(`Chargement refusé : ce BL s'intercale entre des BLs d'une autre filière (entrelaçage interdit).`);
          return;
        }
        if (blOrderEnforce === 'confirmer') {
          const proceed = await new Promise<boolean>((resolve) => {
            Modal.confirm({
              title: 'Entrelaçage de filières détecté',
              content: `Ce BL va s'intercaler entre des BLs d'une autre filière dans ce camion. Autoriser quand même ?`,
              okText: 'Oui, charger quand même',
              cancelText: 'Non, annuler',
              okButtonProps: { danger: true },
              onOk:    () => resolve(true),
              onCancel: () => resolve(false),
            });
          });
          if (!proceed) return;
        } else {
          message.warning(`Attention : ce BL s'intercale entre des BLs d'une autre filière`);
        }
      }
    }

    if (draggedBl) setAvailableBls((prev) => prev.filter((b) => b.id !== blId));
    if (sourcePlan) await loadingPlansAPI.removeBl(sourcePlan.id, blId);

    if (!targetPlan) {
      try {
        const res = await loadingPlansAPI.create({ truckId: targetTruckId, dateLivraison: selectedDate });
        targetPlan = res.data;
      } catch {
        message.error('Erreur création du plan');
        fetchData();
        return;
      }
    }

    try {
      await loadingPlansAPI.assignBl(targetPlan!.id, blId);
      message.success('BL chargé dans le camion');
      fetchData();
    } catch (err: any) {
      const msg: string = err.response?.data?.message || '';
      const isCapacity = msg.startsWith('CAPACITY_');

      if (isCapacity) {
        if (draggedBl) setAvailableBls((prev) => [...prev, draggedBl]);
        fetchData();

        const planId  = targetPlan!.id;
        const truck   = trucks.find((t) => t.id === targetTruckId);
        const label   = msg.replace(/^CAPACITY_\w+:/, '');

        notification.warning({
          message: 'Capacité dépassée',
          description: (
            <div>
              <div style={{ marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 10 }}>
                Camion : <b>{truck?.matricule}</b> · BL : <b>{draggedBl?.numeroBl}</b>
              </div>
              <Space>
                <Button size="small" type="primary" danger icon={<WarningOutlined />}
                  onClick={() => {
                    notification.destroy('cap-warn');
                    setAvailableBls((prev) => prev.filter((b) => b.id !== blId));
                    forceAssign(planId, blId, draggedBl);
                  }}
                >
                  Forcer le chargement
                </Button>
                <Button size="small" onClick={() => notification.destroy('cap-warn')}>
                  Annuler
                </Button>
              </Space>
            </div>
          ),
          key: 'cap-warn',
          duration: 0,
          icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
        });
      } else {
        if (draggedBl) setAvailableBls((prev) => [...prev, draggedBl]);
        message.error(msg || 'Erreur lors du chargement');
        fetchData();
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveBl(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const blId   = active.id as string;
    const overId = over.id  as string;

    const sourcePlan = getPlanContainingBl(blId);
    const resolvedBl =
      availableBls.find((b) => b.id === blId) ||
      plans.flatMap((p) => p.bonsLivraison || []).find((b) => b.id === blId);

    // ── Cas 1 : drop sur une carte BL (peut être tri ou transfert inter-camion)
    const overPlan = getPlanContainingBl(overId);
    if (overPlan) {
      if (sourcePlan && sourcePlan.id === overPlan.id) {
        // Même plan → TRI INTRA-CAMION
        const rawBls = sourcePlan.bonsLivraison || [];
        const sortedBls = [...rawBls].sort(
          (a, b) => ((a as any).ordreChargement ?? 0) - ((b as any).ordreChargement ?? 0),
        );
        const oldIdx = sortedBls.findIndex((b) => b.id === blId);
        const newIdx = sortedBls.findIndex((b) => b.id === overId);
        if (oldIdx === -1 || newIdx === -1) return;
        const reordered = arrayMove(sortedBls, oldIdx, newIdx);
        // Mise à jour optimiste immédiate
        setPlans((prev) =>
          prev.map((p) => p.id === sourcePlan.id ? { ...p, bonsLivraison: reordered } : p),
        );
        try {
          await loadingPlansAPI.reorderBls(sourcePlan.id, reordered.map((b) => b.id));
          fetchData();
        } catch {
          message.error('Erreur lors du réordonnancement');
          fetchData();
        }
        return;
      }
      // Plans différents → TRANSFERT INTER-CAMION (drop sur BL dans un autre camion)
      if (!sourcePlan || sourcePlan.id !== overPlan.id) {
        const targetTruckId = overPlan.truck?.id;
        if (targetTruckId) {
          await transferBl(blId, targetTruckId, sourcePlan, resolvedBl);
        }
        return;
      }
    }

    // ── Cas 2 : drop sur la zone droppable d'un camion
    if (overId.startsWith('truck-')) {
      const targetTruckId = overId.replace('truck-', '');
      if (sourcePlan && sourcePlan.truck?.id === targetTruckId) return; // même camion
      await transferBl(blId, targetTruckId, sourcePlan, resolvedBl);
      return;
    }

    // ── Cas 3 : drop sur la zone des BLs disponibles
    if (overId === 'available-zone') {
      if (sourcePlan) {
        await loadingPlansAPI.removeBl(sourcePlan.id, blId);
        message.success('BL retiré du camion');
        fetchData();
      }
    }
  };

  const handleRemoveBl = (planId: string, blId: string) => {
    Modal.confirm({
      title: 'Retirer ce BL du camion ?',
      content: 'Le bon de livraison sera remis dans la liste des BL disponibles.',
      okText: 'Oui, retirer',
      cancelText: 'Annuler',
      okButtonProps: { danger: true },
      onOk: async () => {
        await loadingPlansAPI.removeBl(planId, blId);
        message.success('BL retiré');
        fetchData();
      },
    });
  };

  const handleSetArrivalTime = async (planId: string, time: string | null) => {
    try {
      await loadingPlansAPI.setArrivalTime(planId, time || '');
      message.success(time ? `RDV défini à ${time}` : 'Heure supprimée');
      fetchData();
    } catch {
      message.error('Erreur');
    }
  };

  const handleValidate = (planId: string) => {
    setSigPlanId(planId);
    setSigModalOpen(true);
  };

  const handleValidateAll = () => {
    setSigPlanId('all');
    setSigModalOpen(true);
  };

  // ── Signature canvas helpers
  const getSigPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const onSigDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    sigDrawingRef.current = true;
    sigLastPosRef.current = getSigPos(e);
  };

  const onSigMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!sigDrawingRef.current || !sigLastPosRef.current) return;
    const canvas = sigCanvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getSigPos(e);
    ctx.beginPath();
    ctx.moveTo(sigLastPosRef.current.x, sigLastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    sigLastPosRef.current = pos;
  };

  const onSigUp = () => { sigDrawingRef.current = false; sigLastPosRef.current = null; };

  const clearSig = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.getContext('2d')!.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
    }
  };

  const confirmSig = async () => {
    const sig = sigCanvasRef.current?.toDataURL('image/png');
    setSigModalOpen(false);
    if (sigPlanId === 'all') {
      try {
        const res = await loadingPlansAPI.validateAll(selectedDate, sig);
        const count = res.data.validated;
        message.success(`${count} plan${count > 1 ? 's' : ''} validé${count > 1 ? 's' : ''}`);
        fetchData();
      } catch {
        message.error('Erreur lors de la validation globale');
      }
    } else if (sigPlanId) {
      try {
        await loadingPlansAPI.validate(sigPlanId, sig);
        message.success('Plan validé');
        fetchData();
      } catch {
        message.error('Erreur lors de la validation');
      }
    }
  };

  const openPrint = (plan: LoadingPlan) => {
    setPrintPlan(plan);
    setTimeout(() => handlePrint(), 200);
  };

  const openCompanyPrint = (companyNom: string, companyPlans: LoadingPlan[]) => {
    setPrintCompanyNom(companyNom);
    setPrintCompanyPlans(companyPlans.filter((p) => (p.bonsLivraison?.length ?? 0) > 0));
    setTimeout(() => handleCompanyPrint(), 200);
  };

  const openAvailModal = () => {
    setAvailSelected(availabilities.map((a) => a.truck.id));
    setAvailModalOpen(true);
  };

  const saveAvailability = async () => {
    setAvailSaving(true);
    try {
      await truckAvailabilityAPI.bulkSet(availSelected, selectedDate);
      message.success('Disponibilités mises à jour');
      setAvailModalOpen(false);
      fetchData();
    } catch {
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setAvailSaving(false);
    }
  };

  // BL list scroll handler for infinite load
  const handleBlScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      if (blPage * BL_PAGE_SIZE < filteredBls.length) {
        setBlPage((p) => p + 1);
      }
    }
  };


  // Stats
  const totalTrucksUsed = plans.filter((p) => p.bonsLivraison?.length > 0).length;
  const totalTonnageLoaded = plans.reduce((s, p) => s + Number(p.tonnageCharge), 0);
  const unvalidatedPlans = plans.filter((p) => !p.isValidated && p.bonsLivraison?.length > 0);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={3} style={{ margin: 0 }}>Planning Chargement</Title>
          {refreshing && (
            <Spin size="small" style={{ marginLeft: 4 }} />
          )}
          {totalTrucksUsed > 0 && (
            <Space size={4}>
              <Tag color="processing">{totalTrucksUsed} camion{totalTrucksUsed > 1 ? 's' : ''} chargé{totalTrucksUsed > 1 ? 's' : ''}</Tag>
              <Tag color="blue">{totalTonnageLoaded.toFixed(1)} T en transit</Tag>
            </Space>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {unvalidatedPlans.length > 0 && (
            <Popconfirm
              title={`Valider les ${unvalidatedPlans.length} plan${unvalidatedPlans.length > 1 ? 's' : ''} en attente ?`}
              description={
                <div style={{ maxHeight: 160, overflow: 'auto' }}>
                  {unvalidatedPlans.map((p) => (
                    <div key={p.id} style={{ fontSize: 11, padding: '2px 0' }}>
                      🚛 {p.truck?.matricule} · {p.bonsLivraison?.length} BL · {p.tonnageCharge} T
                    </div>
                  ))}
                </div>
              }
              icon={<CheckCircleOutlined style={{ color: '#1890ff' }} />}
              onConfirm={handleValidateAll}
              okText="Tout valider"
              cancelText="Annuler"
            >
              <Button type="primary" icon={<CheckCircleOutlined />}>
                Valider tout ({unvalidatedPlans.length})
              </Button>
            </Popconfirm>
          )}
          <Tooltip title="Exporter en Excel">
            <Button
              icon={<FileExcelOutlined style={{ color: '#217346' }} />}
              onClick={() => exportPlanning(plans, selectedDate, user?.company?.nom)}
              disabled={plans.filter((p) => p.bonsLivraison?.length > 0).length === 0}
            >
              Excel
            </Button>
          </Tooltip>
          <Tooltip title="Imprimer le bilan journalier">
            <Button
              icon={<PrinterOutlined />}
              onClick={() => setTimeout(() => handlePrintDaily(), 100)}
              disabled={plans.filter((p) => p.bonsLivraison?.length > 0).length === 0}
            >
              Bilan journalier
            </Button>
          </Tooltip>
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={(d) => d && setSelectedDate(d.format('YYYY-MM-DD'))}
            format="DD/MM/YYYY"
            size="middle"
          />
        </div>
      </div>

      <Row gutter={12} style={{ height: 'calc(100vh - 170px)' }}>

        {/* ══════════════════ PANNEAU GAUCHE : BL disponibles ══════════════════ */}
        <Col flex="370px" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Card
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' } }}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                <Text strong>BL disponibles</Text>
                <Badge count={availableBls.length} style={{ backgroundColor: '#1890ff' }} />
              </div>
            }
          >
            {/* Filtres BL */}
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
              <Input
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                placeholder="N° BL, client, expéditeur…"
                size="small"
                value={blSearch}
                onChange={(e) => setBlSearch(e.target.value)}
                allowClear
                style={{ marginBottom: 6 }}
              />
              {/* Tri auto */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 6, padding: '4px 6px',
                background: autoSort ? '#f6ffed' : '#fafafa',
                border: `1px solid ${autoSort ? '#b7eb8f' : '#e8e8e8'}`,
                borderRadius: 6,
              }}>
                <span style={{ fontSize: 11, color: autoSort ? '#52c41a' : '#888', fontWeight: 600 }}>
                  Tri auto (A→Z destination)
                </span>
                <Button
                  size="small"
                  type={autoSort ? 'primary' : 'default'}
                  onClick={toggleAutoSort}
                  style={{ fontSize: 10, height: 20, padding: '0 8px', lineHeight: '18px' }}
                >
                  {autoSort ? 'ON' : 'OFF'}
                </Button>
              </div>
              {/* Grouper par */}
              <Segmented
                size="small"
                block
                value={blGroupBy}
                onChange={(v) => {
                  setBlGroupBy(v as 'destination' | 'expediteur');
                  setBlDestFilter(null);
                  setBlExpFilter(null);
                }}
                options={[
                  { label: <span><EnvironmentOutlined /> Destination</span>, value: 'destination' },
                  { label: <span><ApartmentOutlined /> Expéditeur</span>, value: 'expediteur' },
                ]}
                style={{ marginBottom: 6 }}
              />
              {blGroupBy === 'destination' ? (
                <Select
                  placeholder="Filtrer par destination"
                  style={{ width: '100%' }}
                  size="small"
                  allowClear
                  value={blDestFilter}
                  onChange={(v) => setBlDestFilter(v ?? null)}
                  options={destinations.map((d) => ({
                    value: d,
                    label: (
                      <span>
                        <span style={{
                          display: 'inline-block', width: 8, height: 8,
                          borderRadius: '50%', background: getDestinationColor(d), marginRight: 6,
                        }} />
                        {d}
                      </span>
                    ),
                  }))}
                  suffixIcon={<FilterOutlined />}
                />
              ) : (
                <Select
                  placeholder="Filtrer par expéditeur"
                  style={{ width: '100%' }}
                  size="small"
                  allowClear
                  value={blExpFilter}
                  onChange={(v) => setBlExpFilter(v ?? null)}
                  options={expediteurs.map((e) => ({
                    value: e.id,
                    label: (
                      <span>
                        <span style={{
                          display: 'inline-block', width: 8, height: 8,
                          borderRadius: '50%', background: e.couleur || '#1890ff', marginRight: 6,
                        }} />
                        {e.nom}
                      </span>
                    ),
                  }))}
                  suffixIcon={<FilterOutlined />}
                />
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {filteredBls.length} BL
                  {(blSearch || blDestFilter || blExpFilter) && availableBls.length !== filteredBls.length
                    ? ` / ${availableBls.length}`
                    : ''}
                </Text>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <b style={{ color: '#1890ff' }}>{filteredBlTonnage.toFixed(1)} T</b>
                </Text>
              </div>
            </div>

            {/* Liste BLs — scroll infini */}
            <div
              ref={blListRef}
              style={{ flex: 1, overflow: 'auto', padding: '4px 8px' }}
              onScroll={handleBlScroll}
            >
              <Text type="secondary" style={{ fontSize: 10, display: 'block', marginBottom: 4, color: '#bfbfbf' }}>
                Double-clic pour voir les détails · Glisser vers un camion
              </Text>
              <AvailableZone bls={filteredBls} page={blPage} groupBy={blGroupBy} onBlClick={setDetailBl} />
              {blPage * BL_PAGE_SIZE < filteredBls.length && (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Affichage {Math.min(blPage * BL_PAGE_SIZE, filteredBls.length)} / {filteredBls.length}
                  </Text>
                </div>
              )}
            </div>
          </Card>
        </Col>

        {/* ══════════════════ PANNEAU DROITE : Camions ══════════════════ */}
        <Col flex="1" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Barre de filtres camions */}
          <div style={{
            display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10,
            padding: '8px 12px', background: 'white', borderRadius: 8,
            border: '1px solid #f0f0f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <TruckOutlined style={{ color: '#8c8c8c' }} />
            <Input
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Matricule, type…"
              size="small"
              value={truckSearch}
              onChange={(e) => setTruckSearch(e.target.value)}
              allowClear
              style={{ maxWidth: 220 }}
            />
            <TeamOutlined style={{ color: '#8c8c8c' }} />
            <Select
              placeholder="Société de livraison"
              size="small"
              style={{ minWidth: 200 }}
              allowClear
              value={companyFilter}
              onChange={(v) => setCompanyFilter(v ?? null)}
              options={deliveryCompanies.map((c) => ({ value: c.id, label: c.nom }))}
              suffixIcon={<FilterOutlined />}
            />
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {trucksByCompany.reduce((s, [, g]) => s + g.trucks.length, 0)} camion(s) ·{' '}
                {trucksByCompany.length} société(s)
              </Text>
              {(() => {
                const allOpen = trucksByCompany.length > 0 && openCompanies.length >= trucksByCompany.length;
                return (
                  <Button
                    size="small"
                    icon={allOpen ? <MinusSquareOutlined /> : <PlusSquareOutlined />}
                    onClick={() => allOpen
                      ? setOpenCompanies([])
                      : setOpenCompanies(trucksByCompany.map(([k]) => k))
                    }
                  >
                    {allOpen ? 'Tout fermer' : 'Tout ouvrir'}
                  </Button>
                );
              })()}
              <Button size="small" icon={<TruckOutlined />} onClick={openAvailModal}>
                Disponibilités
              </Button>
            </div>
          </div>

          {/* Corps camions — scrollable */}
          <div style={{ flex: 1, overflow: 'auto', paddingBottom: 16 }}>
            {trucksByCompany.length === 0 ? (
              <Empty description="Aucun camion correspond aux filtres" style={{ marginTop: 80 }} />
            ) : (
              <Collapse
                activeKey={openCompanies}
                onChange={(keys) => setOpenCompanies(keys as string[])}
                ghost
                style={{ background: 'transparent' }}
              >
                {trucksByCompany.map(([companyId, group]) => {
                  const groupTrucksWithPlans = group.trucks.filter((t) => {
                    const p = getPlanForTruck(t.id);
                    return p && p.bonsLivraison?.length > 0;
                  });
                  const groupTonnage = groupTrucksWithPlans.reduce((s, t) => {
                    const p = getPlanForTruck(t.id);
                    return s + (p ? Number(p.tonnageCharge) : 0);
                  }, 0);
                  const groupCapacity = group.trucks.reduce((s, t) => s + Number(t.capaciteTonnage), 0);

                  return (
                    <Panel
                      key={companyId}
                      header={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <TruckOutlined style={{ color: '#1890ff' }} />
                          <Text strong style={{ fontSize: 13 }}>{group.nom}</Text>
                          <Tag style={{ fontSize: 10, margin: 0 }}>{group.trucks.length} camion{group.trucks.length > 1 ? 's' : ''}</Tag>
                          {groupTrucksWithPlans.length > 0 && (
                            <>
                              <Tag color="processing" style={{ fontSize: 10, margin: 0 }}>
                                {groupTrucksWithPlans.length} chargé{groupTrucksWithPlans.length > 1 ? 's' : ''}
                              </Tag>
                              <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>
                                {groupTonnage.toFixed(1)} / {groupCapacity.toFixed(0)} T
                              </Tag>
                              <Tooltip title="Imprimer les plans de cette société">
                                <Button
                                  size="small"
                                  icon={<PrinterOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const companyPlans = group.trucks
                                      .map((t) => getPlanForTruck(t.id))
                                      .filter((p): p is LoadingPlan => !!p);
                                    openCompanyPrint(group.nom, companyPlans);
                                  }}
                                >
                                  Imprimer
                                </Button>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      }
                      style={{
                        marginBottom: 8,
                        background: 'white',
                        borderRadius: 8,
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
                        gap: 10,
                        padding: '4px 0',
                      }}>
                        {group.trucks.map((truck) => {
                          const plan = getPlanForTruck(truck.id);
                          return (
                            <TruckColumn
                              key={truck.id}
                              truck={truck}
                              plan={plan}
                              onRemoveBl={(blId) => plan && handleRemoveBl(plan.id, blId)}
                              onView={() => plan && setViewPlan(plan)}
                              onSetTime={plan ? (t) => handleSetArrivalTime(plan.id, t) : undefined}
                            />
                          );
                        })}
                      </div>
                    </Panel>
                  );
                })}
              </Collapse>
            )}
          </div>
        </Col>
      </Row>

      {/* Overlay drag — BLCardContentévite un double useDraggable */}
      <DragOverlay dropAnimation={null}>
        {activeBl && (
          <div style={{ cursor: 'grabbing', zIndex: 9999 }}>
            <BLCardContent bl={activeBl} isDragging />
          </div>
        )}
      </DragOverlay>

      {/* Zones impression cachées */}
      {printPlan && (
        <div style={{ display: 'none' }}>
          <PrintLoadingPlan ref={printRef} plan={printPlan} />
        </div>
      )}
      <div style={{ display: 'none' }}>
        <PrintDailyReport ref={dailyPrintRef} plans={plans} date={selectedDate} companyNom={user?.company?.nom} />
      </div>
      <div style={{ display: 'none' }}>
        <div ref={companyPrintRef} style={{ fontFamily: 'Arial, sans-serif', padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 20, borderBottom: '2px solid #000', paddingBottom: 12 }}>
            <h1 style={{ fontSize: 20, margin: '0 0 4px' }}>Plan de Chargement</h1>
            <div style={{ fontSize: 14, fontWeight: 'bold' }}>{printCompanyNom}</div>
            <div style={{ fontSize: 13, color: '#666' }}>{dayjs(selectedDate).format('dddd DD MMMM YYYY')}</div>
          </div>
          {printCompanyPlans.map((plan) => (
            <div key={plan.id} style={{ marginBottom: 28, pageBreakInside: 'avoid' }}>
              <div style={{ background: '#f0f0f0', padding: '8px 12px', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', fontSize: 14 }}>
                  Camion : {plan.truck?.matricule}
                </span>
                <span style={{ fontSize: 12 }}>
                  {plan.truck?.type || 'Standard'} · {plan.truck?.capaciteTonnage} T
                  {plan.heureArrivee ? ` · RDV : ${plan.heureArrivee}` : ''}
                </span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#fafafa', textAlign: 'left' }}>N° BL</th>
                    <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#fafafa', textAlign: 'left' }}>Client</th>
                    <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#fafafa', textAlign: 'left' }}>Destination</th>
                    <th style={{ border: '1px solid #ccc', padding: '4px 8px', background: '#fafafa', textAlign: 'right' }}>Tonnage</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(plan.bonsLivraison || [])]
                    .sort((a, b) => ((a as any).ordreChargement ?? 0) - ((b as any).ordreChargement ?? 0))
                    .map((bl) => (
                      <tr key={bl.id}>
                        <td style={{ border: '1px solid #ccc', padding: '3px 8px' }}>{bl.numeroBl}</td>
                        <td style={{ border: '1px solid #ccc', padding: '3px 8px' }}>{bl.clientNom}</td>
                        <td style={{ border: '1px solid #ccc', padding: '3px 8px' }}>{bl.destination || '—'}</td>
                        <td style={{ border: '1px solid #ccc', padding: '3px 8px', textAlign: 'right' }}>{Number(bl.tonnageTotal).toFixed(1)} T</td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>Total</td>
                    <td style={{ border: '1px solid #ccc', padding: '4px 8px', textAlign: 'right', fontWeight: 'bold' }}>{Number(plan.tonnageCharge).toFixed(1)} T</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      </div>

      <BlDetailDrawer bl={detailBl} onClose={() => setDetailBl(null)} />
      <TruckViewDrawer plan={viewPlan} onClose={() => setViewPlan(null)} />

      {/* ── Signature validation modal ── */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#1890ff' }} />
            <span>
              {sigPlanId === 'all'
                ? `Valider ${unvalidatedPlans.length} plan${unvalidatedPlans.length > 1 ? 's' : ''} de charge`
                : 'Valider le plan de charge'}
            </span>
          </Space>
        }
        open={sigModalOpen}
        onCancel={() => setSigModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose={false}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Apposez votre signature pour confirmer la validation.
          </Text>
        </div>
        <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '6px 12px', background: '#f5f5f5', borderBottom: '1px solid #e8e8e8' }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Signature du Responsable Logistique</Text>
          </div>
          <canvas
            ref={sigCanvasRef}
            width={480}
            height={180}
            style={{ display: 'block', width: '100%', cursor: 'crosshair', background: '#fff' }}
            onMouseDown={onSigDown}
            onMouseMove={onSigMove}
            onMouseUp={onSigUp}
            onMouseLeave={onSigUp}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
          <Button onClick={clearSig}>Effacer</Button>
          <Space>
            <Button onClick={() => setSigModalOpen(false)}>Annuler</Button>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={confirmSig}>
              Confirmer la validation
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Truck availability management modal */}
      <Modal
        title={`Camions disponibles — ${dayjs(selectedDate).format('dddd DD MMMM YYYY')}`}
        open={availModalOpen}
        onCancel={() => setAvailModalOpen(false)}
        onOk={saveAvailability}
        okText="Enregistrer"
        cancelText="Annuler"
        confirmLoading={availSaving}
        width={620}
      >
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Cochez les camions disponibles pour cette journée. Seuls les camions cochés apparaîtront dans le planning.
          </Text>
        </div>
        {(() => {
          const groups: Record<string, { nom: string; trucks: Truck[] }> = {};
          trucks.forEach((t) => {
            const key = t.deliveryCompany?.id || '__unknown__';
            const nom = t.deliveryCompany?.nom || 'Société inconnue';
            if (!groups[key]) groups[key] = { nom, trucks: [] };
            groups[key].trucks.push(t);
          });
          return Object.entries(groups).sort(([, a], [, b]) => a.nom.localeCompare(b.nom)).map(([key, group]) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#1890ff' }}>
                <TruckOutlined style={{ marginRight: 6 }} />{group.nom}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {group.trucks.map((t) => (
                  <Checkbox
                    key={t.id}
                    checked={availSelected.includes(t.id)}
                    onChange={(e) =>
                      setAvailSelected((prev) =>
                        e.target.checked ? [...prev, t.id] : prev.filter((id) => id !== t.id),
                      )
                    }
                  >
                    <Text style={{ fontSize: 12 }}>{t.matricule}</Text>
                    {t.type && <Text type="secondary" style={{ fontSize: 10, marginLeft: 4 }}>({t.type})</Text>}
                  </Checkbox>
                ))}
              </div>
            </div>
          ));
        })()}
      </Modal>

    </DndContext>
  );
};

export default PlanningPage;
