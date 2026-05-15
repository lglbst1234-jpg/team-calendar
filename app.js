let events = JSON.parse(localStorage.getItem('teamEvents') || '[]');
let currentYear, currentMonth;

(function init() {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  
  const todayStr = today.toISOString().split('T')[0];
  document.getElementById('inputStart').value = todayStr;
  document.getElementById('inputEnd').value = todayStr;
  
  renderCalendar();
  renderEventList();
})();

function addEvent() {
  const name  = document.getElementById('inputName').value.trim();
  const type  = document.getElementById('inputType').value;
  const start = document.getElementById('inputStart').value;
  const end   = document.getElementById('inputEnd').value;
  const memo  = document.getElementById('inputMemo').value.trim();

  if (!name) { alert('이름을 입력해주세요!'); return; }
  if (!start || !end) { alert('날짜를 선택해주세요!'); return; }
  if (start > end) { alert('종료일이 시작일보다 빠를 수 없어요!'); return; }

  const newEvent = { id: Date.now(), name, type, start, end, memo };

  events.push(newEvent);
  saveEvents();
  renderCalendar();
  renderEventList();

  document.getElementById('inputName').value = '';
  document.getElementById('inputMemo').value = '';

  alert(`✅ ${name}님의 ${type} 일정이 등록됐어요!`);
}

function renderCalendar() {
  const title = document.getElementById('monthTitle');
  const grid  = document.getElementById('daysGrid');

  title.textContent = `${currentYear}년 ${currentMonth + 1}월`;
  grid.innerHTML = '';

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const lastDate = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today    = new Date().toISOString().split('T')[0];

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'day-cell empty';
    grid.appendChild(empty);
  }

  for (let d = 1; d <= lastDate; d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (dateStr === today) cell.classList.add('today');
    if (dayOfWeek === 0) cell.classList.add('sunday');
    if (dayOfWeek === 6) cell.classList.add('saturday');

    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = d;
    cell.appendChild(num);

    const dayEvents = getEventsForDate(dateStr);
    dayEvents.slice(0, 3).forEach(ev => {
      const tag = document.createElement('div');
      tag.className = `event-tag tag-${ev.type}`;
      tag.textContent = `${ev.name} ${ev.type}`;
      cell.appendChild(tag);
    });

    if (dayEvents.length > 3) {
      const more = document.createElement('div');
      more.style.cssText = 'font-size:0.68rem;color:#a0aec0;';
      more.textContent = `+${dayEvents.length - 3}개`;
      cell.appendChild(more);
    }

    cell.addEventListener('click', () => openModal(dateStr, dayEvents));
    grid.appendChild(cell);
  }
}

function getEventsForDate(dateStr) {
  return events.filter(ev => ev.start <= dateStr && dateStr <= ev.end);
}

function renderEventList() {
  const list = document.getElementById('eventList');

  if (events.length === 0) {
    list.innerHTML = '<p style="color:#a0aec0;text-align:center;padding:20px;">등록된 일정이 없어요 😊</p>';
    return;
  }

  const sorted = [...events].sort((a, b) => b.id - a.id);

  list.innerHTML = sorted.map(ev => `
    <div class="event-item">
      <span class="badge tag-${ev.type}">${ev.type}</span>
      <div class="event-info">
        <div class="name">${ev.name}</div>
        <div class="date">
          ${ev.start === ev.end ? ev.start : `${ev.start} ~ ${ev.end}`}
          ${ev.memo ? `· ${ev.memo}` : ''}
        </div>
      </div>
      <button class="btn-delete" onclick="deleteEvent(${ev.id})" title="삭제">🗑️</button>
    </div>
  `).join('');
}

function deleteEvent(id) {
  if (!confirm('이 일정을 삭제할까요?')) return;
  events = events.filter(ev => ev.id !== id);
  saveEvents();
  renderCalendar();
  renderEventList();
}

function saveEvents() {
  localStorage.setItem('teamEvents', JSON.stringify(events));
}

function changeMonth(dir) {
  currentMonth += dir;
  if (currentMonth < 0)  { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0;  currentYear++; }
  renderCalendar();
}

function openModal(dateStr, dayEvents) {
  const overlay = document.getElementById('modalOverlay');
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

  overlay.classList.add('show');
}

function closeModal(e) {
  if (!e || e.target.id === 'modalOverlay') {
    document.getElementById('modalOverlay').classList.remove('show');
  }
}