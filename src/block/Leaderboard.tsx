import { useState } from 'react';
import { searchNickname, LeaderboardUser } from '../services/BinanceApi';

function Leaderboard() {
  const [status, setStatus] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginInfo, setLoginInfo] = useState<{
    csrfToken?: string;
    bncUuid?: string;
    cookieCount?: number;
    sessionExpiryDate?: string;
    remainingDays?: number;
  } | null>(null);

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeaderboardUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setStatus('브라우저가 열립니다');

    try {
      const result = await window.binanceLoginAPI.login();

      // 로그인 응답 전체를 콘솔에 출력
      console.log('=== 바이낸스 로그인 응답 ===');
      console.log('전체 응답:', result);
      console.log('성공 여부:', result.success);
      console.log('BNC-UUID:', result.bncUuid);
      console.log('쿠키 개수:', result.cookies?.length);
      console.log('쿠키 상세:', result.cookies);
      console.log('========================');

      if (result.success) {
        setStatus('✅ 로그인 성공!');
        setIsLoggedIn(true);

        // 가장 빨리 만료되는 쿠키 찾기
        const earliestCookie = result.cookiesWithExpiry?.[0];

        setLoginInfo({
          csrfToken: result.csrfToken,
          bncUuid: result.bncUuid,
          cookieCount: result.cookies?.length || 0,
          sessionExpiryDate: result.sessionExpiryDate,
          remainingDays: earliestCookie?.remainingDays,
        });
      } else {
        setStatus(`❌ 로그인 실패: ${result.error}`);
        setIsLoggedIn(false);
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      setStatus(`❌ 오류 발생: ${error.message}`);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseBrowser = async () => {
    try {
      await window.binanceLoginAPI.closeBrowser();
      setStatus('🔒 브라우저가 강제 종료되었습니다.');
    } catch (error: any) {
      setStatus(`❌ 브라우저 종료 실패: ${error.message}`);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setStatus('❌ 닉네임을 입력하세요.');
      return;
    }

    setIsSearching(true);
    setStatus('🔍 검색 중...');

    try {
      const result = await searchNickname(searchQuery.trim());

      console.log('=== 닉네임 검색 결과 ===');
      console.log('응답:', result);
      console.log('=====================');

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
      <div className="bg-black/5 p-4 w-fit rounded-xl mb-5">
        {!isLoggedIn ? (
          <div>
            <p className="mb-4 text-[#212833]/70">바이낸스 선물 포지션을 조회하려면 먼저 로그인이 필요합니다.</p>
            <button onClick={handleLogin} disabled={isLoading} className={`px-4 py-2 text-base font-semibold rounded-lg transition-all ${isLoading ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#FFD300] hover:bg-[#E9C100] text-black cursor-pointer'}`}>
              {isLoading ? '로그인 중...' : 'Binance Log In'}
            </button>
          </div>
        ) : (
          <div className="flex-col gap-4">
            <div className="flex gap-4 items-center">
              <p className="text-lg">✅ 로그인 완료</p>
              <button onClick={handleCloseBrowser} className="h-fit px-2 py-1 text-sm bg-red-500/50 border border-red-500/30 text-white rounded-md cursor-pointer font-medium hover:bg-red-600 transition-colors">
                로그아웃
              </button>
            </div>
            {loginInfo && (
              <div className="text-sm text-black/80 space-y-1">
                {loginInfo.sessionExpiryDate && (
                  <>
                    <p className="mt-2 pt-2 border-t font-semibold border-white/10">세션 만료 시간:</p>
                    <p className="pl-3">{loginInfo.sessionExpiryDate}</p>
                    {loginInfo.remainingDays !== undefined && <p className="pl-3 text-yellow-400">약 {loginInfo.remainingDays}일 남음</p>}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {!isLoggedIn && status && <div className="mt-5 p-4 bg-black/5 rounded-xl text-sm">{status}</div>}
      </div>
      {isLoggedIn && (
        <div className="bg-black/5 p-6 rounded-xl mb-5">
          <h2 className="text-xl font-semibold mb-4">Binance Futures Leaderboard</h2>

          {/* 검색창 */}
          <div className="flex gap-2 mb-4">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder="Search by nickname" disabled={isSearching} className="flex-1 px-4 py-2 bg-black/10 border border-white/20 rounded-lg text-[#212833] placeholder-[#999999]/50 focus:outline-none focus:border-[#f0b90b] transition-colors" />
            <button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} className={`px-6 py-2 font-semibold rounded-lg transition-all ${isSearching || !searchQuery.trim() ? 'bg-gray-600 cursor-not-allowed' : 'bg-[#FFD300] hover:bg-[#E9C100] text-white cursor-pointer'}`}>
              {isSearching ? '검색 중...' : '검색'}
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">검색 결과 ({searchResults.length}명)</h3>
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div key={user.encryptedUid} onClick={() => handleUserSelect(user.encryptedUid)} className={`p-4 rounded-lg cursor-pointer transition-all ${selectedUser === user.encryptedUid ? 'bg-[#f0b90b]/20 border-2 border-[#f0b90b]' : 'bg-white/5 border-2 border-transparent hover:bg-white/10'}`}>
                    <div className="flex items-center gap-3">
                      {/* 프로필 사진 */}
                      {user.userPhotoUrl ? <img src={user.userPhotoUrl} alt={user.nickname} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-black/10 flex items-center justify-center text-2xl">👤</div>}

                      {/* 유저 정보 */}
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{user.nickname}</p>
                        <p className="text-sm text-black/70">팔로워: {user.followerCount.toLocaleString()}명</p>
                      </div>

                      {/* 선택 표시 */}
                      {selectedUser === user.encryptedUid && <div className="text-2xl">✓</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Leaderboard;
