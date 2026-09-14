'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PARK_ATTRACTIONS, PARK_ATTRACTIONS_BY_LAND } from '../../../lib/constants';
import { getLandForRide } from './landMappings';
import { WaitTimeAlertModal, AlertTriggeredModal, AlertRule } from './WaitTimeAlertModal';
import { ParkIcon } from '../ParkIcon';

interface Showtime {
  startTime: string;
}

interface RideItem {
  id: string;
  name: string;
  waitTime: number | null;
  isOperating: boolean;
  showtimes?: Showtime[];
}

interface LiveWaitTimesWidgetProps {
  parkName: string;
  riddenRideNamesToday?: string[];
}

const FAVORITES_STORAGE_KEY = 'disney_pass_tracker_favorites_v1';
const ALERTS_STORAGE_KEY = 'disney_pass_tracker_alerts_v1';

const cleanStr = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9]/g, '');

const tokenize = (s: string) =>
  (s || '')
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/&/g, 'and')
    .replace(/[’'"]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(t => t.length > 2);

const isFuzzyMatch = (apiName: string, constantName: string): boolean => {
  const c1 = cleanStr(apiName);
  const c2 = cleanStr(constantName);
  if (!c1 || !c2) return false;
  if (c1.includes(c2) || c2.includes(c1)) return true;

  const t1 = tokenize(apiName);
  const t2 = tokenize(constantName);
  if (t1.length === 0 || t2.length === 0) return false;

  const matches = t1.filter(t => t2.includes(t));
  return matches.length >= Math.min(2, t2.length);
};

const getParkEntityId = (park: string): string => {
  const c = cleanStr(park);
  if (c.includes('animal') || c.includes('ak')) return '1c84a229-8862-4648-9c71-378ddd2c7693';
  if (c.includes('epcot')) return '47f90d2c-e191-4239-a466-5892ef59a88b';
  if (c.includes('hollywood') || c.includes('studios')) return '288747d1-8b4f-4a64-867e-ea7c9b27bad8';
  return '75ea578a-adc8-4116-a54d-dccb60765ef9';
};

// 0m wait times styled light green (#E6FFFA)
const getWaitTimeStyle = (isOperating: boolean, waitTime: number | null) => {
  if (!isOperating) {
    return {
      bg: '#FFF5F5',
      color: '#9B2C2C',
      border: '#FEB2B2',
      label: 'DOWN',
    };
  }

  if (waitTime === null || waitTime <= 29) {
    return {
      bg: '#E6FFFA', // Light Green for 0m - 29m
      color: '#22543D',
      border: '#B2F5EA',
      label: `${waitTime ?? 0}m`,
    };
  } else if (waitTime <= 44) {
    return {
      bg: '#FEFCBF',
      color: '#744210',
      border: '#F6E05E',
      label: `${waitTime}m`,
    };
  } else if (waitTime <= 59) {
    return {
      bg: '#FEEBC8',
      color: '#7B341E',
      border: '#FBD38D',
      label: `${waitTime}m`,
    };
  } else {
    return {
      bg: '#FFF5F5',
      color: '#9B2C2C',
      border: '#FEB2B2',
      label: `${waitTime}m`,
    };
  }
};

const formatShowtimeLabel = (timeStr: string): string => {
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return timeStr;
  }
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

  // Favorites & Filters
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [hideRidden, setHideRidden] = useState<boolean>(false);
  const [groupByLand, setGroupByLand] = useState<boolean>(true);

  // Sorting
  const [sortField, setSortField] = useState<'name' | 'wait'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Alerts
  const [alertModalRide, setAlertModalRide] = useState<RideItem | null>(null);
  const [activeAlerts, setActiveAlerts] = useState<AlertRule[]>([]);
  const [triggeredNotification, setTriggeredNotification] = useState<{ rideName: string; waitTime: number | null; isOperating: boolean } | null>(null);

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

  const fetchLiveWaitTimes = async (isBackground = false) => {
    if (!isBackground && rides.length === 0 && shows.length === 0) {
      setLoading(true);
    }

    try {
      const entityId = getParkEntityId(parkName);
      const res = await fetch(`https://api.themeparks.wiki/v1/entity/${entityId}/live`);
      const data = await res.json();

      const liveList: any[] = Array.isArray(data)
        ? data
        : (data?.liveData || data?.live || []);

      const allowedAttractions = PARK_ATTRACTIONS[parkName] || [];

      const parsedRides: RideItem[] = [];
      const parsedShows: RideItem[] = [];
      const now = new Date();

      liveList.forEach((item: any) => {
        const type = (item.entityType || '').toUpperCase();
        const rawName = item.name || '';

        // Match constant RIDES list first
        let matchedConstantName: string | undefined = undefined;
        for (const cName of allowedAttractions) {
          if (isFuzzyMatch(rawName, cName)) {
            matchedConstantName = cName;
            break;
          }
        }

        if (matchedConstantName) {
          const wait = item.queue?.STANDBY?.waitTime ?? item.queue?.SINGLE_RIDER?.waitTime ?? (typeof item.waitTime === 'number' ? item.waitTime : 0);

          parsedRides.push({
            id: item.id || matchedConstantName,
            name: matchedConstantName,
            waitTime: wait,
            isOperating: item.status === 'OPERATING',
          });
        } else {
          const isShow = type === 'SHOW' || type === 'MEET_AND_GREET' || type === 'ENTERTAINMENT' || (Array.isArray(item.showtimes) && item.showtimes.length > 0);

          if (isShow) {
            const rawShowtimes: any[] = Array.isArray(item.showtimes) ? item.showtimes : [];
            const upcomingShowtimes: Showtime[] = rawShowtimes
              .map(s => ({ startTime: s.startTime || s }))
              .filter(s => {
                const showDate = new Date(s.startTime);
                return !isNaN(showDate.getTime()) && showDate > now;
              });

            if (upcomingShowtimes.length > 0) {
              parsedShows.push({
                id: item.id || rawName,
                name: rawName,
                waitTime: null,
                isOperating: item.status === 'OPERATING',
                showtimes: upcomingShowtimes
              });
            }
          }
        }
      });

      const uniqueRides = Array.from(new Map(parsedRides.map(r => [r.name, r])).values());

      setRides(uniqueRides);
      setShows(parsedShows);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }));

      checkAlerts([...uniqueRides, ...parsedShows]);
    } catch (err) {
      console.error("Failed to fetch live wait times:", err);
    } finally {
      setLoading(false);
    }
  };

  // Safe multi-park alert checking
  const checkAlerts = (currentItems: RideItem[]) => {
    if (activeAlerts.length === 0) return;

    const remainingAlerts: AlertRule[] = [];

    activeAlerts.forEach(alert => {
      if (alert.park && cleanStr(alert.park) !== cleanStr(parkName)) {
        remainingAlerts.push(alert);
        return;
      }

      const match = currentItems.find(r => cleanStr(r.name).includes(cleanStr(alert.rideName)) || cleanStr(alert.rideName).includes(cleanStr(r.name)));
      if (match) {
        let triggered = false;

        if (match.isOperating && match.waitTime !== null && match.waitTime <= alert.targetWait) {
          triggered = true;
        } else if (alert.alertOnOpen && match.isOperating) {
          triggered = true;
        }

        if (triggered) {
          setTriggeredNotification({
            rideName: match.name,
            waitTime: match.waitTime,
            isOperating: match.isOperating
          });
        } else {
          remainingAlerts.push(alert);
        }
      } else {
        remainingAlerts.push(alert);
      }
    });

    if (remainingAlerts.length !== activeAlerts.length) {
      setActiveAlerts(remainingAlerts);
      try {
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(remainingAlerts));
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchLiveWaitTimes(false);
    const interval = setInterval(() => fetchLiveWaitTimes(true), 60000);
    return () => clearInterval(interval);
  }, [parkName]);

  const handleSaveAlert = (rule: Omit<AlertRule, 'id'>) => {
    const newRule: AlertRule = { ...rule, park: parkName, id: Date.now().toString() };
    const filtered = activeAlerts.filter(a => cleanStr(a.rideName) !== cleanStr(rule.rideName));
    const updated = [...filtered, newRule];
    setActiveAlerts(updated);
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const handleRemoveAlert = (rideName: string) => {
    const updated = activeAlerts.filter(a => cleanStr(a.rideName) !== cleanStr(rideName));
    setActiveAlerts(updated);
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}
  };

  const activeSourceList = categoryTab === 'rides' ? rides : shows;

  const filteredItems = useMemo(() => {
    return activeSourceList.filter(r => {
      if (favoritesOnly && !favorites.includes(r.name)) return false;
      if (hideRidden && riddenRideNamesToday.some(rr => cleanStr(r.name).includes(cleanStr(rr)))) return false;
      return true;
    }).sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else {
        if (!a.isOperating && b.isOperating) return 1;
        if (a.isOperating && !b.isOperating) return -1;
        const waitA = a.waitTime ?? 0;
        const waitB = b.waitTime ?? 0;
        return sortOrder === 'asc' ? waitA - waitB : waitB - waitA;
      }
    });
  }, [activeSourceList, favoritesOnly, favorites, hideRidden, riddenRideNamesToday, sortField, sortOrder]);

  // CANONICAL LAND ORDERING: Initializes groups in constants land order so sorting doesn't jump
  const groupedItems = useMemo(() => {
    if (!groupByLand || categoryTab === 'shows') return { 'All Attractions': filteredItems };

    const groups: Record<string, RideItem[]> = {};

    const parkLands = PARK_ATTRACTIONS_BY_LAND[parkName];
    if (parkLands) {
      Object.keys(parkLands).forEach(land => {
        groups[land] = [];
      });
    }

    filteredItems.forEach(r => {
      const land = getLandForRide(parkName, r.name);
      if (!groups[land]) groups[land] = [];
      groups[land].push(r);
    });

    return groups;
  }, [filteredItems, groupByLand, parkName, categoryTab]);

  return (
    <div style={{ background: '#FFF', borderRadius: '24px', padding: '18px', border: '1px solid #E2E8F0', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
      
      {/* HEADER */}
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
          onClick={() => fetchLiveWaitTimes(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            borderRadius: '12px',
            border: '1px solid #BEE3F8',
            background: '#EBF8FF',
            fontSize: '14px',
            fontWeight: '800',
            color: '#004487',
            cursor: 'pointer'
          }}
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {/* RIDES vs SHOWS SUB-NAV */}
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
            cursor: 'pointer'
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
            cursor: 'pointer'
          }}
        >
          Shows ({shows.length})
        </button>
      </div>

      {/* FILTER ROW */}
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
            cursor: 'pointer'
          }}
        >
          {favoritesOnly ? '★ Favorites' : '☆ Favorites'}
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
            cursor: 'pointer'
          }}
        >
          Hide Today's Rides
        </button>
      </div>

      {/* SORT ROW */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', color: '#718096', marginRight: '2px' }}>Sort:</span>

        {categoryTab === 'rides' && (
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
              cursor: 'pointer'
            }}
          >
            By Land
          </button>
        )}

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
            cursor: 'pointer'
          }}
        >
          {sortField === 'name' ? (sortOrder === 'asc' ? 'A-Z' : 'Z-A') : 'A-Z'}
        </button>

        {categoryTab === 'rides' && (
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
              cursor: 'pointer'
            }}
          >
            {sortField === 'wait' ? (sortOrder === 'asc' ? 'Low-High' : 'High-Low') : 'Low-High'}
          </button>
        )}
      </div>

      {/* LIST RENDERER */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#A0AEC0', fontStyle: 'italic', padding: '20px' }}>
          Fetching live times from {parkName}...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#A0AEC0', fontStyle: 'italic', padding: '20px' }}>
          No attractions found matching your active filter options.
        </div>
      ) : categoryTab === 'shows' ? (
        /* SHOWS CARDS */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.map(show => (
            <div
              key={show.id}
              style={{
                background: '#F8FAFC',
                borderRadius: '16px',
                border: '1px solid #EDF2F7',
                padding: '12px 14px'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#1A202C', marginBottom: '8px' }}>
                {show.name}
              </div>

              {show.showtimes && show.showtimes.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {show.showtimes.map((st, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#EBF8FF',
                        color: '#004487',
                        border: '1px solid #BEE3F8',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '800'
                      }}
                    >
                      {formatShowtimeLabel(st.startTime)}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: '#718096', fontStyle: 'italic' }}>
                  No remaining showtimes today.
                </span>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* RIDES LIST */
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
                    const pillStyle = getWaitTimeStyle(r.isOperating, r.waitTime);
                    const hasActiveAlert = activeAlerts.some(a => cleanStr(a.rideName) === cleanStr(r.name));

                    return (
                      <div
                        key={r.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          background: '#F8FAFC',
                          border: '1px solid #EDF2F7',
                          gap: '8px'
                        }}
                      >
                        {/* LEFT: STAR + RIDE TITLE (SINGLE-LINE TRUNCATION) */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
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

                          <div
                            onClick={() => setAlertModalRide(r)}
                            style={{ cursor: 'pointer', minWidth: 0, flex: 1, overflow: 'hidden' }}
                            title="Click to set wait time alert"
                          >
                            <span style={{
                              fontSize: '13px',
                              fontWeight: '800',
                              color: '#1A202C',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: 'block',
                              maxWidth: '100%'
                            }}>
                              {r.name}
                            </span>
                          </div>
                        </div>

                        {/* RIGHT: ALERT BELL + WAIT TIME PILL */}
                        <div
                          onClick={() => setAlertModalRide(r)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, cursor: 'pointer' }}
                          title="Click to set wait time alert"
                        >
                          {hasActiveAlert && (
                            <span style={{ fontSize: '13px', lineHeight: 1 }}>🔔</span>
                          )}

                          <div
                            style={{
                              padding: '4px 10px',
                              borderRadius: '8px',
                              background: pillStyle.bg,
                              color: pillStyle.color,
                              border: `1px solid ${pillStyle.border}`,
                              fontSize: '12px',
                              fontWeight: '900',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {pillStyle.label}
                          </div>
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

      {/* MODALS */}
      {alertModalRide && (
        <WaitTimeAlertModal
          rideName={alertModalRide.name}
          currentWait={alertModalRide.waitTime ?? 0}
          isClosed={!alertModalRide.isOperating}
          existingAlert={activeAlerts.find(a => cleanStr(a.rideName) === cleanStr(alertModalRide.name))}
          onSaveAlert={handleSaveAlert}
          onRemoveAlert={handleRemoveAlert}
          onClose={() => setAlertModalRide(null)}
        />
      )}

      {triggeredNotification && (
        <AlertTriggeredModal
          rideName={triggeredNotification.rideName}
          waitTime={triggeredNotification.waitTime}
          isOperating={triggeredNotification.isOperating}
          onClose={() => setTriggeredNotification(null)}
        />
      )}
    </div>
  );
};
