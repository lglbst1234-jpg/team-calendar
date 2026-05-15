// =============================================
// ⭐ 여기를 내 Firebase 설정값으로 바꾸세요!
// =============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBEHF8HqZhQqzIufr_D963nsJObT9QpvZM",
  authDomain: "team-calendar-2899a.firebaseapp.com",
  projectId: "team-calendar-2899a",
  storageBucket: "team-calendar-2899a.firebasestorage.app",
  messagingSenderId: "1013530218401",
  appId: "11013530218401webd663897a07bb400ae045e0"
};

// =============================================
// Firebase 초기화
// =============================================
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// =============================================
// 전역 변수
// =============================================
let events = [];       // 전체 일정 데이터
let currentYear;
let currentMonth;

// =============================================
// 페이지 시작
// =============================================
(function init() {
  const today = new Date();
  currentYear  = today.getFullYear();
  currentMonth = today.getMonth();

  // 오늘 날짜 기본값
  const todayStr = today.toISOString().split('T')[0];
  document.getElementById('inputStart').value = todayStr;
  document.getElementById('inputEnd').value   = todayStr;

  // 캘린더 먼저 그리기
  renderCalendar();

  // Firebase 실시간 연결
  listenEvents();
})();

// =============================================
// 🔥 실시간 데이터 수신 (핵심!)
// 누군가 일정 추가/삭제하면 자동으로 반영됨
// =============================================
function listenEvents() {
  const q = query(
    collection(db, "events"),
    orderBy("createdAt", "desc")
  );

  onSnapshot(q,
    (snapshot) => {
      // 연결 성공
      document.getElementById('loadingBar').style.display = 'none';

      // 데이터 업데이트
      events = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      renderCalendar();
      renderEventList();
    },
    (error) => {
      // 연결 실패
      document.getElementById('loadingBar').textContent =
        '❌ 연결 실패! Firebase 설정을 확인해주세요.';
      document.getElementById('loadingBar').style.background = '#fff5f5';
      document.getElementById('loadingBar').style.color = '#c53030';
      console.error(error);
    }
  );
}

// =============================================
// 일정 추가
// =============================================
async function addEvent() {
  const name  = document.getElementById('inputName').value.trim();
  const type  = document.getElementById('inputType').value;
  const start = document.getElementById('inputStart').value;
  const end   = document.getElementById('inputEnd').value;
  const memo  = document.getElementById('inputMemo').value.trim();

  // 유효성 검사
  if (!name)         { alert('이름을 입력해주세요!'); return; }
  if (!start || !end){ alert('날짜를 선택해주세요!'); return; }
  if (start > end)   { alert('종료일이 시작일보다 빠를 수 없어요!'); return; }

  // 버튼 비활성화 (중복 클릭 방지)
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = '⏳ 저장 중...';

  try {
    // Firestore에 저장
    await addDoc(collection(db, "events"), {
      name,
      type,
      start,
      end,
      memo,
      createdAt: Date.now()
    });

    // 입력 초기화
    document.getElementById('inputName').value = '';
    document.getElementById('inputMemo').value = '';

    alert(`✅ ${name}님의 ${type} 일정이 등록됐어요!`);

  } catch (error) {
    alert('❌ 저장 실패! 잠시 후 다시 시도해주세요.');
    console.error(error);
  }

  // 버튼 복구
  btn.disabled = false;
  btn.textContent = '📌 등록하기';
}

// 전역으로 노출 (HTML onclick에서 사용)
window.addEvent = addEvent;

// =============================================
// 일정 삭제
// =============================================
async function deleteEvent(id) {
  if (!confirm('이 일정을 삭제할까요?')) return;

  try {
    await deleteDoc(doc(db, "events", id));
  } catch (error) {
    alert('❌ 삭제 실패!');
    console.error(error);
  }
}

window.deleteEvent = deleteEvent;

// =============================================
// 캘린더 렌더링
// =============================================
function renderCalendar() {
  const title = document.getElementById('monthTitle');
  const grid  = document.getElementById('daysGrid');

  title.textContent = `${currentYear}년 ${currentMonth + 1}월`;
  grid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today    = new Date().toISOString().split('T')[0];

  // 빈 칸
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    grid.appendChild(empty);
  }

  // 날짜 칸
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (dateStr === today)  cell.classList.add('today');
    if (dayOfWeek === 0)    cell.classList.add('sunday');
    if (dayOfWeek === 6)    cell.classList.add('saturday');

    // 날짜 숫자
    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = d;
    cell.appendChild(num);

    // 해당 날짜 일정 태그
    const dayEvents = getEventsForDate(dateStr);
    dayEvents.slice(0, 3).forEach(ev => {
      const tag = document.createElement('div');
      tag.className = `event-tag tag-${ev.type}`;
      tag.textContent = `${ev.name} ${ev.type}`;
      cell.appendChild(tag);
    });

    // 3개 초과 표시
    if (dayEvents.length > 3) {
      const more = document.createElement('div');
      more.style.cssText = 'font-size:0.68rem;color:#a0aec0;';
      more.textContent = `+${dayEvents.length - 3}개`;
      cell.appendChild(more);
    }

    // 날짜 클릭 → 모달
    cell.addEventListener('click', () => openModal(dateStr, dayEvents));
    grid.appendChild(cell);
  }
}

// =============================================
// 날짜별 일정 필터
// =============================================
function getEventsForDate(dateStr) {
  return events.filter(ev => ev.start <= dateStr && dateStr <= ev.end);
}

// =============================================
// 전체 일정 목록
// =============================================
function renderEventList() {
  const list = document.getElementById('eventList');

  if (events.length === 0) {
    list.innerHTML = '<p style="color:#a0aec0;text-align:center;padding:20px;">등록된 일정이 없어요 😊</p>';
    return;
  }

  list.innerHTML = events.map(ev => `
    <div class="event-item">
      <span class="badge tag-${ev.type}">${ev.type}</span>
      <div class="event-info">
        <div class="name">${ev.name}</div>
        <div class="date">
          ${ev.start === ev.end ? ev.start : `${ev.start} ~ ${ev.end}`}
          ${ev.memo ? `· ${ev.memo}` : ''}
        </div>
      </div>
      <button class="btn-delete" onclick="deleteEvent('${ev.id}')" title="삭제">🗑️</button>
    </div>
  `).join('');
}

// =============================================
// 월 이동
// =============================================
function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
  renderCalendar();
}

window.changeMonth = changeMonth;

// =============================================
// 모달
// =============================================
function openModal(dateStr, dayEvents) {
  document.getElementById('modalTitle').textContent = `📅 ${dateStr}`;

  if (dayEvents.length === 0) {
    document.getElementById('modalContent').innerHTML =
      '<p style="color:#a0aec0;text-align:center;padding:12px;">일정 없음</p>';
  } else {
    document.getElementById('modalContent').innerHTML = dayEvents.map(ev => `
      <div class="modal-event-item tag-${ev.type}">
        <strong>${ev.name}</strong> · ${ev.type}
        ${ev.memo ? `<br><span style="font-size:0.82rem">${ev.memo}</span>` : ''}
        <br><span style="font-size:0.78rem">${ev.start} ~ ${ev.end}</span>
      </div>
    `).join('');
  }

  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal(e) {
  if (!e || e.target.id === 'modalOverlay') {
    document.getElementById('modalOverlay').classList.remove('show');
  }
}

window.openModal  = openModal;
window.closeModal = closeModal;
