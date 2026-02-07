import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { fetchBinanceKlines, KlineInterval } from '../services/BinanceApi';

interface BinanceFuturesChartProps {
  symbol: string; // e.g. "BTCUSDT"
  theme?: 'light' | 'dark';
}

const INTERVAL_OPTIONS: { label: string; value: KlineInterval }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
];

export default function BinanceFuturesChart({ symbol, theme = 'light' }: BinanceFuturesChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [interval, setInterval] = useState<KlineInterval>('1h');
  const [isLoading, setIsLoading] = useState(true);

  // 차트 인스턴스 생성 & 리사이즈 관리
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const isDark = theme === 'dark';

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? '#1E1E1E' : '#FFFFFF' },
        textColor: isDark ? '#D9D9D9' : '#26262C',
        fontFamily: 'Pretendard, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? '#2B2B43' : '#E6E6E6' },
        horzLines: { color: isDark ? '#2B2B43' : '#E6E6E6' },
      },
      crosshair: { mode: 0 },
      rightPriceScale: {
        borderColor: isDark ? '#2B2B43' : '#E6E6E6',
      },
      timeScale: {
        borderColor: isDark ? '#2B2B43' : '#E6E6E6',
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: container.clientHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#639d01',
      downColor: '#ea0070',
      borderDownColor: '#ea0070',
      borderUpColor: '#639d01',
      wickDownColor: '#ea0070',
      wickUpColor: '#639d01',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // 컨테이너 리사이즈 시 차트 자동 조절
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [theme]);

  // WebSocket 연결 관리
  const connectWebSocket = useCallback((sym: string, intv: KlineInterval) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    const streamName = `${sym.toLowerCase()}@kline_${intv}`;
    const ws = new WebSocket(`wss://fstream.binance.com/ws/${streamName}`);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const k = msg.k;
        if (!k) return;

        const time = (Math.floor(k.t / 1000)) as unknown as Time;
        const open = parseFloat(k.o);
        const close = parseFloat(k.c);

        const candleUpdate: CandlestickData = {
          time,
          open,
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close,
        };

        candlestickSeriesRef.current?.update(candleUpdate);
        volumeSeriesRef.current?.update({
          time,
          value: parseFloat(k.v),
          color: close >= open ? 'rgba(99,157,1,0.4)' : 'rgba(234,0,112,0.4)',
        });
      } catch (error) {
        console.error('Kline WebSocket 데이터 파싱 오류:', error);
      }
    };

    ws.onclose = () => {
      console.log(`Kline WebSocket 종료: ${streamName}, 5초 후 재연결...`);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (wsRef.current === ws) {
          connectWebSocket(sym, intv);
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('Kline WebSocket 오류:', error);
    };

    wsRef.current = ws;
  }, []);

  // 데이터 로드 & WebSocket 연결
  useEffect(() => {
    if (!candlestickSeriesRef.current || !volumeSeriesRef.current) return;

    let cancelled = false;

    const loadData = async () => {
      setIsLoading(true);

      const klines = await fetchBinanceKlines(symbol, interval, 500);
      if (cancelled) return;

      const candles: CandlestickData[] = klines.map((k) => ({
        time: k.time as unknown as Time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));

      const volumes = klines.map((k) => ({
        time: k.time as unknown as Time,
        value: k.volume,
        color: k.close >= k.open ? 'rgba(99,157,1,0.4)' : 'rgba(234,0,112,0.4)',
      }));

      candlestickSeriesRef.current?.setData(candles);
      volumeSeriesRef.current?.setData(volumes);
      chartRef.current?.timeScale().fitContent();

      setIsLoading(false);

      connectWebSocket(symbol, interval);
    };

    loadData();

    return () => {
      cancelled = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [symbol, interval, connectWebSocket]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 인터벌 선택 툴바 */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 border-b border-[#E6E6E6]">
        {INTERVAL_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setInterval(opt.value)} className={`px-3 py-1 text-xs font-medium rounded transition-colors ${interval === opt.value ? 'bg-[#4C4C57] text-white' : 'text-[#666666] hover:bg-[#E0E0E0]'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* 차트 컨테이너 */}
      <div className="flex-1 min-h-0 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
            <span className="text-[#666666] text-sm">Loading...</span>
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
