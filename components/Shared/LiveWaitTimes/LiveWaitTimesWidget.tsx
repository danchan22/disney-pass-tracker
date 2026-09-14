'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getLandForRide } from './landMappings';
import { WaitTimeAlertModal, AlertTriggeredModal, AlertRule } from './WaitTimeAlertModal';
import { ParkIcon } from '../ParkIcon';

interface RideItem {
  id: string;
  name: string;
  waitTime: number;
  isClosed: boolean;
  isOpenState?: boolean;
  showtimes?: any[];
}

interface LiveWaitTimesWidgetProps {
  parkName: string;
  riddenRideNamesToday?: string[];
}

const FAVORITES_STORAGE_KEY = 'disney_pass_tracker_favorites_v1';
const ALERTS_STORAGE_KEY = 'disney_pass_tracker_alerts_v1';

// Exact wait time color thresholding
const getWaitTimePillStyle = (wait: number, isClosed: boolean, isOpenState?: boolean) => {
  if (isClosed) {
    return { bg: '#718096', color: '#FFFFFF', label: 'CLOSED' };
  }
  if (wait <= 0 && isOpenState) {
    return { bg: '#38A169', color: '#FFFFFF', label: 'OPEN' };
  }
  if (wait <= 15) {
    return { bg: '#22543D', color: '#FFFFFF', label: `${wait}m` }; // 1-15: Dark Green
  }
  if (wait <= 29) {
    return { bg: '#38A169', color: '#FFFFFF', label: `${wait}m` }; // 16-29: Light Green
  }
  if (wait <= 44) {
    return { bg: '#D69E2E', color: '#FFFFFF', label: `${wait}m` }; // 30-44: Yellow
  }
  if (wait <= 59) {
    return { bg: '#DD6B20', color: '#FFFFFF', label: `${wait}m` }; // 45-59: Orange
  }
  return { bg: '#E53E3E', color: '#FFFFFF', label: `${wait}m` }; // 60+: Red
};

export const LiveWaitTimesWidget: React.FC<LiveWaitTimesWidgetProps> = ({
  parkName,
  riddenRideNamesToday = [],
}) => {
  const [rides, setRides] = useState<RideItem[]>([]);
  const [shows, setShows] = useState<RideItem[]>([]);
  const [categoryTab, setCategoryTab] = useState<'rides' | 'shows'>('rides');
  const [loading, setLoading] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  // Favorites & Filters state
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [hideRidden, setHideRidden] = useState<boolean>(false);
  const [groupByLand, setGroupByLand] = useState<boolean>(true);

  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'wait'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Alert state
  const [alertModalRide, setAlertModalRide] = useState<RideItem | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertRule[]>([]);
  const [triggeredNotification, setTriggeredNotification] = useState<{ rideName: string; message: string } | null>(null);

  // Load Favorites and Active Alerts on mount
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedAlerts = localStorage.getItem(ALERTS_STORAGE_KEY);
      if (savedAlerts) setActiveAlerts(JSON.parse(savedAlerts));
    } catch (e) {
      console.error("Error reading LocalStorage", e);
    }
  }, []);

  // Save Favorites to LocalStorage
  const toggleFavorite = (rideName: string) => {
    setFavorites(prev => {
      const updated = prev.includes(rideName)
        ? prev.filter(r => r !== rideName)
        : [...prev, rideName];
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Fetch Live Wait & Show Times from API
  const fetchLiveWaitTimes = async () => {
    setLoading(true);
    try {
      const entityMap: Record<string, string> = {
        'Magic Kingdom': '754884ae-34b5-4304-b78e-3c07264f0be5',
        'Epcot': '47f935e4-3274-42a2-8682-f8f2e2ee9966',
        'Hollywood Studios': '288747d1-8b4f-4a64-867e-ea7c923263a3',
        'Animal Kingdom': '1c84b24b-abed-431c-92a4-321ac142c709',
      };

      const entityId = entityMap[parkName];
      if (!entityId) {
        setRides([]);
        setShows([]);
        setLoading(false);
        return;
      }

      const res = await fetch(`https://api.themeparks.wiki/v1/entity/${entityId}/live`);
      const data = await res.json();

      // Robust array extraction handling all API response shapes
      const liveList: any[] = Array.isArray(data)
        ? data
        : (data?.liveData || data?.live || []);

      const parsedRides: RideItem[] = [];
      const parsedShows: RideItem[] = [];

      liveList.forEach((item: any) => {
        const type = (item.entityType || '').toUpperCase();
        const isShow = type === 'SHOW' || type === 'MEET_AND_GREET' || type === 'ENTERTAINMENT' || (Array.isArray(item.showtimes) && item.showtimes.length > 0);

        const parsedItem: RideItem = {
          id: item.id || item.name,
          name: item.name,
          waitTime: item.queue?.STANDBY?.waitTime ?? 0,
          isClosed: item.status !== 'OPERATING',
          isOpenState: item.status === 'OPERATING' && (item.queue?.STANDBY?.waitTime === null || item.queue?.STANDBY?.waitTime === undefined),
          showtimes: item.showtimes || []
        };

        if (isShow) {
          parsedShows.push(parsedItem);
        } else {
          parsedRides.push(parsedItem);
        }
      });

      setRides(parsedRides);
      setShows(parsedShows);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      checkAlerts([...parsedRides, ...parsedShows]);
    } catch (err) {
      console.error("Failed to fetch live wait times:", err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time alert threshold checker
  const checkAlerts = (currentItems: RideItem[]) => {
    if (activeAlerts.length === 0) return;

    const remainingAlerts: AlertRule[] = [];

    activeAlerts.forEach(alert => {
      const match = currentItems.find(r => r.name.toLowerCase().includes(alert.rideName.toLowerCase()));
      if (match) {
        let triggered = false;
        let msg = '';

        if (!match.isClosed && match.waitTime <= alert.targetWait) {
          triggered = true;
          msg = `Wait time is now ${match.waitTime} mins (target was ≤ ${alert.targetWait}m)!`;
        } else if (alert.alertOnOpen && !match.isClosed) {
          triggered = true;
          msg = `Ride is now OPEN!`;
        }

        if (triggered) {
          setTriggeredNotification({ rideName: match.name, message: msg });
        } else {
          remainingAlerts.push(alert);
        }
      } else {
        remainingAlerts.push(alert);
      }
    });

    setActiveAlerts(remainingAlerts);
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(remainingAlerts));
    } catch (e) {}
  };

  useEffect(() => {
    fetchLiveWaitTimes();
    const interval = setInterval(fetchLiveWaitTimes, 60000);
    return () => clearInterval(interval);
  }, [parkName]);

  const handleSaveAlert = (rule: Omit<AlertRule, 'id'>) => {
    const newRule: AlertRule = { ...rule, park: parkName, id: Date.now().toString() };
    const updated = [...activeAlerts, newRule];
    setActiveAlerts(updated);
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const activeSourceList = categoryTab === 'rides' ? rides : shows;

  // Filter & Sort Logic
  const filteredItems = useMemo(() => {
    return activeSourceList.filter(r => {
      if (favoritesOnly && !favorites.includes(r.name)) return false;
      if (hideRidden && riddenRideNamesToday.some(rr => r.name.toLowerCase().includes(rr.toLowerCase()))) return false;
      return true;
    }).sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        if (a.isClosed && !b.isClosed) return 1;
        if (!a.isClosed && b.isClosed) return -1;
        return sortOrder === 'asc' ? a.waitTime - b.waitTime : b.waitTime - a.waitTime;
      }
    });
  }, [activeSourceList, favoritesOnly, favorites, hideRidden, riddenRideNamesToday, sortField, sortOrder]);

  // Grouping by Land
  const groupedItems = useMemo(() => {
    if (!groupByLand) return { 'All Attractions': filteredItems };

    const groups: Record<string, RideItem[]> = {};
    filteredItems.forEach(r => {
      const land = getLandForRide(parkName, r.name);
      if (!groups[land]) groups[land] = [];
      groups[land].push(r);
    });
    return groups;
  }, [filteredItems, groupByLand, parkName]);

  return (
    <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
      
      {/* HEADER WITH PARK ICON, TIMESTAMP & REFRESH BUTTON */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '900', color: '#004487', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ParkIcon parkName={parkName} size={22} />
            <span>Live Wait & Show Times</span>
          </h3>
          {lastRefreshed && (
            <div style={{ fontSize: '11px', color: '#718096', fontWeight: '600', marginTop: '2px' }}>
              Updated: {lastRefreshed}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={fetchLiveWaitTimes}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '12px',
            border: '1px solid #BEE3F8',
            background: '#EBF8FF',
            fontSize: '12px',
            fontWeight: '800',
            color: '#004487',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span>↻</span> Refresh
        </button>
      </div>

      {/* RIDES vs SHOWS SUB-NAVIGATION BAR */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        background: '#F8FAFC',
        borderRadius: '16px',
        border: '1px solid #EDF2F7',
        padding: '4px',
        marginBottom: '14px'
      }}>
        <button
          type="button"
          onClick={() => setCategoryTab('rides')}
          style={{
            padding: '8px 12px',
            borderRadius: '12px',
            border: 'none',
            background: categoryTab === 'rides' ? '#004487' : 'transparent',
            color: categoryTab === 'rides' ? '#FFF' : '#2D3748',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Rides ({rides.length})
        </button>

        <button
          type="button"
          onClick={() => setCategoryTab('shows')}
          style={{
            padding: '8px 12px',
            borderRadius: '12px',
            border: 'none',
            background: categoryTab === 'shows' ? '#004487' : 'transparent',
            color: categoryTab === 'shows' ? '#FFF' : '#2D3748',
            fontSize: '13px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Shows ({shows.length})
        </button>
      </div>

      {/* FILTER BUTTON ROW */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#718096', marginRight: '2px' }}>Filter:</span>

        <button
          type="button"
          onClick={() => setFavoritesOnly(prev => !prev)}
          style={{
            padding: '6px 12px',
            borderRadius: '12px',
            border: favoritesOnly ? '2px solid #004487' : '1px solid #E2E8F0',
            background: favoritesOnly ? '#EBF8FF' : '#F8FAFC',
            color: favoritesOnly ? '#004487' : '#4A5568',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {favoritesOnly ? '★ Favs' : '☆ Favs'}
        </button>

        <button
          type="button"
          onClick={() => setHideRidden(prev => !prev)}
          style={{
            padding: '6px 12px',
            borderRadius: '12px',
            border: hideRidden ? '2px solid #004487' : '1px solid #E2E8F0',
            background: hideRidden ? '#EBF8FF' : '#F8FAFC',
            color: hideRidden ? '#004487' : '#4A5568',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {hideRidden ? '✓ Hide Ridden' : 'Hide Ridden'}
        </button>

        <button
          type="button"
          onClick={() => setGroupByLand(prev => !prev)}
          style={{
            padding: '6px 12px',
            borderRadius: '12px',
            border: groupByLand ? '2px solid #004487' : '1px solid #E2E8F0',
            background: groupByLand ? '#EBF8FF' : '#F8FAFC',
            color: groupByLand ? '#004487' : '#4A5568',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          🗺️ By Land
        </button>
      </div>

      {/* SORT BUTTON ROW */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#718096', marginRight: '2px' }}>Sort:</span>

        <button
          type="button"
          onClick={() => {
            if (sortField === 'name') {
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            } else {
              setSortField('name');
              setSortOrder('asc');
            }
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '12px',
            border: sortField === 'name' ? '2px solid #004487' : '1px solid #E2E8F0',
            background: sortField === 'name' ? '#EBF8FF' : '#F8FAFC',
            color: sortField === 'name' ? '#004487' : '#4A5568',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {sortField === 'name' ? (sortOrder === 'asc' ? 'Name A-Z' : 'Name Z-A') : 'A-Z'}
        </button>

        <button
          type="button"
          onClick={() => {
            if (sortField === 'wait') {
              setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
            } else {
              setSortField('wait');
              setSortOrder('asc');
            }
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '12px',
            border: sortField === 'wait' ? '2px solid #004487' : '1px solid #E2E8F0',
            background: sortField === 'wait' ? '#EBF8FF' : '#F8FAFC',
            color: sortField === 'wait' ? '#004487' : '#4A5568',
            fontSize: '11px',
            fontWeight: '800',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {sortField === 'wait' ? (sortOrder === 'asc' ? 'Wait Low-High' : 'Wait High-Low') : 'Low to High'}
        </button>
      </div>

      {/* RIDE / SHOW LIST RENDERER */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#A0AEC0', fontStyle: 'italic', padding: '20px' }}>
          Fetching live times from {parkName}...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#A0AEC0', fontStyle: 'italic', padding: '20px' }}>
          No attractions found matching your active filter options.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {Object.entries(groupedItems).map(([land, landItems]) => {
            if (landItems.length === 0) return null;

            return (
              <div key={land}>
                {groupByLand && (
                  <div style={{
                    fontSize: '11px',
                    fontWeight: '900',
                    color: '#718096',
                    letterSpacing: '0.8px',
                    marginBottom: '6px',
                    paddingBottom: '2px',
                    borderBottom: '1px dashed #E2E8F0'
                  }}>
                    {land.toUpperCase()}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {landItems.map(r => {
                    const isFav = favorites.includes(r.name);
                    const pillStyle = getWaitTimePillStyle(r.waitTime, r.isClosed, r.isOpenState);
                    const hasActiveAlert = activeAlerts.some(a => a.rideName.toLowerCase() === r.name.toLowerCase());

                    return (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '12px',
                          background: '#F8FAFC',
                          border: '1px solid #EDF2F7',
                          gap: '8px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          {/* FAVORITE STAR BUTTON */}
                          <button
                            type="button"
                            onClick={() => toggleFavorite(r.name)}
                            style={{
                              background: 'none',
                              border: 'none',
                              fontSize: '16px',
                              color: isFav ? '#D4AF37' : '#CBD5E0',
                              cursor: 'pointer',
                              padding: 0,
                              flexShrink: 0
                            }}
                            title={isFav ? "Unstar Favorite" : "Star as Favorite"}
                          >
                            {isFav ? '★' : '☆'}
                          </button>

                          {/* ATTRACTION NAME & ALERT ICON */}
                          <div
                            onClick={() => setAlertModalRide(r)}
                            style={{ cursor: 'pointer', minWidth: 0, flex: 1 }}
                            title="Click to set wait time alert"
                          >
                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#1A202C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block', maxWidth: '100%' }}>
                              {r.name}
                            </span>
                            {hasActiveAlert && (
                              <span style={{ fontSize: '10px', color: '#D69E2E', marginLeft: '6px' }}>🔔</span>
                            )}
                          </div>
                        </div>

                        {/* WAIT / SHOW TIME PILL */}
                        <div
                          onClick={() => setAlertModalRide(r)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            background: pillStyle.bg,
                            color: pillStyle.color,
                            fontSize: '12px',
                            fontWeight: '900',
                            flexShrink: 0,
                            cursor: 'pointer'
                          }}
                        >
                          {pillStyle.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ALERT CREATION MODAL */}
      {alertModalRide && (
        <WaitTimeAlertModal
          rideName={alertModalRide.name}
          currentWait={alertModalRide.waitTime}
          isClosed={alertModalRide.isClosed}
          onSaveAlert={handleSaveAlert}
          onClose={() => setAlertModalRide(null)}
        />
      )}

      {/* REALTIME ALERT POPUP NOTIFICATION */}
      {triggeredNotification && (
        <AlertTriggeredModal
          rideName={triggeredNotification.rideName}
          message={triggeredNotification.message}
          onClose={() => setTriggeredNotification(null)}
        />
      )}
    </div>
  );
};
