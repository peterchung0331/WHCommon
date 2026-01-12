'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Info, AlertTriangle, AlertCircle } from 'lucide-react';

interface Banner {
  id: number;
  title: string;
  message: string;
  variant: 'info' | 'warning' | 'critical';
  action_type: 'none' | 'link' | 'modal';
  action_url?: string;
  modal_content?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  target_hubs?: string[];
  dismiss_duration: number;
  order_index: number;
}

interface GlobalBannerProps {
  hubSlug: string;
  apiBaseUrl: string;
  onVisibilityChange?: (visible: boolean) => void;
}

const VARIANT_CONFIGS = {
  info: {
    bgClass: 'bg-gradient-to-r from-blue-500 to-purple-500',
    icon: Info,
  },
  warning: {
    bgClass: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    icon: AlertTriangle,
  },
  critical: {
    bgClass: 'bg-gradient-to-r from-red-500 to-pink-500',
    icon: AlertCircle,
  },
} as const;

export function GlobalBanner({ hubSlug, apiBaseUrl, onVisibilityChange }: GlobalBannerProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveBanners();
  }, [hubSlug, apiBaseUrl]);

  useEffect(() => {
    onVisibilityChange?.(banners.length > 0);
  }, [banners.length, onVisibilityChange]);

  const loadActiveBanners = async () => {
    try {
      setLoading(true);

      // JWT 토큰 가져오기 (쿠키에서)
      // wbhub_access_token 또는 jwt_token 쿠키를 찾음
      let token = document.cookie
        .split('; ')
        .find(row => row.startsWith('wbhub_access_token='))
        ?.split('=')[1];

      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('jwt_token='))
          ?.split('=')[1];
      }

      if (!token) {
        console.warn('No JWT token found, skipping banner fetch');
        setBanners([]);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/banners/active?hub=${hubSlug}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch banners: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setBanners(data.data);
      }
    } catch (error) {
      console.error('Failed to load banners:', error);
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (bannerId: number) => {
    try {
      // JWT 토큰 가져오기 (wbhub_access_token 또는 jwt_token)
      let token = document.cookie
        .split('; ')
        .find(row => row.startsWith('wbhub_access_token='))
        ?.split('=')[1];

      if (!token) {
        token = document.cookie
          .split('; ')
          .find(row => row.startsWith('jwt_token='))
          ?.split('=')[1];
      }

      if (!token) {
        console.warn('No JWT token found');
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/banners/${bannerId}/dismiss`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to dismiss banner: ${response.status}`);
      }

      // 현재 배너를 목록에서 제거
      setBanners(prev => prev.filter(b => b.id !== bannerId));

      // 인덱스 조정
      if (currentIndex >= banners.length - 1) {
        setCurrentIndex(Math.max(0, currentIndex - 1));
      }
    } catch (error) {
      console.error('Failed to dismiss banner:', error);
    }
  };

  const handleBannerClick = (banner: Banner) => {
    if (banner.action_type === 'link' && banner.action_url) {
      // 링크 이동 (내부/외부 링크 모두 지원)
      if (banner.action_url.startsWith('http')) {
        window.open(banner.action_url, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = banner.action_url;
      }
    } else if (banner.action_type === 'modal' && banner.modal_content) {
      // 모달 팝업
      setModalContent(banner.modal_content);
      setShowModal(true);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === banners.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return null; // 로딩 중에는 아무것도 표시하지 않음
  }

  if (banners.length === 0) {
    return null; // 배너가 없으면 렌더링하지 않음
  }

  const currentBanner = banners[currentIndex];
  const variantConfig = VARIANT_CONFIGS[currentBanner.variant];
  const VariantIcon = variantConfig.icon;
  const isClickable = currentBanner.action_type !== 'none';

  return (
    <>
      {/* 배너 */}
      <div className={`${variantConfig.bgClass} text-white shadow-md relative`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* 왼쪽: 아이콘 + 메시지 */}
            <div
              className={`flex items-center gap-3 flex-1 ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => isClickable && handleBannerClick(currentBanner)}
            >
              <VariantIcon className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {currentBanner.message}
              </p>
            </div>

            {/* 오른쪽: 캐러셀 컨트롤 + 닫기 버튼 */}
            <div className="flex items-center gap-2">
              {/* 캐러셀 컨트롤 (배너가 2개 이상일 때만 표시) */}
              {banners.length > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevious}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label="이전 배너"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* 인디케이터 */}
                  <div className="flex items-center gap-1">
                    {banners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentIndex
                            ? 'bg-white w-6'
                            : 'bg-white/50 hover:bg-white/70'
                        }`}
                        aria-label={`배너 ${index + 1}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label="다음 배너"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 닫기 버튼 */}
              <button
                onClick={() => handleDismiss(currentBanner.id)}
                className="p-1 hover:bg-white/20 rounded transition-colors ml-2"
                aria-label="배너 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden">
            {/* 모달 헤더 */}
            <div className={`px-6 py-4 ${variantConfig.bgClass}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VariantIcon className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">
                    {currentBanner.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 모달 바디 */}
            <div className="p-6">
              <div
                className="prose max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: modalContent }}
              />
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
