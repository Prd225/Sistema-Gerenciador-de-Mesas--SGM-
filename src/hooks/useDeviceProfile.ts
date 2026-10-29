import { useState, useEffect } from 'react';

export interface DeviceProfile {
  /** Dispositivo com tela sensível ao toque (dedo/caneta) */
  isTouch: boolean;
  /** Smartphone em modo retrato ou telas pequenas (< 768px) */
  isMobile: boolean;
  /** Tablets em retrato ou telas médias (768px - 1279px) */
  isTablet: boolean;
  /** Computadores desktop ou telas grandes (>= 1280px) */
  isDesktop: boolean;
  /** Orientação atual do dispositivo */
  orientation: 'portrait' | 'landscape';
  /** Largura da viewport em pixels */
  screenWidth: number;
  /** Altura da viewport em pixels */
  screenHeight: number;
}

export function useDeviceProfile(): DeviceProfile {
  const [profile, setProfile] = useState<DeviceProfile>(() => {
    if (typeof window === 'undefined') {
      return {
        isTouch: false,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape',
        screenWidth: 1920,
        screenHeight: 1080,
      };
    }
    const isTouch =
      window.matchMedia('(pointer: coarse)').matches ||
      ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);
    const width = window.innerWidth;
    const height = window.innerHeight;
    return {
      isTouch,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1280,
      isDesktop: width >= 1280,
      orientation: height > width ? 'portrait' : 'landscape',
      screenWidth: width,
      screenHeight: height,
    };
  });

  useEffect(() => {
    const updateProfile = () => {
      const isTouch =
        window.matchMedia('(pointer: coarse)').matches ||
        ('maxTouchPoints' in navigator && navigator.maxTouchPoints > 0);
      const width = window.innerWidth;
      const height = window.innerHeight;
      setProfile({
        isTouch,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1280,
        isDesktop: width >= 1280,
        orientation: height > width ? 'portrait' : 'landscape',
        screenWidth: width,
        screenHeight: height,
      });
    };

    window.addEventListener('resize', updateProfile);
    window.addEventListener('orientationchange', updateProfile);

    const mql = window.matchMedia('(pointer: coarse)');
    if (mql.addEventListener) {
      mql.addEventListener('change', updateProfile);
    } else if ('addListener' in mql) {
      (mql as any).addListener(updateProfile);
    }

    return () => {
      window.removeEventListener('resize', updateProfile);
      window.removeEventListener('orientationchange', updateProfile);
      if (mql.removeEventListener) {
        mql.removeEventListener('change', updateProfile);
      } else if ('removeListener' in mql) {
        (mql as any).removeListener(updateProfile);
      }
    };
  }, []);

  return profile;
}
