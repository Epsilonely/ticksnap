import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, ColorType, createSeriesMarkers, LineStyle } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, ISeriesMarkersPluginApi, IPriceLine, CandlestickData, Time, LogicalRange } from 'lightweight-charts';
import { fetchBinanceKlines, KlineInterval } from '../services/BinanceApi';

interface BinanceFuturesChartProps {
  symbol: string; // e.g. "BTCUSDT"
  theme?: 'light' | 'dark';
  position?: {
    entryPrice: number;
    positionAmt: number;
    positionSide: 'LONG' | 'SHORT' | 'BOTH';
  } | null;
}

const INTERVAL_OPTIONS: { label: string; value: KlineInterval }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: '4h', value: '4h' },
  { label: '1D', value: '1d' },
];

export default function BinanceFuturesChart({ symbol, theme = 'light', position }: BinanceFuturesChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const highPriceLineRef = useRef<IPriceLine | null>(null);
  const lowPriceLineRef = useRef<IPriceLine | null>(null);
  const positionPriceLineRef = useRef<IPriceLine | null>(null);

  // 과거 데이터 로딩 관련 refs
  const allCandlesRef = useRef<CandlestickData[]>([]);
  const allVolumesRef = useRef<{ time: Time; value: number; color: string }[]>([]);
  const isLoadingMoreRef = useRef(false);
  const noMoreDataRef = useRef(false);

  const [interval, setInterval] = useState<KlineInterval>('1h');
  const [isLoading, setIsLoading] = useState(true);

  // 과거 데이터 추가 로딩
  const loadOlderData = useCallback(async (sym: string, intv: KlineInterval) => {
    if (isLoadingMoreRef.current || noMoreDataRef.current) return;
    if (allCandlesRef.current.length === 0) return;

    isLoadingMoreRef.current = true;

    const oldestTime = allCandlesRef.current[0].time as unknown as number;
    // oldestTime은 초 단위 → 밀리초로 변환, -1ms로 현재 첫 캔들 제외
    const endTime = oldestTime * 1000 - 1;

    const klines = await fetchBinanceKlines(sym, intv, 500, endTime);

    if (klines.length === 0) {
      noMoreDataRef.current = true;
      isLoadingMoreRef.current = false;
      return;
    }

    const newCandles: CandlestickData[] = klines.map((k) => ({
      time: k.time as unknown as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    const newVolumes = klines.map((k) => ({
      time: k.time as unknown as Time,
      value: k.volume,
      color: k.close >= k.open ? 'rgba(99,157,1,0.4)' : 'rgba(234,0,112,0.4)',
    }));

    // 기존 데이터 앞에 prepend
    allCandlesRef.current = [...newCandles, ...allCandlesRef.current];
    allVolumesRef.current = [...newVolumes, ...allVolumesRef.current];

    candlestickSeriesRef.current?.setData(allCandlesRef.current);
    volumeSeriesRef.current?.setData(allVolumesRef.current);

    isLoadingMoreRef.current = false;
  }, []);

  // 보이는 범위의 최고/최저가 마커 + price line 업데이트
  const updateHighLowMarkers = useCallback(() => {
    const chart = chartRef.current;
    const series = candlestickSeriesRef.current;
    if (!chart || !series || !markersPluginRef.current) return;

    const logicalRange = chart.timeScale().getVisibleLogicalRange();
    if (!logicalRange) return;

    const candles = allCandlesRef.current;
    if (candles.length === 0) return;

    const from = Math.max(0, Math.floor(logicalRange.from));
    const to = Math.min(candles.length - 1, Math.ceil(logicalRange.to));
    if (from > to) return;

    let highIdx = from;
    let lowIdx = from;

    for (let i = from + 1; i <= to; i++) {
      if (candles[i].high > candles[highIdx].high) highIdx = i;
      if (candles[i].low < candles[lowIdx].low) lowIdx = i;
    }

    // 마커: 화살표만 (텍스트 없음)
    const highMarker = {
      time: candles[highIdx].time,
      position: 'aboveBar' as const,
      color: '#639d01',
      shape: 'arrowDown' as const,
    };

    const lowMarker = {
      time: candles[lowIdx].time,
      position: 'belowBar' as const,
      color: '#ea0070',
      shape: 'arrowUp' as const,
    };

    markersPluginRef.current?.setMarkers(highIdx <= lowIdx ? [highMarker, lowMarker] : [lowMarker, highMarker]);

    // 기존 price line 제거
    if (highPriceLineRef.current) {
      series.removePriceLine(highPriceLineRef.current);
      highPriceLineRef.current = null;
    }
    if (lowPriceLineRef.current) {
      series.removePriceLine(lowPriceLineRef.current);
      lowPriceLineRef.current = null;
    }

    // price line: y축에 가격 표시 (점선)
    highPriceLineRef.current = series.createPriceLine({
      price: candles[highIdx].high,
      color: '#639d01',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      lineVisible: true,
    });

    lowPriceLineRef.current = series.createPriceLine({
      price: candles[lowIdx].low,
      color: '#ea0070',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      lineVisible: true,
    });
  }, []);

  // visible range 변경 핸들러
  const handleVisibleRangeChange = useCallback(
    (logicalRange: LogicalRange | null) => {
      if (!logicalRange || !candlestickSeriesRef.current) return;

      const barsInfo = candlestickSeriesRef.current.barsInLogicalRange(logicalRange);
      if (barsInfo !== null && barsInfo.barsBefore < 10) {
        loadOlderData(symbol, interval);
      }

      updateHighLowMarkers();
    },
    [symbol, interval, loadOlderData, updateHighLowMarkers],
  );

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
        panes: {
          enableResize: true,
          separatorColor: isDark ? '#2B2B43' : '#E6E6E6',
        },
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
        rightOffset: 7,
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

    const volumePane = chart.addPane();
    volumePane.setStretchFactor(0.25);
    const volumeSeries = volumePane.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    markersPluginRef.current = createSeriesMarkers(candleSeries);

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
      markersPluginRef.current?.detach();
      markersPluginRef.current = null;
      highPriceLineRef.current = null;
      lowPriceLineRef.current = null;
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

        const time = Math.floor(k.t / 1000) as unknown as Time;
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

    // 심볼/인터벌 변경 시 상태 초기화
    allCandlesRef.current = [];
    allVolumesRef.current = [];
    isLoadingMoreRef.current = false;
    noMoreDataRef.current = false;

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

      allCandlesRef.current = candles;
      allVolumesRef.current = volumes;

      candlestickSeriesRef.current?.setData(candles);
      volumeSeriesRef.current?.setData(volumes);
      const totalBars = candles.length;
      chartRef.current?.timeScale().setVisibleLogicalRange({
        from: totalBars - 50,
        to: totalBars + 5,
      });

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

  // visible range 변경 구독 (과거 데이터 자동 로딩)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    };
  }, [handleVisibleRangeChange]);

  // 포지션 진입가 표시
  useEffect(() => {
    const series = candlestickSeriesRef.current;
    if (!series) return;

    // 기존 포지션 price line 제거
    if (positionPriceLineRef.current) {
      series.removePriceLine(positionPriceLineRef.current);
      positionPriceLineRef.current = null;
    }

    // 포지션이 없으면 종료
    if (!position) return;

    const { entryPrice, positionSide } = position;

    // Long: 파란색, Short: 주황색
    const color = positionSide === 'SHORT' ? '#FF9800' : '#2196F3';
    const label = `Entry: $${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    positionPriceLineRef.current = series.createPriceLine({
      price: entryPrice,
      color,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: label,
      lineVisible: true,
    });
  }, [position]);

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
