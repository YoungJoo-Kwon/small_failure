import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getMyProfile, updateSettings } from '../lib/profiles';

interface SettingsContextType {
  notifyOnReply: boolean;
  setNotifyOnReply: (value: boolean) => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [notifyOnReply, setNotifyOnReplyState] = useState(false);
  const [loading, setLoading] = useState(true);

  // 초기 설정 로드
  useEffect(() => {
    (async () => {
      try {
        const profile = await getMyProfile();
        if (profile?.settings?.notifyOnReply !== undefined) {
          setNotifyOnReplyState(profile.settings.notifyOnReply);
        }
      } catch (e) {
        console.error('[SettingsProvider] failed to load settings:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 알림 설정 변경 함수
  const setNotifyOnReply = async (value: boolean) => {
    try {
      await updateSettings({ notifyOnReply: value });
      setNotifyOnReplyState(value);
    } catch (e) {
      console.error('[SettingsProvider] failed to update notifyOnReply:', e);
      throw e;
    }
  };

  const value: SettingsContextType = {
    notifyOnReply,
    setNotifyOnReply,
    loading,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
