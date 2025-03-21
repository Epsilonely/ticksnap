import MarketBlock from "./MarketBlock";

enum BlockType {
    BLOCK_TY_MARKET,
    BLOCK_TY_ALARM,
    BLCOK_TY_ALARM_HISTORY,
}

type BlockProps = {
    type?: BlockType;
}

function Block( {type}: BlockProps ) {
    let content;

    switch(type) {
        case BlockType.BLOCK_TY_MARKET:
            content = <MarketBlock/>
            break;
        default:
            content = <div>기본</div>
    }
    return (
      <div className="bg-amber-100 border-1">
        {content}
      </div>
    );
}

export {BlockType};
export default Block;