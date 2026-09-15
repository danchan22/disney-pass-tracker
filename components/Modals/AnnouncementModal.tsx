'use client';

import React, { useEffect, useState } from 'react';
import { getSupabase } from '../../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  link_url?: string;
  link_text?: string;
  is_active: boolean;
}

export const AnnouncementModal: React.FC = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkActiveAnnouncement();
  }, []);

  const checkActiveAnnouncement = async () => {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return;

      const dismissedKey = `disney_announcement_dismissed_${data.id}`;
      const isDismissed = localStorage.getItem(dismissedKey);

      if (!isDismissed) {
        setAnnouncement(data);
        setIsOpen(true);
      }
    } catch (err) {
      console.warn("Could not check announcements:", err);
    }
  };

  const handleDismiss = () => {
    if (announcement) {
      localStorage.setItem(`disney_announcement_dismissed_${announcement.id}`, 'true');
    }
    setIsOpen(false);
  };

  if (!isOpen || !announcement) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFF',
        borderRadius: '28px',
        padding: '22px',
        maxWidth: '380px',
        width: '100%',
        border: '3px solid #D4AF37',
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* CLOSE X BUTTON */}
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#EDF2F7',
            border: 'none',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            color: '#4A5568',
            fontSize: '14px',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          ✕
        </button>

        {/* HEADER ICON + TITLE */}

          <div>
            <h3 style={{ margin: '2px 0 0 0', fontSize: '16px', fontWeight: '900', color: '#004487' }}>
              {announcement.title}
            </h3>
          </div>
        </div>

        {/* OPTIONAL IMAGE */}
        {announcement.image_url && (
          <div style={{
            width: '100%',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            background: '#F8FAFC'
          }}>
            <img
              src={announcement.image_url}
              alt="Announcement"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}

        {/* BODY CONTENT */}
        <p style={{
          margin: 0,
          fontSize: '13px',
          color: '#2D3748',
          lineHeight: '1.5',
          fontWeight: '600',
          whiteSpace: 'pre-line'
        }}>
          {announcement.content}
        </p>

        {/* BUTTON ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          {announcement.link_url && (
            <a
              href={announcement.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismiss}
              style={{
                width: '100%',
                background: '#004487',
                color: '#FFF',
                fontWeight: '800',
                padding: '12px',
                borderRadius: '14px',
                fontSize: '13px',
                textDecoration: 'none',
                textAlign: 'center',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>{announcement.link_text || 'Learn More'}</span>
              <span style={{ fontSize: '11px' }}>↗</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            style={{
              width: '100%',
              background: '#004487',
              color: '#ffffff',
              fontWeight: '900',
              padding: '12px',
              borderRadius: '14px',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(212, 175, 55, 0.3)'
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
