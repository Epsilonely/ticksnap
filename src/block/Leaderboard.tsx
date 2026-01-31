import { useState } from 'react';
import { searchNickname, LeaderboardUser } from '../services/BinanceApi';

function Leaderboard() {
  const [status, setStatus] = useState('');

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeaderboardUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // 검색
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setStatus('❌ 닉네임을 입력하세요.');
      return;
    }

    setIsSearching(true);
    setStatus('🔍 검색 중...');

    try {
      const result = await searchNickname(searchQuery.trim());

      if (result.success && result.data) {
        setSearchResults(result.data);
        setStatus(`✅ ${result.data.length}명의 유저를 찾았습니다.`);
      } else {
        setSearchResults([]);
        setStatus('❌ 검색 결과가 없습니다.');
      }
    } catch (error: any) {
      console.error('검색 오류:', error);
      setSearchResults([]);
      setStatus(`❌ 검색 실패: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (encryptedUid: string) => {
    setSelectedUser(encryptedUid);
    console.log('선택된 유저:', encryptedUid);
  };

  return (
    <div className="p-6 text-[#212833] w-full h-full bg-[#ffffff] rounded-xl">
      <div className="bg-black/5 p-6 rounded-xl mb-5">
        <h2 className="text-xl font-semibold mb-4">Binance Futures Leaderboard</h2>

        {/* 검색창 */}
        <div className="flex gap-2 mb-4">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="닉네임으로 검색" disabled={isSearching} className="flex-1 px-4 py-2 bg-black/10 border border-white/20 rounded-lg text-[#212833] placeholder-[#999999]/50 focus:outline-none focus:border-[#f0b90b] transition-colors" />
          <button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} className={`px-6 py-2 font-semibold rounded-lg transition-all ${isSearching || !searchQuery.trim() ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#FFD300] hover:bg-[#E9C100] text-black cursor-pointer'}`}>
            {isSearching ? '검색 중...' : '검색'}
          </button>
        </div>

        {/* 상태 메시지 */}
        {status && <div className="mb-4 p-4 bg-black/5 rounded-xl text-sm">{status}</div>}

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">검색 결과 ({searchResults.length}명)</h3>
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div key={user.encryptedUid} onClick={() => handleUserSelect(user.encryptedUid)} className={`p-4 rounded-lg cursor-pointer transition-all ${selectedUser === user.encryptedUid ? 'bg-[#f0b90b]/20 border-2 border-[#f0b90b]' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}>
                  <div className="flex items-center gap-3">
                    {user.userPhotoUrl ? <img src={user.userPhotoUrl} alt={user.nickname} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center text-2xl">👤</div>}

                    <div className="flex-1">
                      <p className="font-semibold text-lg">{user.nickname}</p>
                      <p className="text-sm text-black/70">팔로워: {user.followerCount.toLocaleString()}명</p>
                    </div>

                    {selectedUser === user.encryptedUid && <div className="text-2xl">✓</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
