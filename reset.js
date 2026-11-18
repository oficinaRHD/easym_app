import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', () => {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      const form = document.getElementById('resetForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nuevaClave = document.getElementById('newPassword').value;

        const { data, error } = await supabase.auth.updateUser({
          password: nuevaClave
        });

        if (error) {
          alert("Error al actualizar la contraseña: " + error.message);
        } else {
          alert("Contraseña actualizada correctamente. Ahora puedes iniciar sesión.");
          window.location.href = "login.html";
        }
      });
    }
  });
});
