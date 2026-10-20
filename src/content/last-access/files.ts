import type { FileContent, FileNode } from '../../game/types';
const text=(...paragraphs:string[]):FileContent=>({kind:'text',paragraphs});
const file=(id:string,name:string,parentId:string,content:FileContent,evidenceIds:string[]=[],puzzleId?:string):FileNode=>({id,name,parentId,kind:'file',access:{type:'always'},content,evidenceIds,...(puzzleId?{puzzleId}:{})});
export const files:FileNode[]=[
 {id:'ROOT',name:'서윤의 컴퓨터',parentId:null,kind:'folder',access:{type:'always'}},
 ...[['D01','바탕화면'],['D02','사진'],['D03','전시']].map(([id,name]):FileNode=>({id:id!,name:name!,parentId:'ROOT',kind:'folder',access:{type:'always'}})),
 {id:'D04',name:'백업',parentId:'D03',kind:'folder',access:{type:'puzzleSolved',puzzleId:'P02'}},
 file('F01','먼저 읽어줘.txt','D01',text('이 컴퓨터는 네가 확인해도 돼. 전시 폴더의 개인 메모부터 봐 줘. 비밀번호는 우리 첫 전시 개막일 네 자리야. 메신저에 그때 얘기가 남아 있을 거야.')),
 file('F02','첫_전시_포스터.svg','D02',{kind:'diagram',assetId:'first-exhibition',alt:'첫 전시 · 2024.04.17 개막'}),
 file('F03','개인_메모.txt','D03',text('정산표가 내가 확인한 것과 달라졌다. 백업은 운영 기록과 함께 따로 묶었다. 복구 규칙은 프로젝트 영문 코드 대문자 + 회의실 번호 두 자리. 일정과 운영 안내에 각각 적혀 있다.'),[],'P01'),
 file('F04','운영_안내.txt','D03',text('10월 18일 전시 정산 검토 · 회의실 04. 자료 보관용 복구 키는 프로젝트 영문 코드 대문자와 회의실 번호 두 자리를 붙여 만든다.')),
 file('F05','프로젝트_개요.txt','D03',text('프로젝트명: 청록의 기록 / 영문 코드: TEAL / 정산 최종 검토일: 2026-10-18')),
 file('F06','별관_안내도.svg','D03',{kind:'diagram',assetId:'annex-map',alt:'별관 1층: 로비·회의실 / 별관 지하 1층: 자료실·기계실. 옛 전시 포스터는 지하 1층 자료실에 보관.'},['E02']),
 file('F07','정산_제출_안내.txt','D03',text('제출본은 공용 작업 계정 designer로 편집 가능. 변경 기록의 계정명만으로 실제 작업자를 판단할 수 없음.'),['E07']),
 file('F08','정산_원본.csv','D04',{kind:'table',columns:['항목','금액 (원)','승인 정보'],rows:[['설치비','800,000','승인본 · 17:50'],['인쇄비','200,000','승인본 · 17:50'],['운송비','100,000','승인본 · 17:50']]},['E05']),
 file('F09','정산_제출본.csv','D04',{kind:'table',columns:['항목','금액 (원)','제출 정보'],rows:[['설치비','1,800,000','제출 · 18:45'],['인쇄비','200,000','제출 · 18:45'],['운송비','100,000','제출 · 18:45']]},['E06']),
 file('F10','변경_기록.txt','D04',text('로그 내보내기 자료','18:40 / 운영실 PC-02 / 계정 designer / 설치비 800000 → 1800000 / 저장'),['E03']),
 file('F11','민지_확인서.txt','D04',text('18:40부터 18:43까지 운영실에서 한도현이 PC-02로 정산표의 설치비를 수정하는 걸 봤다. 서윤 이름의 계정이었지만 키보드를 사용한 사람은 한도현이었다. — 민지, 19:10 작성.'),['E04']),
 file('F12','출력소_수령증.txt','D04',text('2026-10-18 18:55 / 수령인 서윤 / 행사 리플릿 50부')),
 file('F13','예약_메시지_기록.txt','D04',text('등록 19:20 / 발송 예정 20:30 / 수신인: 너 / 내용: 내가 연락이 안 되면, 내 컴퓨터부터 확인해 줘. / 상태: 발송 완료'),['E08']),
 file('F14','오프라인_메모.txt','D04',text('19:25. 폰은 끄고 이동한다. 민지와 원본을 대조한 뒤 연락할 것. 만날 곳은 아까 대화에서 말한 방 그대로.'),['E09']),
];
