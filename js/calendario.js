document.addEventListener('DOMContentLoaded', function() {
    // Obtener correo del usuario autenticado desde localStorage
    const correo = localStorage.getItem('correo');
    if (!correo) {
        Swal.fire({
            icon: 'error',
            title: 'No autenticado',
            text: 'Debes iniciar sesión primero.',
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }

    // Variables
    const currentMonthElement = document.getElementById('current-month');
    const calendarDaysElement = document.getElementById('calendar-days');
    const eventModal = document.getElementById('event-modal');
    const closeModalButton = document.getElementById('close-modal');
    const cancelEventButton = document.getElementById('cancel-event');
    const eventForm = document.getElementById('event-form');
    const eventTitleInput = document.getElementById('event-title');
    const eventDateInput = document.getElementById('event-date');

    let currentDate = new Date();
    let tareasMes = [];

    // Cargar tareas del mes desde la base de datos
    function cargarTareasMes(callback) {
        const mes = currentDate.getMonth() + 1;
        const anio = currentDate.getFullYear();
        fetch('../php/portal.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get_tareas_mes',
                correo: correo,
                mes: mes,
                anio: anio
            })
        })
        .then(res => res.json())
        .then(data => {
            tareasMes = data.success && data.tareas ? data.tareas : [];
            if (callback) callback();
        });
    }

    // Renderizar calendario con tareas y modal al hacer click
    function renderCalendar() {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        currentMonthElement.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        calendarDaysElement.innerHTML = '';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDay; i++) {
            calendarDaysElement.innerHTML += `<div class="h-16"></div>`;
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const tareasDia = tareasMes.filter(t => t.fecha_entrega === fechaStr);

            let tareasHtml = '';
            if (tareasDia.length > 0) {
                tareasHtml = tareasDia.map(t => `
                    <div class="mt-1 text-xs bg-indigo-100 text-indigo-800 rounded px-1 truncate" title="${t.titulo}">${t.titulo}</div>
                `).join('');
            }

            calendarDaysElement.innerHTML += `
                <div class="h-16 flex flex-col items-center justify-start border border-gray-200 rounded-lg hover:bg-indigo-100 cursor-pointer relative group" data-day="${day}" data-fecha="${fechaStr}">
                    <span class="mt-2 font-medium">${day}</span>
                    <div class="w-full">${tareasHtml}</div>
                </div>
            `;
        }

        // Evento para mostrar tareas del día en modal
        const dayElements = calendarDaysElement.querySelectorAll('div[data-day]');
        dayElements.forEach(dayElement => {
            dayElement.addEventListener('click', () => {
                const fecha = dayElement.getAttribute('data-fecha');
                const tareasDia = tareasMes.filter(t => t.fecha_entrega === fecha);
                if (tareasDia.length > 0) {
                    let html = '';
                    tareasDia.forEach(t => {
                        html += `
                            <div class="mb-4 text-left">
                                <div class="font-semibold text-indigo-700 mb-1">${t.titulo}</div>
                                <div class="text-gray-600 text-sm mb-1"><b>Fecha de entrega:</b> ${t.fecha_entrega}</div>
                                ${t.descripcion ? `<div class="text-gray-500 text-sm mb-1">${t.descripcion}</div>` : ''}
                            </div>
                            <hr>
                        `;
                    });
                    Swal.fire({
                        title: `Tareas para el ${fecha}`,
                        html: html,
                        icon: 'info',
                        confirmButtonText: 'Cerrar'
                    });
                } else {
                    // Si no hay tareas, abre el modal para agregar evento
                    eventDateInput.value = fecha;
                    eventModal.classList.remove('hidden');
                }
            });
        });
    }

    // Navegación de meses
    document.getElementById('prev-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        cargarTareasMes(renderCalendar);
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        cargarTareasMes(renderCalendar);
    });

    // Cerrar modal
    closeModalButton.addEventListener('click', () => {
        eventModal.classList.add('hidden');
    });

    cancelEventButton.addEventListener('click', () => {
        eventModal.classList.add('hidden');
    });

    // Guardar nueva tarea (evento)
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = eventTitleInput.value;
        const date = eventDateInput.value;

        // Guardar tarea en la base de datos como una tarea normal
        fetch('../php/portal.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add_tarea',
                correo: correo,
                titulo: title,
                materia_id: null, // O puedes pedir materia si lo deseas
                fecha_entrega: date,
                descripcion: ''
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Evento agregado',
                    text: `Se ha agregado el evento "${title}" para el ${date}.`,
                    confirmButtonText: 'Aceptar'
                });
                eventModal.classList.add('hidden');
                eventForm.reset();
                cargarTareasMes(renderCalendar);
            } else {
                Swal.fire('Error', data.message || 'No se pudo agregar el evento', 'error');
            }
        });
    });

    // Cargar datos de usuario para sidebar (opcional, igual que portal.js)
    fetch('../php/portal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_portal_data', correo: correo })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            let foto = data.usuario.foto_perfil;
            if (foto && !/^https?:\/\//.test(foto)) {
                foto = '../' + foto.replace(/^(\.?\/)+/, '');
            }
            document.getElementById('sidebar-foto-perfil').src = foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.usuario.nombre_completo || 'U');
            document.getElementById('sidebar-nombre').textContent = data.usuario.nombre_completo || '';
        }
    });

    // Inicializar calendario con tareas del mes actual
    cargarTareasMes(renderCalendar);
});