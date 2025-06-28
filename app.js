// app.js
// Agenda Deportiva: Gestión de eventos y calendario
// Autor: IA
//
// Estructura modular y comentarios claros para facilitar mantenimiento

// --- Utilidades de Fechas --- //
function getToday() {
    const now = new Date();
    return now.toISOString().slice(0, 10);
}
function sameDay(date1, date2) {
    return date1 === date2;
}
function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

// --- Gestión de Eventos en localStorage --- //
const STORAGE_KEY = 'agendaEventos';
function loadEvents() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
function saveEvents(events) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

// --- Estado global --- //
let state = {
    events: [],
    selectedDate: getToday(),
    editingEventId: null
};

// --- Renderizado del Calendario --- //
function renderCalendar(year, month) {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes = 0
    const daysInMonth = lastDay.getDate();
    const today = getToday();
    // Encabezado
    const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    let thead = '<thead><tr>';
    days.forEach(d => { thead += `<th>${d}</th>`; });
    thead += '</tr></thead>';
    calendar.innerHTML += thead;
    // Cuerpo
    let tbody = '<tbody><tr>';
    let day = 1;
    for (let i = 0; i < 42; i++) {
        if (i < startDay || day > daysInMonth) {
            tbody += '<td></td>';
        } else {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEvent = state.events.some(e => e.date === dateStr);
            let classes = [];
            if (dateStr === today) classes.push('today');
            if (hasEvent) classes.push('has-event');
            if (dateStr === state.selectedDate) classes.push('selected');
            tbody += `<td tabindex="0" data-date="${dateStr}" class="${classes.join(' ')}">${day}</td>`;
            day++;
        }
        if ((i + 1) % 7 === 0 && day <= daysInMonth) tbody += '</tr><tr>';
    }
    tbody += '</tr></tbody>';
    calendar.innerHTML += tbody;
    document.getElementById('calendar-title').textContent = `${firstDay.toLocaleString('es', { month: 'long' }).toUpperCase()} ${year}`;
    // Accesibilidad: foco en día seleccionado
    setTimeout(() => {
        const selected = calendar.querySelector('td.selected');
        if (selected) selected.focus();
    }, 0);
}

// --- Renderizado de eventos del día --- //
function renderEventsOfDay(date) {
    const list = document.getElementById('event-list');
    list.innerHTML = '';
    const events = state.events.filter(e => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
    if (events.length === 0) {
        list.innerHTML = '<li>No hay eventos para este día.</li>';
        return;
    }
    events.forEach(ev => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${ev.title}</strong>
            <span>${ev.time} hs</span>
            <span>${ev.description ? ev.description : ''}</span>
            <div class="actions">
                <button aria-label="Editar evento" onclick="editEvent('${ev.id}')">✏️</button>
                <button aria-label="Eliminar evento" onclick="deleteEvent('${ev.id}')">🗑️</button>
            </div>
        `;
        list.appendChild(li);
    });
}

// --- Manejo de formulario --- //
function resetForm() {
    document.getElementById('event-form').reset();
    document.getElementById('event-date').value = state.selectedDate;
    document.getElementById('form-title').textContent = 'Añadir Evento';
    document.getElementById('save-event').textContent = 'Guardar';
    document.getElementById('cancel-edit').style.display = 'none';
    state.editingEventId = null;
}
function fillForm(event) {
    document.getElementById('event-title').value = event.title;
    document.getElementById('event-desc').value = event.description;
    document.getElementById('event-date').value = event.date;
    document.getElementById('event-time').value = event.time;
    document.getElementById('form-title').textContent = 'Editar Evento';
    document.getElementById('save-event').textContent = 'Actualizar';
    document.getElementById('cancel-edit').style.display = 'inline-block';
}

// --- CRUD de eventos --- //
function addOrUpdateEvent(e) {
    e.preventDefault();
    const title = document.getElementById('event-title').value.trim();
    const description = document.getElementById('event-desc').value.trim();
    const date = document.getElementById('event-date').value;
    const time = document.getElementById('event-time').value;
    if (!title || !date || !time) return;
    if (state.editingEventId) {
        // Editar
        const idx = state.events.findIndex(ev => ev.id === state.editingEventId);
        if (idx !== -1) {
            state.events[idx] = { ...state.events[idx], title, description, date, time };
        }
    } else {
        // Nuevo
        state.events.push({ id: generateId(), title, description, date, time });
    }
    saveEvents(state.events);
    resetForm();
    renderAll();
}
function editEvent(id) {
    const ev = state.events.find(e => e.id === id);
    if (!ev) return;
    fillForm(ev);
    state.editingEventId = id;
}
function deleteEvent(id) {
    if (!confirm('¿Eliminar este evento?')) return;
    state.events = state.events.filter(e => e.id !== id);
    saveEvents(state.events);
    resetForm();
    renderAll();
}
document.addEventListener('DOMContentLoaded', () => {
    // Inicialización
    state.events = loadEvents();
    const now = new Date(state.selectedDate);
    renderCalendar(now.getFullYear(), now.getMonth());
    renderEventsOfDay(state.selectedDate);
    document.getElementById('event-date').value = state.selectedDate;

    // Navegación de calendario
    document.getElementById('prev-month').onclick = () => {
        const d = new Date(state.selectedDate);
        d.setMonth(d.getMonth() - 1);
        state.selectedDate = d.toISOString().slice(0, 10);
        renderCalendar(d.getFullYear(), d.getMonth());
    };
    document.getElementById('next-month').onclick = () => {
        const d = new Date(state.selectedDate);
        d.setMonth(d.getMonth() + 1);
        state.selectedDate = d.toISOString().slice(0, 10);
        renderCalendar(d.getFullYear(), d.getMonth());
    };
    // Selección de día
    document.getElementById('calendar').onclick = e => {
        if (e.target.tagName === 'TD' && e.target.dataset.date) {
            state.selectedDate = e.target.dataset.date;
            renderCalendar(new Date(state.selectedDate).getFullYear(), new Date(state.selectedDate).getMonth());
            renderEventsOfDay(state.selectedDate);
            document.getElementById('event-date').value = state.selectedDate;
        }
    };
    document.getElementById('calendar').addEventListener('keydown', e => {
        // Navegación con flechas
        const td = document.activeElement;
        if (td.tagName !== 'TD' || !td.dataset.date) return;
        let d = new Date(td.dataset.date);
        if (e.key === 'ArrowLeft') d.setDate(d.getDate() - 1);
        else if (e.key === 'ArrowRight') d.setDate(d.getDate() + 1);
        else if (e.key === 'ArrowUp') d.setDate(d.getDate() - 7);
        else if (e.key === 'ArrowDown') d.setDate(d.getDate() + 7);
        else return;
        e.preventDefault();
        const newDate = d.toISOString().slice(0, 10);
        state.selectedDate = newDate;
        renderCalendar(d.getFullYear(), d.getMonth());
        renderEventsOfDay(newDate);
        document.getElementById('event-date').value = newDate;
    });
    // Formulario
    document.getElementById('event-form').onsubmit = addOrUpdateEvent;
    document.getElementById('cancel-edit').onclick = resetForm;
});

// Redibuja todo
function renderAll() {
    const d = new Date(state.selectedDate);
    renderCalendar(d.getFullYear(), d.getMonth());
    renderEventsOfDay(state.selectedDate);
}

// Hacer editEvent y deleteEvent globales para los botones
window.editEvent = editEvent;
window.deleteEvent = deleteEvent;
