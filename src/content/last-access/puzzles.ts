import type { Puzzle, HintTargetId } from '../../game/types';
export const hints:Record<HintTargetId,[string,string,string]>={
 P01:['첫 전시가 언제 시작했는지 찾아보자.','메신저와 사진 폴더에 같은 날짜가 남아 있다.','4월 17일을 월일 네 자리로 쓰면 0417이다.'],
 P02:['복구 키의 조합 규칙과 두 재료가 필요하다.','영문 프로젝트 코드는 TEAL, 회의실은 04다.','두 값을 붙인 TEAL04를 입력한다.'],
 final:['친구의 행방과 정산표 사건을 나누어 생각하자.','장소는 민지와의 대화·안내도, 작업자는 변경 기록·확인서가 근거다.','별관 지하 1층 자료실 / 한도현 / 설치비를 80만 원에서 180만 원으로 바꿔 서윤의 수정처럼 보이게 한 사건이다.'],
};
export const puzzles:Puzzle[]=[{id:'P01',targetId:'F03',inputLabel:'월일 네 자리로 입력해 줘. 예: 0102',answer:'0417',normalization:'date4',hints:hints.P01},{id:'P02',targetId:'D04',inputLabel:'영문 코드 + 두 자리 번호. 예: BLUE02',answer:'TEAL04',normalization:'asciiCode',hints:hints.P02}];
