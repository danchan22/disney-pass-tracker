'use client';

import React, { useState } from 'react';

export interface AlertRule {
  id: string;
  park: string;
  rideName: string;
  targetWait: number;
  alertOnOpen: boolean;
}

interface WaitTimeAlertModalProps {
  rideName: string;
  currentWait: number;
  isClosed: boolean;
  existingAlert?: AlertRule;
  onSaveAlert: (rule: Omit<AlertRule, 'id'>) => void;
  onRemoveAlert?: (rideName: string) => void;
  onClose: () => void;
}

// Generates [5, 10, 15, ..., 60]
const FIVE_MIN_INCREMENTS = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);

export const WaitTimeAlertModal: React.FC<WaitTimeAlertModalProps> = ({
  rideName,
  currentWait,
  isClosed,
  existingAlert,
  onSaveAlert,
  onRemoveAlert,
  onClose,
}) => {
  // Round initial wait suggestion to nearest 5m step (clamped between 5 and 60)
  const initialDefault = existingAlert
    ? existingAlert.targetWait
    : Math.min(60, Math.max(5, Math.floor((currentWait > 0 ? currentWait - 5 : 20) / 5) * 5));

  const [targetWait, setTargetWait] = useState<number>(initialDefault);
  const [alertOnOpen, setAlertOnOpen] = useState<boolean>(
    existingAlert ? existingAlert.alertOnOpen : isClosed
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAlert({
      park: '',
      rideName,
      targetWait,
      alertOnOpen,
    });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFF',
        borderRadius: '24px',
        padding: '22px',
        maxWidth: '380px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#004487' }}>
            🔔 Wait Time Alert
          </h3>
          {existingAlert && (
            <span style={{ fontSize: '10px', fontWeight: '800', background: '#FEFCBF', color: '#744210', padding: '2px 8px', borderRadius: '8px' }}>
              Active
            </span>
          )}
        </div>

        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#1A202C', fontWeight: '800' }}>
          {rideName}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '8px' }}>
              ALERT ME WHEN WAIT TIME IS AT OR BELOW:
            </label>

            {/* SCROLLING SELECTOR WHEEL */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={targetWait}
                onChange={(e) => setTargetWait(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '14px',
                  border: '2px solid #004487',
                  background: '#F8FAFC',
                  fontSize: '18px',
                  fontWeight: '900',
                  color: '#004487',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  textAlign: 'center'
                }}
              >
                {FIVE_MIN_INCREMENTS.map((mins) => (
                  <option key={mins} value={mins}>
                    {mins} mins
                  </option>
                ))}
              </select>

              {/* Custom Down Arrow Icon */}
              <div style={{
                position: 'absolute',
                right: '16px',
                pointerEvents: 'none',
                color: '#004487',
                fontSize: '12px',
                fontWeight: '900'
              }}>
                ▼
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              id="alertOpen"
              checked={alertOnOpen}
              onChange={(e) => setAlertOnOpen(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#004487', cursor: 'pointer' }}
            />
            <label htmlFor="alertOpen" style={{ fontSize: '13px', fontWeight: '700', color: '#2D3748', cursor: 'pointer' }}>
              Alert immediately if ride reopens
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            {existingAlert && onRemoveAlert ? (
              <button
                type="button"
                onClick={() => {
                  onRemoveAlert(rideName);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #FEB2B2',
                  background: '#FFF5F5',
                  color: '#9B2C2C',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Clear Alert
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E0',
                  background: '#EDF2F7',
                  color: '#4A5568',
                  fontWeight: '800',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                border: 'none',
                background: '#004487',
                color: '#FFF',
                fontWeight: '800',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              {existingAlert ? 'Update Alert' : 'Save Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
