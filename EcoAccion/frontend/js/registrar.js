/* ==========================================================================
   registrar.js — Lógica de la pantalla "Registrar acción" (HU03)
   - Carga y muestra el selector visual de categorías (HU04)
   - Valida los campos obligatorios antes de enviar
   - Notifica éxito o error al usuario
   ========================================================================== */

const form = document.getElementById("form-accion");
const inputCategoria = document.getElementById("categoria");
const inputFecha = document.getElementById("fecha");
const textareaDescripcion = document.getElementById("descripcion");
const contador = document.getElementById("contador");
const aviso = document.getElementById("aviso");
const btnGuardar = document.getElementById("btn-guardar");
const btnAbrirCategorias = document.getElementById("abrir-categorias");
const textoCategoria = document.getElementById("categoria-seleccionada");
const dialogoCategorias = document.getElementById("dialogo-categorias");
const btnCerrarCategorias = document.getElementById("cerrar-categorias");
const btnConfirmarCategoria = document.getElementById("confirmar-categoria");
const listaCategorias = document.getElementById("lista-categorias");

let categorias = [];
let categoriaTemporal = "";

// --- Cargar categorías al abrir la pantalla ---
async function cargarCategorias() {
  try {
    const res = await fetch("/api/categorias");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error();
    categorias = data.categorias;
    renderizarCategorias();
  } catch (err) {
    listaCategorias.innerHTML = '<p class="cargando">No se pudieron cargar los tipos de acción.</p>';
    mostrarAviso("No se pudieron cargar los tipos de acción.", false);
  }
}

function renderizarCategorias() {
  listaCategorias.replaceChildren();
  categorias.forEach((cat) => {
    const etiqueta = document.createElement("label");
    etiqueta.className = "opcion-categoria";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "categoria-elegida";
    radio.value = cat.valor;
    radio.checked = cat.valor === categoriaTemporal;

    const icono = document.createElement("span");
    icono.className = "icono-categoria";
    icono.setAttribute("aria-hidden", "true");
    icono.textContent = cat.icono;

    const textos = document.createElement("span");
    textos.className = "textos-categoria";

    const nombre = document.createElement("strong");
    nombre.textContent = cat.nombre;

    const descripcion = document.createElement("small");
    descripcion.textContent = cat.descripcion;

    const puntos = document.createElement("span");
    puntos.className = "puntos-categoria";
    puntos.textContent = `+${cat.puntos}`;
    puntos.setAttribute("aria-label", `${cat.puntos} puntos`);

    textos.append(nombre, descripcion);
    etiqueta.append(radio, icono, textos, puntos);
    listaCategorias.appendChild(etiqueta);

    radio.addEventListener("change", () => {
      categoriaTemporal = radio.value;
      btnConfirmarCategoria.disabled = false;
    });
  });
}

function abrirCategorias() {
  categoriaTemporal = inputCategoria.value;
  btnConfirmarCategoria.disabled = !categoriaTemporal;
  renderizarCategorias();
  dialogoCategorias.showModal();
}

function cerrarCategorias() {
  dialogoCategorias.close();
}

btnAbrirCategorias.addEventListener("click", abrirCategorias);
btnCerrarCategorias.addEventListener("click", cerrarCategorias);

btnConfirmarCategoria.addEventListener("click", () => {
  const categoria = categorias.find((item) => item.valor === categoriaTemporal);
  if (!categoria) return;

  inputCategoria.value = categoria.valor;
  textoCategoria.textContent = `${categoria.icono} ${categoria.nombre} (+${categoria.puntos} pts)`;
  btnAbrirCategorias.classList.add("con-seleccion");
  document.getElementById("campo-categoria").classList.remove("invalido");
  document.getElementById("error-categoria").textContent = "";
  cerrarCategorias();
});

dialogoCategorias.addEventListener("click", (evento) => {
  if (evento.target === dialogoCategorias) cerrarCategorias();
});

// --- Contador de caracteres de la descripción ---
textareaDescripcion.addEventListener("input", () => {
  contador.textContent = textareaDescripcion.value.length;
});

// --- Utilidades de validación visual ---
function marcarError(campoId, mensaje) {
  document.getElementById(`campo-${campoId}`).classList.add("invalido");
  document.getElementById(`error-${campoId}`).textContent = mensaje;
}

function limpiarErrores() {
  ["categoria", "fecha", "descripcion"].forEach((id) => {
    document.getElementById(`campo-${id}`).classList.remove("invalido");
    document.getElementById(`error-${id}`).textContent = "";
  });
  aviso.className = "aviso";
  aviso.textContent = "";
}

function mostrarAviso(mensaje, exito) {
  aviso.textContent = mensaje;
  aviso.className = "aviso " + (exito ? "exito" : "fallo");
}

// Valida en el cliente antes de enviar (el backend vuelve a validar por seguridad)
function validarEnCliente() {
  let valido = true;

  if (!inputCategoria.value) {
    marcarError("categoria", "Selecciona un tipo de acción.");
    valido = false;
  }
  if (!inputFecha.value) {
    marcarError("fecha", "La fecha es obligatoria.");
    valido = false;
  }
  if (!textareaDescripcion.value.trim()) {
    marcarError("descripcion", "La descripción es obligatoria.");
    valido = false;
  }
  return valido;
}

// --- Envío del formulario ---
form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limpiarErrores();

  if (!validarEnCliente()) {
    mostrarAviso("Completa los campos obligatorios.", false);
    return;
  }

  const payload = {
    categoria: inputCategoria.value,
    fecha: inputFecha.value,
    descripcion: textareaDescripcion.value.trim(),
  };

  btnGuardar.disabled = true;
  btnGuardar.textContent = "Guardando...";

  try {
    const res = await fetch("/api/acciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok && data.ok) {
      mostrarAviso(data.mensaje, true);
      form.reset();
      textoCategoria.textContent = "Seleccionar tipo";
      btnAbrirCategorias.classList.remove("con-seleccion");
      categoriaTemporal = "";
      contador.textContent = "0";
    } else if (data.errores) {
      // Errores de validación devueltos por el backend
      Object.entries(data.errores).forEach(([campo, msj]) => marcarError(campo, msj));
      mostrarAviso("Revisa los campos marcados.", false);
    } else {
      // Error del servidor -> notifica al usuario (criterio HU03)
      mostrarAviso(data.mensaje || "No se pudo registrar la acción.", false);
    }
  } catch (err) {
    // Fallo de red / servidor caído
    mostrarAviso("Error de conexión. Verifica tu red e inténtalo de nuevo.", false);
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = "Guardar acción";
  }
});

// Inicialización
cargarCategorias();
