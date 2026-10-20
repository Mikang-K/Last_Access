import type { Question } from '../../game/types';
export const questions:Question[]=[
 {id:'Q01',prompt:'서윤을 찾아갈 장소는?',options:[{id:'A_LOCATION_CAFE',label:'본관 카페'},{id:'A_LOCATION_MEETING',label:'별관 1층 회의실'},{id:'A_LOCATION_ARCHIVE',label:'별관 지하 1층 자료실'}],correctAnswerId:'A_LOCATION_ARCHIVE',requiredEvidenceIds:['E01','E02']},
 {id:'Q02',prompt:'정산표를 실제로 수정한 사람은?',options:[{id:'A_ACTOR_SEOYUN',label:'서윤'},{id:'A_ACTOR_MINJI',label:'민지'},{id:'A_ACTOR_DOHYEON',label:'한도현'}],correctAnswerId:'A_ACTOR_DOHYEON',requiredEvidenceIds:['E03','E04']},
 {id:'Q03',prompt:'정산표에는 어떤 일이 있었나?',options:[{id:'A_METHOD_PRINT',label:'인쇄비를 줄였다'},{id:'A_METHOD_INFLATE',label:'설치비를 80만 원에서 180만 원으로 바꾸고 서윤의 작업처럼 보이게 했다'},{id:'A_METHOD_SAME',label:'원본과 제출본은 같다'}],correctAnswerId:'A_METHOD_INFLATE',requiredEvidenceIds:['E05','E06','E07']},
];
