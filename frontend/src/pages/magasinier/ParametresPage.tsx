import React, { useState } from 'react';
import { Card, Switch, Typography, Divider } from 'antd';
import { SettingOutlined, TeamOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

const MULTI_TRUCK_KEY = 'logiflow_multi_truck';

const MagasinierParametresPage: React.FC = () => {
  const [multiTruck, setMultiTruck] = useState<boolean>(
    () => localStorage.getItem(MULTI_TRUCK_KEY) === 'true',
  );

  const handleMultiTruckChange = (checked: boolean) => {
    setMultiTruck(checked);
    localStorage.setItem(MULTI_TRUCK_KEY, String(checked));
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid #b7eb8f',
        }}>
          <SettingOutlined style={{ fontSize: 20, color: '#52c41a' }} />
        </div>
        <div>
          <Title level={4} style={{ margin: 0 }}>Paramètres</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>Configuration de la gestion des quais</Text>
        </div>
      </div>

      <Card
        style={{ borderRadius: 12, border: '1px solid #e8e8e8', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafffe', borderRadius: '12px 12px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            <Text strong style={{ fontSize: 14 }}>Gestion des quais</Text>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 18px', borderRadius: 10,
            background: multiTruck ? '#f6ffed' : '#fafafa',
            border: `1px solid ${multiTruck ? '#b7eb8f' : '#e8e8e8'}`,
            transition: 'all 0.2s',
          }}>
            <div>
              <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 3 }}>
                Autoriser plusieurs camions par quai
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {multiTruck
                  ? 'Plusieurs camions peuvent être assignés simultanément à un même quai.'
                  : 'Chaque quai ne peut accueillir qu\'un seul camion à la fois.'}
              </Text>
            </div>
            <Switch
              checked={multiTruck}
              onChange={handleMultiTruckChange}
              style={{ marginLeft: 16, flexShrink: 0 }}
              checkedChildren="OUI"
              unCheckedChildren="NON"
            />
          </div>

          <Divider style={{ margin: '20px 0' }} />

          <div style={{
            padding: '12px 16px', borderRadius: 8,
            background: '#fffbe6', border: '1px solid #ffe58f',
          }}>
            <Text style={{ fontSize: 12, color: '#874d00' }}>
              <strong>Note :</strong> Ce paramètre s'applique à tous les quais. Lorsque plusieurs camions sont autorisés,
              la capacité de chaque quai est définie individuellement. Ce paramètre est local à votre navigateur.
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MagasinierParametresPage;
