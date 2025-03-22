import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollbarProps {
  children: ReactNode;
  className?: string;
  trackClassName?: string;
  thumbClassName?: string;
  style?: React.CSSProperties;
  trackStyle?: React.CSSProperties;
  thumbStyle?: React.CSSProperties;
  maxHeight?: string | number; // 최대 높이 prop 추가
}

const Scrollbar: React.FC<ScrollbarProps> = ({
  children,
  className = '',
  trackClassName = '',
  thumbClassName = '',
  style = {},
  trackStyle = {},
  thumbStyle = {},
  maxHeight = '100%', // 기본값은 100%
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollInfo, setScrollInfo] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [showScrollbar, setShowScrollbar] = useState(false);

  // 스크롤 정보 업데이트 및 스크롤바 표시 여부 결정
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setScrollInfo({ scrollTop, scrollHeight, clientHeight });

      // 스크롤이 필요한 경우에만 스크롤바 표시
      setShowScrollbar(scrollHeight > clientHeight);
    }
  };

  // 컴포넌트 마운트/언마운트 시 스크롤 이벤트 리스너 등록/해제
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);

      // 초기 스크롤 정보 설정 및 스크롤바 표시 여부 결정
      handleScroll();

      // ResizeObserver를 사용하여 컨텐츠 크기 변화 감지
      const resizeObserver = new ResizeObserver(() => {
        handleScroll();
      });

      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        resizeObserver.disconnect();
      };
    }
  }, []);

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollContainerRef.current) return;

      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      const deltaY = e.clientY - startY;
      const deltaRatio = deltaY / clientHeight;
      const newScrollTop = scrollContainerRef.current.scrollTop + deltaRatio * scrollHeight;

      scrollContainerRef.current.scrollTop = newScrollTop;
      setStartY(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY]);

  // 스크롤바 썸 크기 계산 - 컨텐츠 대비 보이는 영역의 비율
  const thumbHeight = scrollInfo.scrollHeight > 0 ? Math.max(30, (scrollInfo.clientHeight / scrollInfo.scrollHeight) * scrollInfo.clientHeight) : 0;

  // 스크롤바 썸 위치 계산
  const thumbTop = scrollInfo.scrollHeight > scrollInfo.clientHeight ? (scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight)) * (scrollInfo.clientHeight - thumbHeight) : 0;

  return (
    <div className={`relative ${className}`} style={{ ...style, maxHeight }}>
      {/* 실제 스크롤 컨테이너 */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto h-full w-full pr-2"
        style={{
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      {/* 스크롤이 필요할 때만 커스텀 스크롤바 표시 */}
      {showScrollbar && (
        <div className={`absolute right-0 top-0 w-2 h-full rounded-full bg-[#CCCCCC] ${trackClassName}`} style={{ opacity: 0.5, ...trackStyle }}>
          {/* 커스텀 스크롤바 썸(thumb) */}
          <div
            className={`absolute w-2 rounded-full bg-[#5C5C5C] hover:bg-[#333333] cursor-pointer ${thumbClassName}`}
            style={{
              height: `${thumbHeight}px`,
              top: `${thumbTop}px`,
              transition: 'background-color 0.2s',
              ...thumbStyle,
            }}
            onMouseDown={handleThumbMouseDown}
          />
        </div>
      )}
    </div>
  );
};

export default Scrollbar;
