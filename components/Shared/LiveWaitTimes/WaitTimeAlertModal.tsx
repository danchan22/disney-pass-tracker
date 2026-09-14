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

export const WaitTimeAlertModal: React.FC<WaitTimeAlertModalProps> = ({
  rideName,
  currentWait,
  isClosed,
  existingAlert,
  onSaveAlert,
  onRemoveAlert,
  onClose,
}) => {
  const [targetWait, setTargetWait] = useState<string>(
    existingAlert
      ? existingAlert.targetWait.toString()
      : currentWait > 0
      ? Math.max(5, currentWait - 10).toString()
      : '20'
  );
  const [alertOnOpen, setAlertOnOpen] = useState<boolean>(
    existingAlert ? existingAlert.alertOnOpen : isClosed
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAlert({
      park: '',
      rideName,
      targetWait: parseInt(targetWait, 10) || 15,
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '800', color: '#718096', display: 'block', marginBottom: '6px' }}>
              ALERT ME WHEN WAIT TIME IS AT OR BELOW:
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                value={targetWait}
                onChange={(e) => setTargetWait(e.target.value.replace(/[^0-9]/g, ''))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E0',
                  fontSize: '15px',
                  fontWeight: '800',
                  color: '#1A202C'
                }}
              />
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#4A5568' }}>mins</span>
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

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
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

// WHITE RABBIT ALERT TRIGGER POPUP
export const AlertTriggeredModal: React.FC<{
  rideName: string;
  waitTime: number | null;
  isOperating: boolean;
  onClose: () => void;
}> = ({ rideName, waitTime, isOperating, onClose }) => {
  const getPillStyle = () => {
    if (!isOperating) return { bg: '#FFF5F5', color: '#9B2C2C', border: '#FEB2B2', label: 'DOWN' };
    if (waitTime === null || waitTime === 0) return { bg: '#E6FFFA', color: '#22543D', border: '#B2F5EA', label: '0m' };
    if (waitTime <= 29) return { bg: '#E6FFFA', color: '#22543D', border: '#B2F5EA', label: `${waitTime}m` };
    if (waitTime <= 44) return { bg: '#FEFCBF', color: '#744210', border: '#F6E05E', label: `${waitTime}m` };
    if (waitTime <= 59) return { bg: '#FEEBC8', color: '#7B341E', border: '#FBD38D', label: `${waitTime}m` };
    return { bg: '#FFF5F5', color: '#9B2C2C', border: '#FEB2B2', label: `${waitTime}m` };
  };

  const pill = getPillStyle();

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFDF7',
        borderRadius: '28px',
        padding: '24px 20px',
        maxWidth: '340px',
        width: '100%',
        border: '3px solid #D4AF37',
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        boxSizing: 'border-box'
      }}>
        {/* RABBIT + WAIT TIME BADGE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
          <img
            src="/rabbit.gif"
            alt="White Rabbit"
            style={{ height: '110px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{
            padding: '8px 16px',
            borderRadius: '12px',
            background: pill.bg,
            color: pill.color,
            border: `1px solid ${pill.border}`,
            fontSize: '18px',
            fontWeight: '900',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }}>
            {pill.label}
          </div>
        </div>

        {/* ATTRACTION NAME */}
        <h3 style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: '800',
          color: '#4A5568',
          textAlign: 'center',
          lineHeight: '1.3'
        }}>
          {rideName}
        </h3>

        {/* GOT IT BUTTON */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '16px',
            border: 'none',
            background: '#D4AF37',
            color: '#1A202C',
            fontWeight: '900',
            fontSize: '16px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.3)'
          }}
        >
          Got It!
        </button>
      </div>
    </div>
  );
};
