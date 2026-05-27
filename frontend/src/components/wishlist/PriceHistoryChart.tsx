import { PricePoint } from './types';
import { formatCurrency } from './priceUtils';

interface PriceHistoryChartProps {
  priceHistory: PricePoint[];
}

const CHART_WIDTH = 340;
const CHART_HEIGHT = 140;
const PADDING = 20;

export default function PriceHistoryChart({ priceHistory }: PriceHistoryChartProps) {
  if (priceHistory.length === 0) {
    return <div className="text-sm text-gray-500">No price history yet.</div>;
  }

  const prices = priceHistory.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const denominator = max - min || 1;

  const points = priceHistory.map((entry, index) => {
    const x = PADDING + (index / Math.max(priceHistory.length - 1, 1)) * (CHART_WIDTH - PADDING * 2);
    const y = CHART_HEIGHT - PADDING - ((entry.price - min) / denominator) * (CHART_HEIGHT - PADDING * 2);
    return { x, y, price: entry.price };
  });

  const pathData = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <svg width="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} role="img" aria-label="Price history chart">
        <title>Wishlist price trend</title>
        <desc>{`Added at ${formatCurrency(priceHistory[0].price)}, lowest observed ${formatCurrency(min)}, current ${formatCurrency(priceHistory[priceHistory.length - 1].price)}.`}</desc>
        <path d={pathData} fill="none" stroke="#76b852" strokeWidth="2" />
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={index === points.length - 1 ? 4 : 3}
            fill={index === points.length - 1 ? '#1f2937' : '#76b852'}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Added: {formatCurrency(priceHistory[0].price)}</span>
        <span>Lowest: {formatCurrency(min)}</span>
        <span>Current: {formatCurrency(priceHistory[priceHistory.length - 1].price)}</span>
      </div>
    </div>
  );
}
