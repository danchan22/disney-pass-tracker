import React, { useState } from 'react';
import { FIXED_FAMILY_MEMBERS } from '../../lib/constants';

interface AddPersonModalProps {
  show: boolean;
  onClose: () => void;
  currentParty: string[];
  onAddMembers: (joiningMembers: string[]) => void;
}

export const AddPersonModal: React.FC<AddPersonModalProps> = ({
  show,
  onClose,
  currentParty,
  onAddMembers,
}) => {
  const [selectedJoining, setSelectedJoining] = useState<string[]>([]);

  if (!show) return null;

  const availableToJoin = FIXED_FAMILY_MEMBERS.filter(m => !currentParty.includes(m));

  const toggleMember = (name: string) => {
    if (selectedJoining.includes(name)) {
      setSelectedJoining(selectedJoining.filter(m => m !== name));
    } else {
      setSelectedJoining([...selectedJoining, name]);
    }
  };

  const handleAdd = () => {
    if (selectedJoining.length === 0) return;
    onAddMembers(selectedJoining);
    setSelectedJoining([]);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#FFF', borderRadius: '24px', padding: '22px', maxWidth: '400px', width: '100%', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '900', color: '#004487' }}>
          Add People to Party
        </h3>
        <p style={{ fontSize: '12px', fontWeight: '800', color: '#718096', margin: '0 0 14px 0', textTransform: 'uppercase' }}>
          WHO'S JOINING?
        </p>

        {availableToJoin.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#A0AEC0', fontStyle: 'italic', margin: '15px 0' }}>
            Everyone is already in the active party!
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '20px' }}>
            {availableToJoin.map((name) => {
              const isSelected = selectedJoining.includes(name);
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleMember(name)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #004487' : '1px solid #CBD5E0',
                    background: isSelected ? '#004487' : '#F8FAFC',
                    color: isSelected ? '#FFF' : '#2D3748',
                    fontSize: '13px',
                    fontWeight: isSelected ? '800' : '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected ? `✓ ${name}` : name}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', background: '#EDF2F7', color: '#4A5568',
              border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleAdd}
            disabled={selectedJoining.length === 0}
            style={{
              flex: 2, padding: '12px', background: '#38A169', color: '#FFF',
              border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '13px',
              cursor: 'pointer', opacity: selectedJoining.length === 0 ? 0.5 : 1
            }}
          >
            Add Selected ({selectedJoining.length})
          </button>
        </div>
      </div>
    </div>
  );
};
