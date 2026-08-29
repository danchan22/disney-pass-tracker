import React from 'react';
import { Visit } from '../../lib/types';
import { formatDisplayDate, parseAttendees } from '../../lib/helpers';

interface EditVisitModalProps {
  editingVisit: Visit | null;
  setEditingVisit: (visit: Visit | null) => void;
  editVisitStartTime: string;
  setEditVisitStartTime: (val: string) => void;
  editVisitEndTime: string;
  setEditVisitEndTime: (val: string) => void;
  editVisitMemberEndTimes: Record<string, string>;
  setEditVisitMemberEndTimes: (val: Record<string, string>) => void;
  handleSaveVisitEdit: () => void;
}

export const EditVisitModal: React.FC<EditVisitModalProps> = ({
  editingVisit,
  setEditingVisit,
  editVisitStartTime,
  setEditVisitStartTime,
  editVisitEndTime,
  setEditVisitEndTime,
  editVisitMemberEndTimes,
  setEditVisitMemberEndTimes,
  handleSaveVisitEdit,
}) => {
  if (!editingVisit) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
      <div style={{ background: '#FFF', borderRadius: '24px', padding: '22px', maxWidth: '440px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '900', color: '#004487' }}>
          ✏️ Edit Visit Hours
        </h3>
        <p style={{ fontSize: '12px', color: '#718096', margin: '0 0 16px 0' }}>
          {editingVisit.parkName} • {formatDisplayDate(editingVisit.visitDate)}
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '4px' }}>
            ⏰ ARRIVAL TIME (HH:MM / e.g. 08:59 or 14:30)
          </label>
          <input
            type="text"
            placeholder="e.g. 08:59"
            value={editVisitStartTime}
            onChange={(e) => setEditVisitStartTime(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '4px' }}>
            🚪 MAIN DEPARTURE TIME (e.g. 21:50)
          </label>
          <input
            type="text"
            placeholder="e.g. 21:50"
            value={editVisitEndTime}
            onChange={(e) => setEditVisitEndTime(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #CBD5E0', fontSize: '14px' }}
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '11px', fontWeight: '800', color: '#4A5568', display: 'block', marginBottom: '6px' }}>
            👥 MEMBER DEPARTURE TIMES
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {parseAttendees(editingVisit.attendees).map(member => (
              <div key={member} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '8px 10px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#2D3748' }}>👤 {member}</span>
                <input
                  type="text"
                  placeholder={editVisitEndTime || "HH:MM"}
                  value={editVisitMemberEndTimes[member] || ''}
                  onChange={(e) => {
                    setEditVisitMemberEndTimes({
                      ...editVisitMemberEndTimes,
                      [member]: e.target.value
                    });
                  }}
                  style={{ width: '110px', padding: '6px 8px', borderRadius: '8px', border: '1px solid #CBD5E0', fontSize: '13px', textAlign: 'center' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setEditingVisit(null)}
            style={{ flex: 1, padding: '12px', background: '#EDF2F7', color: '#4A5568', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveVisitEdit}
            style={{ flex: 2, padding: '12px', background: '#38A169', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
          >
            💾 Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
