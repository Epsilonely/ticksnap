import { useState, useEffect, useRef } from 'react';
import { searchNickname, LeaderboardUser } from '../services/BinanceApi';
import { v4 as uuidv4 } from 'uuid';

function Leaderboard() {
  const [status, setStatus] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // QR 로그인 상태
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrStatus, setQrStatus] = useState<'NEW' | 'EXPIRED' | 'LOADING'>('LOADING');
  const [sessionData, setSessionData] = useState<{
    sessionId: string;
    random: string;
    originalQrCode: string;
  } | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeaderboardUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // QR 로그인 시작
  const startQRLogin = async () => {
    setIsLoading(true);
    setStatus('QR 코드 생성 중...');
    setQrStatus('LOADING');

    try {
      // 1. Precheck
      console.log('🔐 Precheck 시작...');
      const precheckResult = await window.binanceQRLoginAPI.precheck();
      console.log('Precheck 결과:', precheckResult);

      if (!precheckResult.success) {
        // Rate Limit 에러 처리
        if (precheckResult.error?.includes('Too many requests')) {
          throw new Error('너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
        throw new Error(`Precheck 실패: ${precheckResult.error || '알 수 없는 오류'}`);
      }

      if (!precheckResult.data) {
        throw new Error('Precheck 데이터가 없습니다');
      }

      const { sessionId } = precheckResult.data;
      console.log('✅ SessionId 받음:', sessionId);

      // 2. Check Result
      console.log('🔍 Check Result 시작...');
      const checkResult = await window.binanceQRLoginAPI.checkResult(sessionId);
      console.log('Check Result 결과:', checkResult);

      if (!checkResult.success) {
        throw new Error(`Check Result 실패: ${checkResult.error || '알 수 없는 오류'}`);
      }

      // 3. Get QR Code
      console.log('📱 QR 코드 생성 시작...');
      const random = uuidv4();
      const qrResult = await window.binanceQRLoginAPI.getQRCode(random, sessionId);
      console.log('QR 코드 결과:', qrResult);

      if (!qrResult.success) {
        throw new Error(`QR 코드 생성 실패: ${qrResult.error || '알 수 없는 오류'}`);
      }

      if (!qrResult.data) {
        throw new Error('QR 코드 데이터가 없습니다');
      }

      const { qrCode, originalQrCode } = qrResult.data;
      console.log('✅ QR 코드 생성 완료:', qrCode);

      setQrCodeUrl(qrCode);
      setQrStatus('NEW');
      setSessionData({ sessionId, random, originalQrCode });
      setStatus('QR 코드를 스캔하세요');

      // 4. 폴링 시작
      startPolling(originalQrCode, random, sessionId);
    } catch (error: any) {
      console.error('❌ QR 로그인 시작 오류:', error);
      setStatus(`❌ ${error.message}`);
      setIsLoading(false);
      setQrCodeUrl('');
    }
  };

  // 폴링 시작
  const startPolling = (qrCode: string, random: string, sessionId: string) => {
    // 기존 폴링 중지
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const result = await window.binanceQRLoginAPI.queryStatus(qrCode, random, sessionId);

        if (result.success && result.data) {
          const { status } = result.data;

          if (status === 'EXPIRED') {
            setQrStatus('EXPIRED');
            setStatus('QR 코드가 만료되었습니다');
            stopPolling();
          } else if (status === 'CONFIRMED' || status === 'SUCCESS') {
            setStatus('✅ 로그인 성공!');
            setIsLoggedIn(true);
            setIsLoading(false);
            setQrCodeUrl('');
            stopPolling();
          }
          // NEW 상태면 계속 폴링
        }
      } catch (error) {
        console.error('폴링 오류:', error);
      }
    }, 5000); // 5초 간격
  };

  // 폴링 중지
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // QR 새로고침
  const handleRefreshQR = () => {
    stopPolling();
    startQRLogin();
  };

  // 로그인 취소
  const handleCancelLogin = () => {
    stopPolling();
    setIsLoading(false);
    setQrCodeUrl('');
    setSessionData(null);
    setStatus('로그인이 취소되었습니다');
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await window.binanceQRLoginAPI.logout();
      setIsLoggedIn(false);
      setStatus('');
    } catch (error: any) {
      setStatus(`❌ 로그아웃 실패: ${error.message}`);
    }
  };

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

  // 컴포넌트 언마운트 시 폴링 중지
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return (
    <div className="p-6 text-[#212833] w-full h-full bg-[#ffffff] rounded-xl">
      <div className="bg-black/5 p-4 w-fit rounded-xl mb-5">
        {!isLoggedIn ? (
          <div>
            <p className="mb-4 text-[#212833]/70">바이낸스 선물 포지션을 조회하려면 먼저 로그인이 필요합니다.</p>

            {!isLoading ? (
              <button onClick={startQRLogin} className="px-4 py-2 text-base font-semibold rounded-lg bg-[#FFD300] hover:bg-[#E9C100] text-black cursor-pointer transition-all">
                Binance QR Log In
              </button>
            ) : (
              <div className="space-y-4">
                {/* QR 코드 표시 */}
                {qrCodeUrl && (
                  <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-lg border-2 border-[#FFD300]">
                    <p className="text-lg font-semibold">바이낸스 앱으로 QR 스캔</p>

                    {qrStatus === 'LOADING' && <div className="w-64 h-64 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">로딩 중...</div>}

                    {qrStatus === 'NEW' && (
                      <div className="relative">
                        <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64 border-4 border-gray-200 rounded-lg" />
                      </div>
                    )}

                    {qrStatus === 'EXPIRED' && (
                      <div className="w-64 h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-4">
                        <p className="text-red-500 font-semibold">QR 코드 만료</p>
                        <button onClick={handleRefreshQR} className="px-4 py-2 bg-[#FFD300] hover:bg-[#E9C100] text-black font-semibold rounded-lg transition-all">
                          새로고침
                        </button>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button onClick={handleCancelLogin} className="px-4 py-2 text-base font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white cursor-pointer transition-all">
                        취소
                      </button>
                      {qrStatus === 'NEW' && (
                        <button onClick={handleRefreshQR} className="px-4 py-2 text-base font-semibold rounded-lg bg-gray-500 hover:bg-gray-600 text-white cursor-pointer transition-all">
                          새로고침
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-col gap-4">
            <div className="flex gap-4 items-center">
              <p className="text-lg">✅ 로그인 완료</p>
              <button onClick={handleLogout} className="h-fit px-2 py-1 text-sm bg-red-500/50 border border-red-500/30 text-white rounded-md cursor-pointer font-medium hover:bg-red-600 transition-colors">
                로그아웃
              </button>
            </div>
          </div>
        )}

        {status && <div className="mt-5 p-4 bg-black/5 rounded-xl text-sm">{status}</div>}
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
      )}
    </div>
  );
}

export default Leaderboard;
