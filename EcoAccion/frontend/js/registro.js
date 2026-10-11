/* ==========================================================================
   registro.js — Registro de usuario (HU01)
   Crea la cuenta en el backend (datos quemados) y entra automáticamente.
   ========================================================================== */
const formRegistro = document.getElementById("form-registro");
const nombre = document.getElementById("nombre");
const correo = document.getElementById("correo");
const password = document.getElementById("password");
const avisoRegistro = document.getElementById("aviso-registro");
const botonRegistro = document.getElementById("btn-registro");
const botonVer = document.getElementById("alternar-password");

function mostrarError(campo, mensaje) {
  document.getElementById(`campo-${campo}`).classList.add("invalido");
  document.getElementById(`error-${campo}`).textContent = mensaje;
}

function limpiarErrores() {
  ["nombre", "correo", "password"].forEach((campo) => {
    document.getElementById(`campo-${campo}`).classList.remove("invalido");
    document.getElementById(`error-${campo}`).textContent = "";
  });
  avisoRegistro.textContent = "";
  avisoRegistro.classList.remove("visible");
}

function avisar(mensaje) {
  avisoRegistro.textContent = mensaje;
  avisoRegistro.classList.add("visible");
}

botonVer.addEventListener("click", () => {
  const ocultar = password.type === "text";
  password.type = ocultar ? "password" : "text";
  botonVer.textContent = ocultar ? "Ver" : "Ocultar";
  password.focus();
});

formRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limpiarErrores();

  let valido = true;
  if (!nombre.value.trim()) {
    mostrarError("nombre", "El nombre es obligatorio.");
    valido = false;
  }
  if (!correo.validity.valid) {
    mostrarError("correo", "Escribe un correo válido.");
    valido = false;
  }
  if (password.value.length < 4) {
    mostrarError("password", "La contraseña debe tener al menos 4 caracteres.");
    valido = false;
  }
  if (!valido) {
    avisar("Revisa los datos marcados para continuar.");
    return;
  }

  botonRegistro.disabled = true;
  botonRegistro.textContent = "Creando...";

  try {
    const res = await fetch("/api/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombre.value.trim(),
        correo: correo.value.trim(),
        password: password.value,
      }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      // Queda logueado automáticamente tras registrarse.
      localStorage.setItem("ecoaccionSesion", data.correo);
      window.location.href = "registrar.html";
    } else if (data.errores) {
      Object.entries(data.errores).forEach(([campo, msj]) => mostrarError(campo, msj));
      avisar("Revisa los datos marcados.");
    } else {
      avisar(data.mensaje || "No se pudo crear la cuenta.");
    }
  } catch (err) {
    avisar("Error de conexión. Inténtalo de nuevo.");
  } finally {
    botonRegistro.disabled = false;
    botonRegistro.textContent = "Crear cuenta";
  }
});
