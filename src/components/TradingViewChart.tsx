import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol: string;
  theme?: 'light' | 'dark';
  interval?: string;
}

export default function TradingViewChart({ symbol, theme = 'light', interval = 'D' }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    console.log('[TradingView] 컨테이너 크기:', { width: rect.width, height: rect.height, symbol });

    // 기존 스크립트 제거
    if (scriptRef.current) {
      scriptRef.current.remove();
      scriptRef.current = null;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Asia/Seoul',
      theme,
      style: '1',
      locale: 'ko_KR',
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      hide_legend: false,
      calendar: false,
      support_host: 'https://www.tradingview.com',
    });

    script.onload = () => console.log('[TradingView] 스크립트 로드 성공:', symbol);
    script.onerror = (e) => console.error('[TradingView] 스크립트 로드 실패:', e);

    scriptRef.current = script;
    container.appendChild(script);

    return () => {
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
    };
  }, [symbol, theme, interval]);

  return (
    <div className="tradingview-widget-container w-full h-full" ref={containerRef}>
      <div className="tradingview-widget-container__widget w-full h-full"></div>
    </div>
  );
}
