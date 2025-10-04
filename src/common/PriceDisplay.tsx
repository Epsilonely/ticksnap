interface PriceDisplayProps {
  price: number;
  className?: string;
  decimalPlaces: number;
}

function PriceDisplay({ price, className = 'text-[#4C4C57]', decimalPlaces = 2 }: PriceDisplayProps) {
  const [integerPart, decimalPart] = price.toFixed(decimalPlaces).split('.');
  const hasDecimal = parseFloat(`0.${decimalPart}`) > 0;

  return (
    <div className={`${className}`}>
      <span>{Number(integerPart).toLocaleString()}</span>
      {hasDecimal && <span className="[color:color-mix(in_srgb,currentColor,white_40%)]">.{decimalPart}</span>}
    </div>
  );
}

export default PriceDisplay;
