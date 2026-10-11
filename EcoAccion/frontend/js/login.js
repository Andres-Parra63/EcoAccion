/* ==========================================================================
   login.js — Inicio de sesión (HU02)
   Valida las credenciales contra el backend (datos quemados en memoria).
   ========================================================================== */
const formLogin = document.getElementById("form-login");
const correo = document.getElementById("correo");
const contrasena = document.getElementById("contrasena");
const recordarme = document.getElementById("recordarme");
const avisoLogin = document.getElementById("aviso-login");
const botonLogin = document.getElementById("btn-login");
const botonVer = document.getElementById("alternar-contrasena");

// Si ya hay sesión guardada, entra directo.
if (localStorage.getItem("ecoaccionSesion") || sessionStorage.getItem("ecoaccionSesion")) {
  window.location.replace("registrar.html");
}

function mostrarError(campo, mensaje) {
  document.getElementById(`campo-${campo}`).classList.add("invalido");
  document.getElementById(`error-${campo}`).textContent = mensaje;
}

function limpiarErrores() {
  ["correo", "contrasena"].forEach((campo) => {
    document.getElementById(`campo-${campo}`).classList.remove("invalido");
    document.getElementById(`error-${campo}`).textContent = "";
  });
  avisoLogin.textContent = "";
  avisoLogin.classList.remove("visible");
}

function avisar(mensaje) {
  avisoLogin.textContent = mensaje;
  avisoLogin.classList.add("visible");
}

botonVer.addEventListener("click", () => {
  const ocultar = contrasena.type === "text";
  contrasena.type = ocultar ? "password" : "text";
  botonVer.textContent = ocultar ? "Ver" : "Ocultar";
  botonVer.setAttribute("aria-label", ocultar ? "Mostrar contraseña" : "Ocultar contraseña");
  contrasena.focus();
});

formLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limpiarErrores();

  let valido = true;
  if (!correo.validity.valid) {
    mostrarError("correo", "Escribe un correo electrónico válido.");
    valido = false;
  }
  if (contrasena.value.length < 4) {
    mostrarError("contrasena", "La contraseña debe tener al menos 4 caracteres.");
    valido = false;
  }
  if (!valido) {
    avisar("Revisa los datos marcados para continuar.");
    return;
  }

  botonLogin.disabled = true;
  botonLogin.textContent = "Ingresando...";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: correo.value.trim(), password: contrasena.value }),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      const almacenamiento = recordarme.checked ? localStorage : sessionStorage;
      almacenamiento.setItem("ecoaccionSesion", data.correo);
      window.location.href = "registrar.html";
    } else if (data.errores) {
      Object.entries(data.errores).forEach(([campo, msj]) => mostrarError(campo, msj));
      avisar("Revisa los datos marcados.");
    } else {
      avisar(data.mensaje || "No se pudo iniciar sesión.");
    }
  } catch (err) {
    avisar("Error de conexión. Inténtalo de nuevo.");
  } finally {
    botonLogin.disabled = false;
    botonLogin.textContent = "Iniciar sesión";
  }
});
