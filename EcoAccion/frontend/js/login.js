/* Login visual de demostración. No envía credenciales ni usa base de datos. */
const formLogin = document.getElementById("form-login");
const correo = document.getElementById("correo");
const contrasena = document.getElementById("contrasena");
const recordarme = document.getElementById("recordarme");
const avisoLogin = document.getElementById("aviso-login");
const botonLogin = document.getElementById("btn-login");
const botonVer = document.getElementById("alternar-contrasena");

// Si ya existe una sesión simulada, lleva al usuario directamente al proyecto.
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

botonVer.addEventListener("click", () => {
  const ocultar = contrasena.type === "text";
  contrasena.type = ocultar ? "password" : "text";
  botonVer.textContent = ocultar ? "Ver" : "Ocultar";
  botonVer.setAttribute("aria-label", ocultar ? "Mostrar contraseña" : "Ocultar contraseña");
  contrasena.focus();
});

formLogin.addEventListener("submit", (evento) => {
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
    avisoLogin.textContent = "Revisa los datos marcados para continuar.";
    avisoLogin.classList.add("visible");
    return;
  }

  botonLogin.disabled = true;
  botonLogin.textContent = "Ingresando...";

  const almacenamiento = recordarme.checked ? localStorage : sessionStorage;
  almacenamiento.setItem("ecoaccionSesion", correo.value.trim());
  window.location.href = "registrar.html";
});
