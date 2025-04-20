import MarketBlock from './MarketBlock';
import CoinDetailBlock from './CoinDetailBlock';

enum BlockType {
  BLOCK_TY_MARKET,
  BLOCK_TY_ALARM,
  BLOCK_TY_ALARM_HISTORY,
  BLOCK_TY_COIN_DETAIL,
}

type BlockProps = {
  type?: BlockType;
};

function Block({ type }: BlockProps) {
  let content;

  switch (type) {
    case BlockType.BLOCK_TY_MARKET:
      content = <MarketBlock />;
      break;
    case BlockType.BLOCK_TY_COIN_DETAIL:
      content = <CoinDetailBlock />;
      break;
    default:
      content = <div>기본</div>;
  }
  return <div className="h-full overflow-hidden rounded-md">{content}</div>;
}

export { BlockType };
export default Block;
