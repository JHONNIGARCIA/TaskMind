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

    // Cargar datos del portal al iniciar
    fetch('../php/portal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_portal_data', correo: correo })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            // Perfil
            let foto = data.usuario.foto_perfil;
            if (foto && !/^https?:\/\//.test(foto)) {
                // Si es ruta relativa desde la base de datos, ajústala para que sea accesible desde el navegador
                foto = '../' + foto.replace(/^(\.?\/)+/, '');
            }
            document.getElementById('nombre-usuario').textContent = data.usuario.nombre_completo || '';
            document.getElementById('correo-usuario').textContent = data.usuario.correo || '';
            document.getElementById('semestre-usuario').textContent = data.usuario.semestre || '';
            document.getElementById('foto-perfil').src = foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.usuario.nombre_completo || 'U');
            document.getElementById('sidebar-foto-perfil').src = foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.usuario.nombre_completo || 'U');
            document.getElementById('sidebar-nombre').textContent = data.usuario.nombre_completo || '';

            // Materias
            const materiasList = document.getElementById('materias-list');
            materiasList.innerHTML = '';
            if (data.materias && data.materias.length > 0) {
                data.materias.forEach(materia => {
                    const color = materia.color_etiqueta || 'indigo';
                    materiasList.innerHTML += `<div class="flex items-center">
                        <span class="inline-block w-3 h-3 rounded-full mr-2 bg-${color}-600"></span>
                        <span>${materia.nombre_materia}</span>
                    </div>`;
                });
            } else {
                materiasList.innerHTML = '<p class="text-gray-500 text-sm">No tienes materias registradas.</p>';
            }

            // Tareas próximas
            const tareasProximas = document.getElementById('tareas-proximas');
            tareasProximas.innerHTML = '';
            if (data.tareas && data.tareas.length > 0) {
                data.tareas.forEach(tarea => {
                    const fecha = new Date(tarea.fecha_entrega);
                    const fechaStr = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                    tareasProximas.innerHTML += `
                        <div class="p-4 task-card transition flex flex-col md:flex-row md:items-center md:justify-between gap-2 ${tarea.completada == 1 ? 'opacity-60 line-through' : ''}">
                            <div>
                                <h4 class="font-medium text-gray-800">${tarea.titulo}</h4>
                                <p class="text-sm text-gray-500 mt-1">Materia: ${tarea.nombre_materia}</p>
                                ${tarea.descripcion ? `<div class="mt-2 flex items-center text-sm text-gray-500">${tarea.descripcion}</div>` : ''}
                            </div>
                            <div class="flex gap-2 mt-2 md:mt-0">
                                <button class="completar-tarea" data-id="${tarea.id}" ${tarea.completada == 1 ? 'disabled' : ''} title="Completar tarea" style="background:none;border:none;padding:0;">
                                    <!-- Palomita animada y moderna -->
                                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 shadow-md transition">
                                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                                        </svg>
                                    </span>
                                </button>
                                <button class="editar-tarea" data-id="${tarea.id}" title="Editar tarea" style="background:none;border:none;padding:0;">
                                    <!-- Cuaderno/nota moderno -->
                                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 hover:from-yellow-400 hover:to-yellow-600 shadow-md transition">
                                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                            <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"></rect>
                                            <path d="M8 2v4M16 2v4M4 10h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </span>
                                </button>
                                <button class="eliminar-tarea" data-id="${tarea.id}" title="Eliminar tarea" style="background:none;border:none;padding:0;">
                                    <!-- Bote de basura moderno -->
                                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 shadow-md transition">
                                        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m2 0v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7z"/>
                                            <line x1="10" y1="11" x2="10" y2="17" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                            <line x1="14" y1="11" x2="14" y2="17" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </span>
                                </button>
                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded self-center">${fechaStr}</span>
                            </div>
                        </div>
                    `;
                });

                // Eventos para completar tarea
                document.querySelectorAll('.completar-tarea').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const id = this.dataset.id;
                        Swal.fire({
                            title: '¿Marcar como completada?',
                            icon: 'question',
                            showCancelButton: true,
                            confirmButtonText: 'Sí, completar',
                            cancelButtonText: 'Cancelar'
                        }).then(result => {
                            if (result.isConfirmed) {
                                fetch('../php/portal.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'completar_tarea', id: id })
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.success) {
                                        Swal.fire('¡Completada!', '', 'success').then(() => location.reload());
                                    } else {
                                        Swal.fire('Error', data.message || 'No se pudo completar la tarea', 'error');
                                    }
                                });
                            }
                        });
                    });
                });

                // Eventos para eliminar tarea
                document.querySelectorAll('.eliminar-tarea').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const id = this.dataset.id;
                        Swal.fire({
                            title: '¿Eliminar tarea?',
                            text: 'Esta acción no se puede deshacer.',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Sí, eliminar',
                            cancelButtonText: 'Cancelar'
                        }).then(result => {
                            if (result.isConfirmed) {
                                fetch('../php/portal.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'eliminar_tarea', id: id })
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.success) {
                                        Swal.fire('Eliminada', '', 'success').then(() => location.reload());
                                    } else {
                                        Swal.fire('Error', data.message || 'No se pudo eliminar la tarea', 'error');
                                    }
                                });
                            }
                        });
                    });
                });

                // Eventos para editar tarea
                document.querySelectorAll('.editar-tarea').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        const id = this.dataset.id;
                        // Buscar tarea por id
                        const tarea = data.tareas.find(t => t.id == id);
                        Swal.fire({
                            title: 'Editar Tarea',
                            html: `
                                <div class="space-y-4 text-left">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Tarea</label>
                                        <input id="editTaskName" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${tarea.titulo}">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                                        <input id="editTaskSubject" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${tarea.nombre_materia}" disabled>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                                        <input id="editTaskDueDate" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${tarea.fecha_entrega}">
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-1">Descripción/Enlaces</label>
                                        <textarea id="editTaskDescription" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3">${tarea.descripcion || ''}</textarea>
                                    </div>
                                </div>
                            `,
                            showCancelButton: true,
                            confirmButtonText: 'Guardar Cambios',
                            cancelButtonText: 'Cancelar',
                            focusConfirm: false,
                            preConfirm: () => {
                                return {
                                    id: id,
                                    titulo: document.getElementById('editTaskName').value,
                                    fecha_entrega: document.getElementById('editTaskDueDate').value,
                                    descripcion: document.getElementById('editTaskDescription').value
                                }
                            }
                        }).then(result => {
                            if (result.isConfirmed) {
                                fetch('../php/portal.php', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        action: 'editar_tarea',
                                        id: result.value.id,
                                        titulo: result.value.titulo,
                                        fecha_entrega: result.value.fecha_entrega,
                                        descripcion: result.value.descripcion
                                    })
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if (data.success) {
                                        Swal.fire('¡Tarea actualizada!', '', 'success').then(() => location.reload());
                                    } else {
                                        Swal.fire('Error', data.message || 'No se pudo actualizar la tarea', 'error');
                                    }
                                });
                            }
                        });
                    });
                });
            } else {
                tareasProximas.innerHTML = '<p class="text-gray-500 text-sm p-4">No tienes tareas próximas.</p>';
            }

            // Estadísticas
            const statsContainer = document.getElementById('stats-container');
            const completadas = data.tareas.filter(t => t.completada == 1).length;
            const pendientes = data.tareas.filter(t => t.completada == 0).length;
            statsContainer.innerHTML = `
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-indigo-100 text-indigo-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-gray-500">Tareas Completadas</p>
                            <p class="text-xl font-semibold text-gray-800">${completadas}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-red-100 text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-gray-500">Tareas Pendientes</p>
                            <p class="text-xl font-semibold text-gray-800">${pendientes}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-green-100 text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 19 7.5 19s3.332-.523 4.5-1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.523 4.5 1.253v13C19.832 18.477 18.247 19 16.5 19c-1.746 0-3.332-.523-4.5-1.253" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-gray-500">Materias Registradas</p>
                            <p class="text-xl font-semibold text-gray-800">${data.materias.length}</p>
                        </div>
                    </div>
                </div>
                <div class="bg-white rounded-lg shadow p-4">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-gray-500">Próximas Tareas</p>
                            <p class="text-xl font-semibold text-gray-800">${pendientes}</p>
                        </div>
                    </div>
                </div>
            `;

            // Verificar tareas próximas (hoy o mañana)
            const now = new Date();
            let tareaProxima = null;
            let diffMin = 9999;
            if (data.tareas && data.tareas.length > 0) {
                data.tareas.forEach(tarea => {
                    const dueDate = new Date(tarea.fecha_entrega);
                    const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
                    if (diffDays === 0 || diffDays === 1) {
                        if (diffDays < diffMin) {
                            tareaProxima = { name: tarea.titulo, diffDays };
                            diffMin = diffDays;
                        }
                    }
                });
            }
            if (tareaProxima) {
                Swal.fire({
                    title: '¡Tarea Próxima!',
                    html: `La tarea <strong>${tareaProxima.name}</strong> vence ${tareaProxima.diffDays === 0 ? 'hoy' : 'mañana'}.<br><br>No olvides realizarla a tiempo.`,
                    icon: 'warning',
                    confirmButtonText: 'Entendido',
                    timer: 10000,
                    timerProgressBar: true
                });
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudieron cargar los datos del portal',
            });
        }
    })
    .catch(() => {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error de conexión con el servidor',
        });
    });

    // Registrar nueva materia
    document.getElementById('addSubjectBtn').addEventListener('click', function() {
        Swal.fire({
            title: 'Agregar Nueva Materia',
            html: `
                <div class="space-y-4 text-left">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Materia</label>
                        <input id="subjectName" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ej: Álgebra Lineal">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <div class="grid grid-cols-6 gap-2">
                            <div>
                                <input type="radio" id="color-indigo" name="subjectColor" value="indigo" class="hidden peer" checked>
                                <label for="color-indigo" class="block w-6 h-6 bg-indigo-600 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-indigo-500 peer-checked:ring-offset-2"></label>
                            </div>
                            <div>
                                <input type="radio" id="color-green" name="subjectColor" value="green" class="hidden peer">
                                <label for="color-green" class="block w-6 h-6 bg-green-600 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-green-500 peer-checked:ring-offset-2"></label>
                            </div>
                            <div>
                                <input type="radio" id="color-blue" name="subjectColor" value="blue" class="hidden peer">
                                <label for="color-blue" class="block w-6 h-6 bg-blue-600 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-blue-500 peer-checked:ring-offset-2"></label>
                            </div>
                            <div>
                                <input type="radio" id="color-yellow" name="subjectColor" value="yellow" class="hidden peer">
                                <label for="color-yellow" class="block w-6 h-6 bg-yellow-600 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-yellow-500 peer-checked:ring-offset-2"></label>
                            </div>
                            <div>
                                <input type="radio" id="color-purple" name="subjectColor" value="purple" class="hidden peer">
                                <label for="color-purple" class="block w-6 h-6 bg-purple-600 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-purple-500 peer-checked:ring-offset-2"></label>
                            </div>
                            <div>
                                <input type="radio" id="color-red" name="subjectColor" value="red" class="hidden peer">
                                <label for="color-red" class="block w-6 h-6 bg-red-600 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-red-500 peer-checked:ring-offset-2"></label>
                            </div>
                            <div>
                                <input type="radio" id="color-pink" name="subjectColor" value="pink" class="hidden peer">
                                <label for="color-pink" class="block w-6 h-6 bg-pink-600 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-pink-500 peer-checked:ring-offset-2"></label>
                            </div>
                            <div>
                                <input type="radio" id="color-gray" name="subjectColor" value="gray" class="hidden peer">
                                <label for="color-gray" class="block w-6 h-6 bg-gray-600 rounded-full cursor-pointer peer-checked:ring-2 peer-checked:ring-gray-500 peer-checked:ring-offset-2"></label>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Agregar Materia',
            cancelButtonText: 'Cancelar',
            focusConfirm: false,
            preConfirm: () => {
                return {
                    name: document.getElementById('subjectName').value,
                    color: document.querySelector('input[name="subjectColor"]:checked').value
                }
            }
        }).then((result) => {
            if (result.isConfirmed && result.value.name) {
                // AJAX para guardar materia
                fetch('../php/portal.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'add_materia',
                        correo: localStorage.getItem('correo'),
                        nombre_materia: result.value.name,
                        color_etiqueta: result.value.color
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('¡Materia Agregada!', '', 'success').then(() => location.reload());
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo agregar la materia', 'error');
                    }
                });
            }
        });
    });

    // Registrar nueva tarea
    document.getElementById('newTaskBtn').addEventListener('click', function() {
        // Cargar materias para el select
        fetch('../php/portal.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'get_materias',
                correo: localStorage.getItem('correo')
            })
        })
        .then(res => res.json())
        .then(data => {
            let options = '<option value="">Seleccione una materia</option>';
            if (data.success && data.materias) {
                data.materias.forEach(m => {
                    options += `<option value="${m.id}">${m.nombre_materia}</option>`;
                });
            }
            Swal.fire({
                title: 'Agregar Nueva Tarea',
                html: `
                    <div class="space-y-4 text-left">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Tarea</label>
                            <input id="taskName" class="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Ej: Ensayo literario">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                            <select id="taskSubject" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                ${options}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Fecha de Entrega</label>
                            <input id="taskDueDate" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Descripción/Enlaces</label>
                            <textarea id="taskDescription" class="w-full px-3 py-2 border border-gray-300 rounded-md" rows="3" placeholder="Detalles importantes o enlaces relevantes"></textarea>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Guardar Tarea',
                cancelButtonText: 'Cancelar',
                focusConfirm: false,
                preConfirm: () => {
                    return {
                        name: document.getElementById('taskName').value,
                        subject: document.getElementById('taskSubject').value,
                        dueDate: document.getElementById('taskDueDate').value,
                        description: document.getElementById('taskDescription').value
                    }
                }
            }).then((result) => {
                if (result.isConfirmed && result.value.name && result.value.subject && result.value.dueDate) {
                    // AJAX para guardar tarea
                    fetch('../php/portal.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'add_tarea',
                            correo: localStorage.getItem('correo'),
                            titulo: result.value.name,
                            materia_id: result.value.subject,
                            fecha_entrega: result.value.dueDate,
                            descripcion: result.value.description
                        })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire('¡Tarea Agregada!', '', 'success').then(() => location.reload());
                        } else {
                            Swal.fire('Error', data.message || 'No se pudo agregar la tarea', 'error');
                        }
                    });
                }
            });
        });
    });

    // Modificar perfil (ahora permite subir foto)
    document.getElementById('foto-perfil').addEventListener('click', function() {
        document.getElementById('input-foto-perfil').click();
    });

    document.getElementById('input-foto-perfil').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('action', 'update_foto_perfil');
        formData.append('correo', localStorage.getItem('correo'));
        formData.append('foto_perfil', file);

        Swal.fire({
            title: 'Subiendo foto...',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        fetch('../php/portal.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            Swal.close();
            if (data.success) {
                Swal.fire('¡Foto actualizada!', '', 'success').then(() => location.reload());
            } else {
                Swal.fire('Error', data.message || 'No se pudo actualizar la foto', 'error');
            }
        })
        .catch(() => {
            Swal.close();
            Swal.fire('Error', 'Error de conexión con el servidor', 'error');
        });
    });

    // Modificar perfil
    document.getElementById('foto-perfil').addEventListener('click', function() {
        const nombre = document.getElementById('nombre-usuario').textContent;
        const correo = document.getElementById('correo-usuario').textContent;
        const semestre = document.getElementById('semestre-usuario').textContent;
        Swal.fire({
            title: 'Editar Perfil',
            html: `
                <div class="space-y-4 text-left">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                        <input id="edit-nombre" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${nombre}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Correo</label>
                        <input id="edit-correo" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${correo}" disabled>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
                        <input id="edit-semestre" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="${semestre}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Foto de perfil (URL)</label>
                        <input id="edit-foto" class="w-full px-3 py-2 border border-gray-300 rounded-md" value="">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            cancelButtonText: 'Cancelar',
            focusConfirm: false,
            preConfirm: () => {
                return {
                    nombre: document.getElementById('edit-nombre').value,
                    semestre: document.getElementById('edit-semestre').value,
                    foto_perfil: document.getElementById('edit-foto').value
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                fetch('../php/portal.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'update_perfil',
                        correo: localStorage.getItem('correo'),
                        nombre_completo: result.value.nombre,
                        semestre: result.value.semestre,
                        foto_perfil: result.value.foto_perfil
                    })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('¡Perfil actualizado!', '', 'success').then(() => location.reload());
                    } else {
                        Swal.fire('Error', data.message || 'No se pudo actualizar el perfil', 'error');
                    }
                });
            }
        });
    });

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', function() {
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: "Estás a punto de cerrar sesión en tu cuenta.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('correo');
                window.location.href = 'index.html';
            }
        });
    });
    document.getElementById("logoutBtn").addEventListener("click", () => {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que deseas salir?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Borrar localStorage (si usas para el login)
            localStorage.clear();

            // Opcional: hacer una petición al servidor para destruir la sesión
            // location.href = '../logout.php'; (si tuvieras logout.php)
            
            // Redirigir y bloquear volver con back
            window.location.replace("index.html");
        }
    });
});

});
