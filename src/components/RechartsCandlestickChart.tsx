import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Bar,
  Line,
  Area,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  BarChart2,
  Activity,
  TrendingUp,
  X,
  Pencil,
  Minus,
  Type,
  Trash2,
  Plus,
  Sliders,
  Layers,
  Sparkles,
  Check,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CandleRecord {
  time?: number | string;
  tick?: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface SupportResistanceLine {
  id: string;
  type: 'support' | 'resistance' | 'line';
  price: number;
  label: string;
  color: string;
  style: 'solid' | 'dashed';
}

export interface TextAnnotation {
  id: string;
  text: string;
  price: number;
  color: string;
}

interface RechartsCandlestickChartProps {
  data: CandleRecord[];
  symbol: string;
  currentPrice?: number;
  height?: number;
}

// Pseudo-random number generator for stable synthetic fallbacks
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate realistic synthetic candles if data is loading or empty
const generateSyntheticCandles = (symbol: string, price: number = 100, count = 35, timeframe: string = '1H') => {
  const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL') || symbol.includes('XRP');
  const isJpy = symbol.includes('JPY');
  const step = isCrypto ? (price * 0.012) : isJpy ? 0.35 : price * 0.0016;

  let baseSeed = 0;
  for (let i = 0; i < symbol.length; i++) baseSeed += symbol.charCodeAt(i);

  const candles: any[] = [];
  let lastClose = price - step * 2;
  const now = Date.now();

  const stepMs = timeframe === '1D' ? 86400 * 1000 : timeframe === '4H' ? 14400 * 1000 : timeframe === '1H' ? 3600 * 1000 : 900 * 1000;

  for (let i = count - 1; i >= 0; i--) {
    const timeSec = Math.floor((now - i * stepMs) / 1000);
    const dateObj = new Date(timeSec * 1000);
    const tickLabel = timeframe === '1D' 
      ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
      : timeframe === '4H' || timeframe === '1H'
      ? `${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const rand = seededRandom(baseSeed + i);
    const change = (rand - 0.48) * step;

    const open = lastClose;
    let close = open + change;
    if (i === 0) close = price;

    const randHigh = seededRandom(baseSeed + i + 50);
    const randLow = seededRandom(baseSeed + i + 100);

    const high = Math.max(open, close) + randHigh * (step * 0.4);
    const low = Math.min(open, close) - randLow * (step * 0.4);

    candles.push({
      time: timeSec,
      tick: tickLabel,
      open: Number(open.toFixed(isJpy ? 2 : isCrypto && price > 1000 ? 2 : 5)),
      high: Number(high.toFixed(isJpy ? 2 : isCrypto && price > 1000 ? 2 : 5)),
      low: Number(low.toFixed(isJpy ? 2 : isCrypto && price > 1000 ? 2 : 5)),
      close: Number(close.toFixed(isJpy ? 2 : isCrypto && price > 1000 ? 2 : 5)),
      isBullish: close >= open
    });

    lastClose = close;
  }
  return candles;
};

// Custom Candlestick Shape Renderer for Recharts
const CustomCandlestickShape = (props: any) => {
  const { x, y, width, payload, yAxis } = props;
  if (!payload || !yAxis || typeof yAxis.scale !== 'function') return null;

  const { open, close, high, low, isBullish } = payload;
  const color = isBullish ? '#10b981' : '#f43f5e';

  const yHigh = yAxis.scale(high);
  const yLow = yAxis.scale(low);
  const yOpen = yAxis.scale(open);
  const yClose = yAxis.scale(close);

  const bodyY = Math.min(yOpen, yClose);
  const bodyHeight = Math.max(Math.abs(yOpen - yClose), 2);
  const candleWidth = Math.max(width * 0.65, 3);
  const midX = x + width / 2;

  return (
    <g className="recharts-candlestick-group">
      {/* High/Low Wick Line */}
      <line
        x1={midX}
        y1={yHigh}
        x2={midX}
        y2={yLow}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Candle Body */}
      <rect
        x={midX - candleWidth / 2}
        y={bodyY}
        width={candleWidth}
        height={bodyHeight}
        fill={color}
        stroke={color}
        strokeWidth={1}
        rx={1.5}
      />
    </g>
  );
};

// Custom Tooltip for Recharts Candlestick
const CustomCandleTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;

    const isBull = data.isBullish;
    const colorClass = isBull ? 'text-emerald-400' : 'text-rose-400';

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-2xl font-mono text-xs text-white z-50 min-w-52 leading-relaxed">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <span className="font-bold text-slate-400 text-[11px]">{data.tick}</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase tracking-wider ${isBull ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-rose-500/30'}`}>
            {isBull ? '▲ BULLISH' : '▼ BEARISH'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
          <div>
            <span className="text-slate-500 text-[9px] uppercase font-black block">Open</span>
            <span className="font-bold text-slate-200">{data.open?.toFixed(5)}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] uppercase font-black block">Close</span>
            <span className={`font-bold ${colorClass}`}>{data.close?.toFixed(5)}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] uppercase font-black block">High</span>
            <span className="font-bold text-emerald-400">{data.high?.toFixed(5)}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[9px] uppercase font-black block">Low</span>
            <span className="font-bold text-rose-400">{data.low?.toFixed(5)}</span>
          </div>
        </div>

        {data.volume && (
          <div className="border-t border-slate-800 pt-1.5 flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-bold">Vol:</span>
            <span className="font-mono text-slate-200 font-bold">{data.volume?.toLocaleString()}</span>
          </div>
        )}

        {data.sma20 !== undefined && (
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-amber-400 font-bold">SMA (20):</span>
            <span className="font-mono text-amber-300 font-bold">{data.sma20?.toFixed(5)}</span>
          </div>
        )}

        {data.ema50 !== undefined && (
          <div className="mt-1 flex items-center justify-between text-[10px]">
            <span className="text-cyan-400 font-bold">EMA (50):</span>
            <span className="font-mono text-cyan-300 font-bold">{data.ema50?.toFixed(5)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function RechartsCandlestickChart({
  data,
  symbol,
  currentPrice,
  height = 240
}: RechartsCandlestickChartProps) {
  const [timeframe, setTimeframe] = useState<'1M' | '5M' | '15M' | '1H' | '4H' | '1D'>('5M');
  const [chartType, setChartType] = useState<'candles' | 'area' | 'heikin'>('candles');
  const [showSma, setShowSma] = useState(true);
  const [showEma, setShowEma] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number>(30);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Drawing Tools State
  const [activeTool, setActiveTool] = useState<'none' | 'support' | 'resistance' | 'line' | 'text'>('none');
  const [isManageDrawingsOpen, setIsManageDrawingsOpen] = useState(false);
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [pendingAnnotationPrice, setPendingAnnotationPrice] = useState<number>(0);
  const [customText, setCustomText] = useState('Key Reaction Zone');
  const [customTextColor, setCustomTextColor] = useState('#f59e0b');

  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Load / Save Drawings Persistence
  const [drawingLines, setDrawingLines] = useState<SupportResistanceLine[]>(() => {
    try {
      const saved = localStorage.getItem(`axi_chart_lines_${symbol}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [textAnnotations, setTextAnnotations] = useState<TextAnnotation[]>(() => {
    try {
      const saved = localStorage.getItem(`axi_chart_texts_${symbol}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(`axi_chart_lines_${symbol}`, JSON.stringify(drawingLines));
    } catch (e) {
      console.error(e);
    }
  }, [drawingLines, symbol]);

  useEffect(() => {
    try {
      localStorage.setItem(`axi_chart_texts_${symbol}`, JSON.stringify(textAnnotations));
    } catch (e) {
      console.error(e);
    }
  }, [textAnnotations, symbol]);

  const [fetchedHistory, setFetchedHistory] = useState<CandleRecord[]>([]);

  // Fetch real market history candles from server API
  useEffect(() => {
    let isMounted = true;
    const fetchHistoryData = async () => {
      try {
        const res = await fetch(`/api/markets/history?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}`);
        if (res.ok) {
          const raw = await res.json();
          if (Array.isArray(raw) && raw.length > 0 && isMounted) {
            const formatted = raw.map((c: any) => {
              const dateObj = c.time ? new Date(c.time * 1000) : new Date();
              const tickLabel = timeframe === '1D' 
                ? dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })
                : timeframe === '4H' || timeframe === '1H'
                ? `${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return {
                time: c.time,
                tick: tickLabel,
                open: Number(c.open),
                high: Number(c.high),
                low: Number(c.low),
                close: Number(c.close),
                volume: c.volume ? Number(c.volume) : undefined,
                isBullish: c.close >= c.open
              };
            });
            setFetchedHistory(formatted);
          }
        }
      } catch (err) {
        console.error('Failed to fetch real market history:', err);
      }
    };

    fetchHistoryData();
    return () => { isMounted = false; };
  }, [symbol, timeframe]);

  // Process data for Recharts
  const formattedData = useMemo(() => {
    let rawList = data && data.length > 0 
      ? [...data] 
      : fetchedHistory.length > 0 
      ? [...fetchedHistory] 
      : generateSyntheticCandles(symbol, currentPrice, 35, timeframe);

    // Apply real-time live price tick update to the latest candle if currentPrice is provided
    if (currentPrice && rawList.length > 0) {
      const lastIdx = rawList.length - 1;
      const lastCandle = { ...rawList[lastIdx] };
      lastCandle.close = Number(currentPrice);
      if (currentPrice > lastCandle.high) lastCandle.high = Number(currentPrice);
      if (currentPrice < lastCandle.low) lastCandle.low = Number(currentPrice);
      lastCandle.isBullish = lastCandle.close >= lastCandle.open;
      rawList[lastIdx] = lastCandle;
    }

    // Apply Heikin-Ashi transformation if selected
    if (chartType === 'heikin') {
      let prevHaOpen = rawList[0]?.open || 1;
      let prevHaClose = rawList[0]?.close || 1;

      rawList = rawList.map((item) => {
        const o = Number(item.open);
        const h = Number(item.high);
        const l = Number(item.low);
        const c = Number(item.close);

        const haClose = (o + h + l + c) / 4;
        const haOpen = (prevHaOpen + prevHaClose) / 2;
        const haHigh = Math.max(h, haOpen, haClose);
        const haLow = Math.min(l, haOpen, haClose);

        prevHaOpen = haOpen;
        prevHaClose = haClose;

        return {
          ...item,
          open: Number(haOpen.toFixed(5)),
          high: Number(haHigh.toFixed(5)),
          low: Number(haLow.toFixed(5)),
          close: Number(haClose.toFixed(5))
        };
      });
    }

    // Process technical indicators
    let prevEma = rawList[0]?.close || 0;
    const kEma = 2 / (20 + 1);

    const processed = rawList.map((item, idx, arr) => {
      let tickLabel = '';
      if (typeof item.time === 'number') {
        const d = new Date(item.time * 1000);
        tickLabel = timeframe === '1D' 
          ? d.toLocaleDateString([], { month: 'short', day: 'numeric' })
          : timeframe === '4H' || timeframe === '1H'
          ? `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (item.tick) {
        tickLabel = item.tick;
      } else {
        tickLabel = `T-${arr.length - idx}`;
      }

      const open = Number(item.open);
      const high = Number(item.high);
      const low = Number(item.low);
      const close = Number(item.close);
      const isBullish = close >= open;

      // Calculate SMA 20
      let sma20: number | undefined = undefined;
      if (idx >= 9) {
        const slice = arr.slice(Math.max(0, idx - 9), idx + 1);
        const sum = slice.reduce((acc, curr) => acc + Number(curr.close), 0);
        sma20 = Number((sum / slice.length).toFixed(5));
      }

      // Calculate EMA 20
      const ema50 = Number((close * kEma + prevEma * (1 - kEma)).toFixed(5));
      prevEma = ema50;

      // Volume estimation
      const rangeVal = Math.abs(high - low);
      const vol = item.volume ? item.volume : Math.round(rangeVal * 1000000 + (Math.abs(Math.sin(idx)) * 1200 + 400));

      return {
        tick: tickLabel,
        timestamp: item.time || idx,
        open,
        high,
        low,
        close,
        range: [low, high] as [number, number],
        volume: vol,
        isBullish,
        sma20,
        ema50
      };
    });

    // Slice according to zoom level
    return processed.slice(-visibleCount);
  }, [data, fetchedHistory, symbol, currentPrice, chartType, visibleCount, timeframe]);

  // Calculate dynamic min/max for YAxis domain
  const { yMin, yMax } = useMemo(() => {
    if (!formattedData || formattedData.length === 0) return { yMin: 0, yMax: 100 };
    let min = Infinity;
    let max = -Infinity;
    formattedData.forEach(d => {
      if (d.low < min) min = d.low;
      if (d.high > max) max = d.high;
    });
    const padding = (max - min) * 0.08 || 0.001;
    return {
      yMin: Number((min - padding).toFixed(5)),
      yMax: Number((max + padding).toFixed(5))
    };
  }, [formattedData]);

  // Seed default Support / Resistance lines if none exist
  useEffect(() => {
    if (drawingLines.length === 0 && yMin > 0 && yMax > 0) {
      const range = yMax - yMin;
      const supp = Number((yMin + range * 0.22).toFixed(5));
      const res = Number((yMax - range * 0.22).toFixed(5));
      setDrawingLines([
        {
          id: `line-${Date.now()}-1`,
          type: 'support',
          price: supp,
          label: 'Key Support S1',
          color: '#10b981',
          style: 'dashed'
        },
        {
          id: `line-${Date.now()}-2`,
          type: 'resistance',
          price: res,
          label: 'Key Resistance R1',
          color: '#f43f5e',
          style: 'dashed'
        }
      ]);

      if (textAnnotations.length === 0) {
        setTextAnnotations([
          {
            id: `text-${Date.now()}-1`,
            text: 'Bullish Order Block',
            price: supp,
            color: '#10b981'
          }
        ]);
      }
    }
  }, [yMin, yMax, symbol]);

  const latestCandle = formattedData[formattedData.length - 1] || {
    open: 0, high: 0, low: 0, close: 0, isBullish: true, tick: ''
  };

  // Click Canvas handler to draw at clicked price
  const handleChartCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'none' || !chartContainerRef.current) return;

    const rect = chartContainerRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const padding = 15;
    const availableHeight = rect.height - padding * 2;
    if (availableHeight <= 0) return;

    const ratio = Math.max(0, Math.min(1, (clickY - padding) / availableHeight));
    const calculatedPrice = yMax - ratio * (yMax - yMin);
    const formattedPrice = Number(calculatedPrice.toFixed(symbol.includes('JPY') ? 2 : 5));

    if (activeTool === 'support') {
      const newLine: SupportResistanceLine = {
        id: `line-${Date.now()}`,
        type: 'support',
        price: formattedPrice,
        label: 'Support Level',
        color: '#10b981',
        style: 'dashed'
      };
      setDrawingLines(prev => [...prev, newLine]);
      setActiveTool('none');
    } else if (activeTool === 'resistance') {
      const newLine: SupportResistanceLine = {
        id: `line-${Date.now()}`,
        type: 'resistance',
        price: formattedPrice,
        label: 'Resistance Level',
        color: '#f43f5e',
        style: 'dashed'
      };
      setDrawingLines(prev => [...prev, newLine]);
      setActiveTool('none');
    } else if (activeTool === 'line') {
      const newLine: SupportResistanceLine = {
        id: `line-${Date.now()}`,
        type: 'line',
        price: formattedPrice,
        label: 'Price Level',
        color: '#3b82f6',
        style: 'solid'
      };
      setDrawingLines(prev => [...prev, newLine]);
      setActiveTool('none');
    } else if (activeTool === 'text') {
      setPendingAnnotationPrice(formattedPrice);
      setIsTextModalOpen(true);
      setActiveTool('none');
    }
  };

  // Quick Auto Detect S/R
  const handleAutoDetectSR = () => {
    const range = yMax - yMin;
    const autoSupp = Number((yMin + range * 0.15).toFixed(5));
    const autoRes = Number((yMax - range * 0.15).toFixed(5));

    const suppLine: SupportResistanceLine = {
      id: `line-${Date.now()}-supp`,
      type: 'support',
      price: autoSupp,
      label: 'Auto Support',
      color: '#10b981',
      style: 'dashed'
    };

    const resLine: SupportResistanceLine = {
      id: `line-${Date.now()}-res`,
      type: 'resistance',
      price: autoRes,
      label: 'Auto Resistance',
      color: '#f43f5e',
      style: 'dashed'
    };

    setDrawingLines(prev => [...prev.filter(l => !l.label.startsWith('Auto')), suppLine, resLine]);
  };

  // Confirm Text Annotation
  const handleAddTextAnnotation = () => {
    if (!customText.trim()) return;
    const newText: TextAnnotation = {
      id: `text-${Date.now()}`,
      text: customText.trim(),
      price: pendingAnnotationPrice || latestCandle.close || yMin,
      color: customTextColor
    };
    setTextAnnotations(prev => [...prev, newText]);
    setIsTextModalOpen(false);
    setCustomText('Key Reaction Zone');
  };

  const renderChartBody = (chartHeight: number) => (
    <div className="w-full flex flex-col gap-2">
      {/* Top Interactive Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-xs">
        {/* Left: Timeframe Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['1M', '5M', '15M', '1H', '4H', '1D'] as const).map(tf => (
            <button
              key={tf}
              type="button"
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-[10px] font-black uppercase transition cursor-pointer ${timeframe === tf ? 'bg-brand-red text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Center: Chart Type Toggles */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setChartType('candles')}
            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${chartType === 'candles' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            title="Classic OHLC Candlestick Chart"
          >
            <BarChart2 className="w-3 h-3" /> Candles
          </button>
          <button
            type="button"
            onClick={() => setChartType('heikin')}
            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${chartType === 'heikin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            title="Heikin-Ashi Smoothed Trend Candles"
          >
            <Activity className="w-3 h-3" /> Heikin-Ashi
          </button>
          <button
            type="button"
            onClick={() => setChartType('area')}
            className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer ${chartType === 'area' ? 'bg-cyan-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            title="Gradient Area Line Chart"
          >
            <TrendingUp className="w-3 h-3" /> Area
          </button>
        </div>

        {/* Right: Technical Indicators & Zoom */}
        <div className="flex items-center gap-2">
          {/* Indicators Toggle */}
          <div className="flex items-center gap-1 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setShowSma(!showSma)}
              className={`px-2 py-1 rounded border transition cursor-pointer ${showSma ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
            >
              SMA(20)
            </button>
            <button
              type="button"
              onClick={() => setShowEma(!showEma)}
              className={`px-2 py-1 rounded border transition cursor-pointer ${showEma ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
            >
              EMA(20)
            </button>
            <button
              type="button"
              onClick={() => setShowVolume(!showVolume)}
              className={`px-2 py-1 rounded border transition cursor-pointer ${showVolume ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-slate-950 text-slate-500 border-slate-800'}`}
            >
              Vol
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setVisibleCount(prev => Math.max(12, prev - 6))}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(prev => Math.min(60, prev + 6))}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1 hover:bg-slate-800 text-brand-yellow hover:text-white rounded transition cursor-pointer ml-1"
              title={isFullScreen ? "Exit Terminal Mode" : "Expand Broker Trading Terminal"}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* DRAWING TOOLS OVERLAY BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/95 px-3 py-2 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-black text-amber-400 uppercase tracking-wider">
            <Pencil className="w-3.5 h-3.5" />
            <span>Drawings:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {/* Support Tool */}
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'support' ? 'none' : 'support')}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer ${
                activeTool === 'support'
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
              title="Click chart canvas to place Horizontal Support line"
            >
              <Minus className="w-3 h-3" /> + Support
            </button>

            {/* Resistance Tool */}
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'resistance' ? 'none' : 'resistance')}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer ${
                activeTool === 'resistance'
                  ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                  : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
              }`}
              title="Click chart canvas to place Horizontal Resistance line"
            >
              <Minus className="w-3 h-3" /> + Resistance
            </button>

            {/* Custom Line Tool */}
            <button
              type="button"
              onClick={() => setActiveTool(activeTool === 'line' ? 'none' : 'line')}
              className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer ${
                activeTool === 'line'
                  ? 'bg-blue-500 text-white ring-2 ring-blue-300'
                  : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30'
              }`}
              title="Click chart canvas to place Custom Price Line"
            >
              <Minus className="w-3 h-3" /> + Line
            </button>

            {/* Text Note Tool */}
            <button
              type="button"
              onClick={() => {
                setPendingAnnotationPrice(latestCandle.close || yMin);
                setIsTextModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
              title="Add text annotation at specific price level"
            >
              <Type className="w-3 h-3" /> + Text Note
            </button>

            {/* Auto Detect S/R */}
            <button
              type="button"
              onClick={handleAutoDetectSR}
              className="px-2.5 py-1 rounded-lg font-extrabold text-[10px] flex items-center gap-1 transition cursor-pointer bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/30"
              title="Automatically calculate and place S/R levels"
            >
              <Sparkles className="w-3 h-3" /> Auto S/R
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Manage Drawings Button */}
          <button
            type="button"
            onClick={() => setIsManageDrawingsOpen(true)}
            className="px-2.5 py-1 rounded-lg font-bold text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Layers className="w-3 h-3 text-amber-400" />
            <span>Manage ({drawingLines.length + textAnnotations.length})</span>
          </button>

          {(drawingLines.length > 0 || textAnnotations.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setDrawingLines([]);
                setTextAnnotations([]);
              }}
              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition cursor-pointer"
              title="Clear all drawings"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Active Tool Banner Notification */}
      {activeTool !== 'none' && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>
              <strong>{activeTool.toUpperCase()} TOOL ACTIVE:</strong> Click anywhere on the chart canvas below to place drawing.
            </span>
          </div>
          <button
            onClick={() => setActiveTool('none')}
            className="text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Live OHLC Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/80 rounded-lg border border-slate-800/80 font-mono text-[11px]">
        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-bold uppercase text-[10px]">{symbol} {timeframe}:</span>
          <span className="text-slate-400">O: <strong className="text-white">{latestCandle.open?.toFixed(5)}</strong></span>
          <span className="text-slate-400">H: <strong className="text-emerald-400">{latestCandle.high?.toFixed(5)}</strong></span>
          <span className="text-slate-400">L: <strong className="text-rose-400">{latestCandle.low?.toFixed(5)}</strong></span>
          <span className="text-slate-400">C: <strong className={latestCandle.isBullish ? 'text-emerald-400' : 'text-rose-400'}>{latestCandle.close?.toFixed(5)}</strong></span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          REALTIME RECHARTS ECN
        </div>
      </div>

      {/* Main Recharts Container with Click Canvas Handler */}
      <div
        ref={chartContainerRef}
        onClick={handleChartCanvasClick}
        className={`w-full bg-slate-950 rounded-xl p-2 border border-slate-800 shadow-inner select-none relative overflow-hidden ${
          activeTool !== 'none' ? 'cursor-crosshair ring-2 ring-amber-500/50' : ''
        }`}
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={formattedData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="tick"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: '#1e293b' }}
            />

            <YAxis
              domain={[yMin, yMax]}
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              orientation="right"
              axisLine={{ stroke: '#1e293b' }}
              tickFormatter={(val) => val.toFixed(symbol.includes('JPY') ? 2 : symbol.includes('USD') && !symbol.includes('BTC') && !symbol.includes('XAU') ? 4 : 1)}
            />

            <Tooltip content={<CustomCandleTooltip />} />

            {/* Volume sub-bars */}
            {showVolume && (
              <Bar dataKey="volume" yAxisId="volAxis" opacity={0.35} radius={[2, 2, 0, 0]}>
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isBullish ? '#10b981' : '#f43f5e'} />
                ))}
              </Bar>
            )}

            {/* Volume Axis hidden */}
            <YAxis yAxisId="volAxis" hide domain={[0, 'dataMax * 3']} />

            {/* Render Area line if Area mode is enabled */}
            {chartType === 'area' && (
              <Area
                type="monotone"
                dataKey="close"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#areaGradient)"
              />
            )}

            {/* Render Candlesticks if Candles or Heikin-Ashi mode is enabled */}
            {(chartType === 'candles' || chartType === 'heikin') && (
              <Bar
                dataKey="range"
                shape={<CustomCandlestickShape />}
                isAnimationActive={false}
              />
            )}

            {/* SMA 20 Overlay Line */}
            {showSma && (
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#f59e0b"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* EMA 50 Overlay Line */}
            {showEma && (
              <Line
                type="monotone"
                dataKey="ema50"
                stroke="#06b6d4"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}

            {/* Current Price Reference Line */}
            {latestCandle.close && (
              <ReferenceLine
                y={latestCandle.close}
                stroke={latestCandle.isBullish ? '#10b981' : '#f43f5e'}
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
            )}

            {/* DRAWING TOOL OVERLAYS: Horizontal Support & Resistance Lines */}
            {drawingLines.map(line => (
              <ReferenceLine
                key={line.id}
                y={line.price}
                stroke={line.color}
                strokeDasharray={line.style === 'dashed' ? '5 5' : undefined}
                strokeWidth={2}
                label={{
                  value: `${line.label.toUpperCase()}: ${line.price.toFixed(symbol.includes('JPY') ? 2 : 5)}`,
                  fill: line.color,
                  position: line.type === 'resistance' ? 'insideTopLeft' : 'insideBottomLeft',
                  fontSize: 10,
                  fontWeight: 800,
                  fontFamily: 'monospace'
                }}
              />
            ))}

            {/* DRAWING TOOL OVERLAYS: Simple Text Annotations */}
            {textAnnotations.map(ann => (
              <ReferenceLine
                key={ann.id}
                y={ann.price}
                stroke={ann.color}
                strokeDasharray="2 2"
                strokeWidth={1.5}
                opacity={0.8}
                label={{
                  value: `📌 ${ann.text}`,
                  fill: '#ffffff',
                  position: 'insideRight',
                  fontSize: 11,
                  fontWeight: 700
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <>
      {renderChartBody(height)}

      {/* Add Text Annotation Modal */}
      <AnimatePresence>
        {isTextModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 text-white space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-sm">Add Text Annotation</h3>
                </div>
                <button onClick={() => setIsTextModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Annotation Text</label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="e.g., Key Order Block / Liquidity Grab"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price Level</label>
                  <input
                    type="number"
                    step="any"
                    value={pendingAnnotationPrice}
                    onChange={(e) => setPendingAnnotationPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Badge Color</label>
                  <div className="flex items-center gap-2">
                    {['#f59e0b', '#10b981', '#f43f5e', '#3b82f6', '#a855f7'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCustomTextColor(c)}
                        className={`w-7 h-7 rounded-full transition border-2 ${customTextColor === c ? 'border-white scale-110 shadow-md' : 'border-transparent opacity-80'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddTextAnnotation}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl transition text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Save Annotation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Drawings Drawer/Modal */}
      <AnimatePresence>
        {isManageDrawingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 text-white space-y-4 shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-extrabold text-base">Manage Chart Overlay Drawings</h3>
                    <p className="text-xs text-slate-400">{symbol} Support/Resistance & Text Annotations</p>
                  </div>
                </div>
                <button onClick={() => setIsManageDrawingsOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {/* Horizontal Lines List */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Minus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Horizontal Support & Resistance Lines ({drawingLines.length})</span>
                  </h4>

                  {drawingLines.length === 0 ? (
                    <div className="text-xs text-slate-500 italic bg-slate-950/60 p-3 rounded-xl">No horizontal lines drawn yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {drawingLines.map(line => (
                        <div key={line.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: line.color }} />
                            <input
                              type="text"
                              value={line.label}
                              onChange={(e) => {
                                const newLabel = e.target.value;
                                setDrawingLines(prev => prev.map(l => l.id === line.id ? { ...l, label: newLabel } : l));
                              }}
                              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-bold text-white focus:outline-none"
                            />
                            <input
                              type="number"
                              step="any"
                              value={line.price}
                              onChange={(e) => {
                                const newP = parseFloat(e.target.value) || 0;
                                setDrawingLines(prev => prev.map(l => l.id === line.id ? { ...l, price: newP } : l));
                              }}
                              className="w-28 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono font-bold text-emerald-400 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setDrawingLines(prev => prev.filter(l => l.id !== line.id))}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Text Annotations List */}
                <div className="pt-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-amber-400" />
                    <span>Text Annotations ({textAnnotations.length})</span>
                  </h4>

                  {textAnnotations.length === 0 ? (
                    <div className="text-xs text-slate-500 italic bg-slate-950/60 p-3 rounded-xl">No text annotations added yet.</div>
                  ) : (
                    <div className="space-y-2">
                      {textAnnotations.map(ann => (
                        <div key={ann.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ann.color }} />
                            <input
                              type="text"
                              value={ann.text}
                              onChange={(e) => {
                                const newTxt = e.target.value;
                                setTextAnnotations(prev => prev.map(a => a.id === ann.id ? { ...a, text: newTxt } : a));
                              }}
                              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-bold text-white flex-1 focus:outline-none"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setTextAnnotations(prev => prev.filter(a => a.id !== ann.id))}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setDrawingLines([]);
                    setTextAnnotations([]);
                  }}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 transition cursor-pointer"
                >
                  Delete All Drawings
                </button>

                <button
                  type="button"
                  onClick={() => setIsManageDrawingsOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Close Manager
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Professional Full-Screen Trading Desk Modal */}
      <AnimatePresence>
        {isFullScreen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-white overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                      {symbol} Pro Dealing Terminal
                      <span className="text-xs text-brand-yellow font-mono font-bold bg-brand-yellow/10 border border-brand-yellow/20 px-2 py-0.5 rounded-md">
                        Recharts ECN Engine
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 font-semibold">Institutional Grade Candlestick & Technical Analytics</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullScreen(false)}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Chart Content */}
              <div className="flex-1 overflow-y-auto pr-1">
                {renderChartBody(420)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
