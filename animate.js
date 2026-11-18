(function() {
      'use strict';

      // Elementos del DOM
      const loginContainer = document.getElementById('loginContainer');
      const inactivityOverlay = document.getElementById('inactivityOverlay');
      const timerBar = document.getElementById('timerBar');
      
      // Variables de tiempo
      let inactivityTimer;
      const INACTIVITY_TIME = 10000; // 30 segundos

      // Función para reiniciar el temporizador
      window.resetInactivityTimer = function() {
        // Limpiar timer anterior
        clearTimeout(inactivityTimer);
        
        // Ocultar overlay de inactividad
        inactivityOverlay.classList.remove('show');
        loginContainer.classList.remove('inactive');
        
        // Reiniciar barra de progreso
        timerBar.style.animation = 'none';
        timerBar.offsetHeight; // Forzar reflow
        timerBar.style.animation = 'timer 30s linear forwards';
        
        // Iniciar nuevo temporizador
        inactivityTimer = setTimeout(showInactivityAnimation, INACTIVITY_TIME);
      };

      // Función para mostrar la animación de inactividad
      function showInactivityAnimation() {
        inactivityOverlay.classList.add('show');
        loginContainer.classList.add('inactive');
      }

      // Función para detectar actividad del usuario
      function handleUserActivity() {
        window.resetInactivityTimer();
      }

      // Lista de eventos que consideramos "actividad"
      const activityEvents = [
        'mousedown', 'mousemove', 'keydown', 'scroll',
        'touchstart', 'click', 'wheel', 'mousewheel'
      ];

      // Agregar listeners para detectar actividad
      activityEvents.forEach(eventName => {
        document.addEventListener(eventName, handleUserActivity, { passive: true });
      });

      // Inicializar el temporizador
      window.resetInactivityTimer();

      // Limpiar al salir de la página
      window.addEventListener('beforeunload', () => {
        clearTimeout(inactivityTimer);
      });

      // Toggle contraseña
      const togglePwd = document.getElementById('togglePassword');
      const pwdInput = document.getElementById('password');

      if (togglePwd && pwdInput) {
        togglePwd.addEventListener('click', function(e) {
          e.preventDefault();
          const type = pwdInput.getAttribute('type') === 'password' ? 'text' : 'password';
          pwdInput.setAttribute('type', type);
          
          this.classList.toggle('fa-eye');
          this.classList.toggle('fa-eye-slash');
          this.title = (type === 'password') ? 'Mostrar contraseña' : 'Ocultar contraseña';
        });
      }

      // Simulación de envío de formulario (demo)
      const form = document.getElementById('loginFormStatic');
      const messageDiv = document.getElementById('login-message');

      form.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        messageDiv.style.display = 'block';
        messageDiv.className = '';

        if (email === '' || password === '') {
          messageDiv.classList.add('msg-error');
          messageDiv.innerHTML = '<i class="fa-regular fa-circle-exclamation" style="margin-right: 8px;"></i> Completá ambos campos.';
        } else if (!email.includes('@') || !email.includes('.')) {
          messageDiv.classList.add('msg-error');
          messageDiv.innerHTML = '<i class="fa-regular fa-circle-exclamation" style="margin-right: 8px;"></i> Ingresá un correo válido.';
        } else if (password.length < 6) {
          messageDiv.classList.add('msg-error');
          messageDiv.innerHTML = '<i class="fa-regular fa-circle-exclamation" style="margin-right: 8px;"></i> La contraseña debe tener al menos 6 caracteres.';
        } else {
          messageDiv.classList.add('msg-success');
          messageDiv.innerHTML = '<i class="fa-regular fa-circle-check" style="margin-right: 8px;"></i> Todo correcto (demo). Redirigiendo…';

          setTimeout(() => {
            messageDiv.style.display = 'none';
          }, 2000);
        }
        
        // Reiniciar temporizador al enviar formulario
        window.resetInactivityTimer();
      });

    })();
