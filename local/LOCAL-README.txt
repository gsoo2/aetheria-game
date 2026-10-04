에테리아 로컬 실행본

1. Node.js 22 또는 24 LTS를 설치합니다.
2. ZIP을 전부 압축 해제합니다. ZIP 안에서 바로 실행하지 마세요.
3. Windows: START-WINDOWS.bat를 실행합니다.
   macOS/Linux: 터미널에서 sh start.sh 를 실행합니다.
   공통: npm install --omit=dev 후 npm start 로 실행해도 됩니다.
4. 브라우저에서 http://127.0.0.1:8787 을 엽니다.

최초 실행 때 서버 실행 도구를 다운로드하므로 인터넷이 필요합니다.
설치가 끝난 뒤에는 인터넷 없이도 게임과 음악을 이용할 수 있습니다.
게임 종료: 실행 창에서 Ctrl+C.
로컬 캐릭터 저장: saved-game 폴더. 이 폴더를 삭제하면 로컬 진행도가 초기화됩니다.
온라인 캐릭터와 로컬 캐릭터는 별도로 저장됩니다.
게임은 HTML 파일 더블클릭이 아니라 위 서버를 실행해서 이용합니다.
서버가 실행된 동안 같은 브라우저에서 캐릭터를 이어서 플레이할 수 있습니다.

업데이트 내용
- M: 큰 세계지도 이미지. 지역 구슬 클릭으로 이동, 레벨 제한 적용.
- E: 마을의 세라와 대화. 10/30레벨 전직 시험 수락 및 완료.
- K: 직업별 12개 스킬. 전직 완료 후 해당 스킬을 배우고 단축 슬롯에 배치.
- 성장 필요 경험치 증가, 기존 레벨 유지.

소스 편집
source 폴더에 전체 프로그램 소스가 있습니다.
이미지/음악은 중복 용량을 줄이기 위해 dist/client/art, dist/client/audio 에 한 번만 포함합니다.
소스를 빌드하려면 먼저 node restore-source-assets.mjs 를 실행하여 source/public에 복사하세요.
그다음 source에서 pnpm install 및 pnpm build를 사용합니다.
source의 빌드 산출물 dist를 실행본의 dist로 교체하면 수정한 게임을 실행할 수 있습니다.
Cloudflare Worker/D1 기반 서버이며, 서버 구현도 source/server 및 source/build에 포함합니다.
이 실행본에는 개인 서버 기록이나 인증 비밀값이 포함되지 않습니다.
