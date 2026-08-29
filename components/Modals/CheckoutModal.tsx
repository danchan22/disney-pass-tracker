import React from 'react';

interface CheckoutModalProps {
  showCheckoutModal: boolean;
  setShowCheckoutModal: (show: boolean) => void;
  activePartyList: string[];
  departingMembers: string[];
  toggleDepartingMember: (name: string) => void;
  processCheckout: (type: 'selected' | 'everyone') => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  showCheckoutModal,
  setShowCheckoutModal,
  activePartyList,
  departingMembers,
  toggleDepartingMember,
  processCheckout,
}) => {
  if (!showCheckoutModal) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#FFF', borderRadius: '24px', padding: '22px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#004487' }}>
          👋 Leaving the Park
        </h3>
        <p style={{ fontSize: '13px', color: '#4A5568', margin: '0 0 16px 0' }}>
          Who is departing the park right now?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {activePartyList.map((member) => {
            const isSelected = departingMembers.includes(member);
            return (
              <button
                key={member}
                type="button"
                onClick={() => toggleDepartingMember(member)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid #E53E3E' : '1px solid #CBD5E0',
                  background: isSelected ? '#FFF5F5' : '#F8FAFC',
                  color: isSelected ? '#C53030' : '#4A5568',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <span>👤 {member}</span>
                <span>{isSelected ? '🚪 Leaving' : '🏰 Staying'}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            type="button"
            onClick={() => processCheckout('selected')}
            style={{
              width: '100%', padding: '12px', background: '#E53E3E', color: '#FFF',
              border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'
            }}
          >
            Check Out Selected ({departingMembers.length})
          </button>

          <button
            type="button"
            onClick={() => processCheckout('everyone')}
            style={{
              width: '100%', padding: '10px', background: '#EDF2F7', color: '#2D3748',
              border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
            }}
          >
            Check Out Everyone
          </button>

          <button
            type="button"
            onClick={() => setShowCheckoutModal(false)}
            style={{
              width: '100%', padding: '8px', background: 'none', color: '#718096',
              border: 'none', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
