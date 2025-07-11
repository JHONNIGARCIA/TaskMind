document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const toggleText = document.getElementById('toggle-text');
    const formsContainer = document.getElementById('forms-container');
    
    let isLoginVisible = true;
    
    // Toggle between login and register forms
    document.querySelectorAll('.toggle-form').forEach(btn => {
        btn.addEventListener('click', function () {
            isLoginVisible = !isLoginVisible;

             if (isLoginVisible) {
                loginForm.classList.remove('opacity-0', 'pointer-events-none', 'translate-x-4');
                registerForm.classList.add('opacity-0', 'pointer-events-none', 'translate-x-4');
                toggleLoginText.classList.remove('hidden');
                toggleRegisterText.classList.add('hidden');
            } else {
                loginForm.classList.add('opacity-0', 'pointer-events-none', 'translate-x-4');
                registerForm.classList.remove('opacity-0', 'pointer-events-none', 'translate-x-4');
                toggleLoginText.classList.add('hidden');
                toggleRegisterText.classList.remove('hidden');
            }
        }
)});

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Por favor completa todos los campos',
            });
            return;
        }

        // Enviar datos al backend PHP
        fetch('../php/index.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'login',
                correo: email,
                contrasena: password
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Inicio de sesión exitoso',
                    text: 'Redirigiendo a tu agenda...',
                    showConfirmButton: false,
                    timer: 1500
                });
                setTimeout(() => {
                    localStorage.setItem('correo', email);
                    window.location.href = 'portal.html';
                }, 1500);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'Credenciales incorrectas',
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
    });
    
    // Register form submission
    registerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        const confirmPass = document.getElementById('reg-confirm').value;

        // Validaciones
        if (!name || !email || !password || !confirmPass) {
            Swal.fire({
                icon: 'error',
                title: 'Campos incompletos',
                text: 'Por favor completa todos los campos',
            });
            return;
        }

        if (password !== confirmPass) {
            Swal.fire({
                icon: 'error',
                title: 'Contraseñas no coinciden',
                text: 'Las contraseñas ingresadas no son iguales',
            });
            return;
        }

        if (password.length < 6) {
            Swal.fire({
                icon: 'error',
                title: 'Contraseña muy corta',
                text: 'La contraseña debe tener al menos 6 caracteres',
            });
            return;
        }

        // Enviar datos al backend PHP
        fetch('../php/index.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'register',
                correo: email,
                contrasena: password,
                nombre_completo: name
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Registro exitoso!',
                    html: `Bienvenido <strong>${name}</strong> a TaskMind.<br>Tu cuenta ha sido creada correctamente.`,
                    showConfirmButton: false,
                    timer: 3000
                });
                setTimeout(() => {
                    isLoginVisible = true;
                    loginForm.classList.remove('opacity-0', 'pointer-events-none', 'translate-x-4');
                    registerForm.classList.add('opacity-0', 'pointer-events-none', 'translate-x-4');
                    toggleText.innerHTML = '¿No tienes una cuenta? <span class="toggle-form text-indigo-600 font-medium">Regístrate aquí</span>';
                    registerForm.reset();
                }, 3000);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.message || 'No se pudo registrar el usuario',
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
    });
});
