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
  onSaveAlert: (rule: Omit<AlertRule, 'id'>) => void;
  onClose: () => void;
}

export const WaitTimeAlertModal: React.FC<WaitTimeAlertModalProps> = ({
  rideName,
  currentWait,
  isClosed,
  onSaveAlert,
  onClose,
}) => {
  const [targetWait, setTargetWait] = useState<string>(
    currentWait > 0 ? Math.max(5, currentWait - 10).toString() : '20'
  );
  const [alertOnOpen, setAlertOnOpen] = useState<boolean>(isClosed);

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
        borderRadius: '20px',
        padding: '20px',
        maxWidth: '380px',
        width: '100%',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
      }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '900', color: '#004487' }}>
          🔔 Set Wait Time Alert
        </h3>
        <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#4A5568', fontWeight: '700' }}>
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
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
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
                cursor: 'pointer'
              }}
            >
              Save Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AlertTriggeredModal: React.FC<{
  rideName: string;
  message: string;
  onClose: () => void;
}> = ({ rideName, message, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFDF5',
        borderRadius: '24px',
        padding: '24px',
        maxWidth: '360px',
        width: '100%',
        textAlign: 'center',
        border: '3px solid #D4AF37',
        boxShadow: '0 12px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '8px' }}>🚨</div>
        <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '900', color: '#744210' }}>
          WAIT TIME ALERT!
        </h2>
        <div style={{ fontSize: '16px', fontWeight: '900', color: '#1A202C', marginBottom: '6px' }}>
          {rideName}
        </div>
        <div style={{ fontSize: '14px', color: '#2D3748', fontWeight: '700', marginBottom: '20px' }}>
          {message}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '12px',
            border: 'none',
            background: '#D4AF37',
            color: '#1A202C',
            fontWeight: '900',
            fontSize: '15px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)'
          }}
        >
          Got It!
        </button>
      </div>
    </div>
  );
};
