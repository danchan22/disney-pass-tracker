'use client';

import React from 'react';
import { Visit, Activity, TrackerSubTab } from '../../lib/types';
import { ParkingSubtab } from './ParkingSubtab';
import { TimesTrackerSubTab } from './Tracker/TimesTrackerSubTab';
import { TodaySubTab } from './Tracker/TodaySubTab';
import { HistorySubTab } from './Tracker/HistorySubTab';

interface TrackerTabProps {
  trackerSubTab: TrackerSubTab;
  activeVisit: Visit | null;
  activeVisits: Visit[];
  focusedVisitId: string | null;
  setFocusedVisitId: (id: string | null) => void;
  parkName: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom';
  setParkName: (park: 'Magic Kingdom' | 'Epcot' | 'Hollywood Studios' | 'Animal Kingdom') => void;
  selectedAttendees: string[];
  toggleCheckInAttendee: (name: string) => void;
  handleCheckIn: (e: React.FormEvent) => void;
  activePartyList: string[];
  rideName: string;
  setRideName: (name: string) => void;
  waitTime: string;
  setWaitTime: (time: string) => void;
  characterName: string;
  setCharacterName: (name: string) => void;
  selectedRiders: string[];
  toggleRiderSelection: (name: string) => void;
  queueStartTimestamp: number | null;
  setQueueStartTimestamp: (ts: number | null) => void;
  queueStartTimeStr: string | null;
  setQueueStartTimeStr: (str: string | null) => void;
  getElapsedQueueTimeString: () => string;
  rideTrivia: string | null;
  setRideTrivia: (trivia: string | null) => void;
  triviaLoading: boolean;
  hiddenMickey: string | null;
  setHiddenMickey: (mickey: string | null) => void;
  mickeyLoading: boolean;
  handleStartQueueTimer: () => void;
  handleEndQueueTimer: (isWalkOn?: boolean) => void;
  handleCancelQueueTimer: () => void;
  handleAddRideLive: (isWalkOn?: boolean) => void;
  editingActivityId: string | null;
  editingVisitId: string | null;
  editRideName: string;
  setEditRideName: (name: string) => void;
  editWaitTime: string;
  setEditWaitTime: (time: string) => void;
  editNotes: string;
  setEditNotes: (notes: string) => void;
  editRiders: string[];
  toggleEditRiderSelection: (name: string) => void;
  startEditing: (activity: Activity, visitId: string | null) => void;
  cancelEditing: () => void;
  saveEditedActivity: () => void;
  deleteActivity: (id: string) => void;
  setDepartingMembers: (members: string[]) => void;
  setShowCheckoutModal: (show: boolean) => void;
  handleAddMembersToActiveVisit: (newMembers: string[]) => void;
  selectedAttendee: string;
  totalDays: number;
  totalActivities: number;
  totalParkMinutes: number;
  totalWaitMinutes: number;
  topActivity?: { name: string; count: number; totalWait?: number; avgWait?: number };
  avgActivitiesPerDay: string;
  avgParkMinutesPerDay: number;
  avgWaitPerActivity: number;
  filteredVisits: Visit[];
  loading: boolean;
  openEditVisit: (v: Visit) => void;
  deleteVisit: (id: string) => void;
  handleReorderActivity: (visitId: string | null, activityId: string, direction: 'up' | 'down') => void;
}

export const TrackerTab: React.FC<TrackerTabProps> = ({
  trackerSubTab,
  activeVisit,
  activeVisits,
  focusedVisitId,
  setFocusedVisitId,
  parkName,
  setParkName,
  selectedAttendees,
  toggleCheckInAttendee,
  handleCheckIn,
  activePartyList,
  rideName,
  setRideName,
  waitTime,
  setWaitTime,
  characterName,
  setCharacterName,
  selectedRiders,
  toggleRiderSelection,
  queueStartTimestamp,
  queueStartTimeStr,
  getElapsedQueueTimeString,
  rideTrivia,
  triviaLoading,
  hiddenMickey,
  mickeyLoading,
  handleStartQueueTimer,
  handleEndQueueTimer,
  handleCancelQueueTimer,
  handleAddRideLive,
  editingActivityId,
  editingVisitId,
  editRideName,
  setEditRideName,
  editWaitTime,
  setEditWaitTime,
  editNotes,
  setEditNotes,
  editRiders,
  toggleEditRiderSelection,
  startEditing,
  cancelEditing,
  saveEditedActivity,
  deleteActivity,
  setDepartingMembers,
  setShowCheckoutModal,
  handleAddMembersToActiveVisit,
  selectedAttendee,
  totalDays,
  totalActivities,
  totalParkMinutes,
  totalWaitMinutes,
  avgActivitiesPerDay,
  avgParkMinutesPerDay,
  avgWaitPerActivity,
  filteredVisits,
  loading,
  openEditVisit,
  deleteVisit,
  handleReorderActivity,
}) => {
  return (
    <div>
      {/* Subtab: Today */}
      {trackerSubTab === 'Today' && (
        <>
          {/* MULTI-PARK PILL MENU (Renders when 2+ parks are concurrently active) */}
          {activeVisits.length > 1 && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                marginBottom: '14px',
                paddingBottom: '2px',
              }}
            >
              {activeVisits.map((v) => {
                const isSelected = v.id === (focusedVisitId || activeVisit?.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setFocusedVisitId(v.id)}
                    style={{
                      flex: '1 0 auto',
                      padding: '10px 16px',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid #004487' : '1px solid #E2E8F0',
                      background: isSelected ? '#004487' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#2D3748',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{v.parkName}</span>
                  </button>
                );
              })}
            </div>
          )}

          <TodaySubTab
            activeVisit={activeVisit}
            parkName={parkName}
            setParkName={setParkName}
            selectedAttendees={selectedAttendees}
            toggleCheckInAttendee={toggleCheckInAttendee}
            handleCheckIn={handleCheckIn}
            activePartyList={activePartyList}
            rideName={rideName}
            setRideName={setRideName}
            waitTime={waitTime}
            setWaitTime={setWaitTime}
            characterName={characterName}
            setCharacterName={setCharacterName}
            selectedRiders={selectedRiders}
            toggleRiderSelection={toggleRiderSelection}
            queueStartTimestamp={queueStartTimestamp}
            queueStartTimeStr={queueStartTimeStr}
            getElapsedQueueTimeString={getElapsedQueueTimeString}
            rideTrivia={rideTrivia}
            triviaLoading={triviaLoading}
            hiddenMickey={hiddenMickey}
            mickeyLoading={mickeyLoading}
            handleStartQueueTimer={handleStartQueueTimer}
            handleEndQueueTimer={handleEndQueueTimer}
            handleCancelQueueTimer={handleCancelQueueTimer}
            handleAddRideLive={handleAddRideLive}
            editingActivityId={editingActivityId}
            editingVisitId={editingVisitId}
            editRideName={editRideName}
            setEditRideName={setEditRideName}
            editWaitTime={editWaitTime}
            setEditWaitTime={setEditWaitTime}
            editNotes={editNotes}
            setEditNotes={setEditNotes}
            editRiders={editRiders}
            toggleEditRiderSelection={toggleEditRiderSelection}
            startEditing={startEditing}
            cancelEditing={cancelEditing}
            saveEditedActivity={saveEditedActivity}
            deleteActivity={deleteActivity}
            setDepartingMembers={setDepartingMembers}
            setShowCheckoutModal={setShowCheckoutModal}
            handleAddMembersToActiveVisit={handleAddMembersToActiveVisit}
            selectedAttendee={selectedAttendee}
            totalDays={totalDays}
            totalActivities={totalActivities}
            totalParkMinutes={totalParkMinutes}
            totalWaitMinutes={totalWaitMinutes}
            avgActivitiesPerDay={avgActivitiesPerDay}
            avgParkMinutesPerDay={avgParkMinutesPerDay}
            avgWaitPerActivity={avgWaitPerActivity}
            filteredVisits={filteredVisits}
            handleReorderActivity={handleReorderActivity}
          />
        </>
      )}

      {/* Subtab: Times */}
      {trackerSubTab === ('Times' as TrackerSubTab) && (
        <TimesTrackerSubTab activeVisit={activeVisit} />
      )}

      {/* Subtab: History */}
      {trackerSubTab === 'History' && (
        <HistorySubTab
          filteredVisits={filteredVisits}
          loading={loading}
          editingActivityId={editingActivityId}
          editingVisitId={editingVisitId}
          editRideName={editRideName}
          setEditRideName={setEditRideName}
          editWaitTime={editWaitTime}
          setEditWaitTime={setEditWaitTime}
          editNotes={editNotes}
          setEditNotes={setEditNotes}
          editRiders={editRiders}
          toggleEditRiderSelection={toggleEditRiderSelection}
          startEditing={startEditing}
          cancelEditing={cancelEditing}
          saveEditedActivity={saveEditedActivity}
          deleteActivity={deleteActivity}
          openEditVisit={openEditVisit}
          deleteVisit={deleteVisit}
          handleReorderActivity={handleReorderActivity}
        />
      )}

      {/* Subtab: Parking */}
      {trackerSubTab === 'Parking' && (
        <ParkingSubtab />
      )}
    </div>
  );
};
