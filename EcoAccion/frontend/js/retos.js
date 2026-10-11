/* ==========================================================================
   retos.js — Retos sostenibles (HU09)
   - Lista los retos disponibles
   - Permite unirse a un reto y completarlo (gana puntos extra)
   ========================================================================== */
const listaRetos = document.getElementById("lista-retos");
const avisoRetos = document.getElementById("aviso-retos");

function mostrarAviso(mensaje, exito) {
  avisoRetos.textContent = mensaje;
  avisoRetos.className = "aviso " + (exito ? "exito" : "fallo");
}

function crearTarjetaReto(reto) {
  const li = document.createElement("li");
  li.className = "reto" + (reto.completado ? " reto-completado" : "");

  const icono = document.createElement("span");
  icono.className = "icono-reto";
  icono.setAttribute("aria-hidden", "true");
  icono.textContent = reto.icono;

  const cuerpo = document.createElement("div");
  cuerpo.className = "cuerpo-reto";

  const nombre = document.createElement("h2");
  nombre.textContent = reto.nombre;

  const descripcion = document.createElement("p");
  descripcion.textContent = reto.descripcion;

  const premio = document.createElement("span");
  premio.className = "premio-reto";
  premio.textContent = `+${reto.puntos} pts`;

  const acciones = document.createElement("div");
  acciones.className = "acciones-reto";

  if (reto.completado) {
    const estado = document.createElement("span");
    estado.className = "estado-reto";
    estado.textContent = "✓ Completado";
    acciones.appendChild(estado);
  } else if (reto.participando) {
    const btnCompletar = document.createElement("button");
    btnCompletar.className = "boton-primario boton-mini";
    btnCompletar.textContent = "Marcar como completado";
    btnCompletar.addEventListener("click", () => completar(reto.id, btnCompletar));
    acciones.appendChild(btnCompletar);
  } else {
    const btnUnirse = document.createElement("button");
    btnUnirse.className = "boton-secundario boton-mini";
    btnUnirse.textContent = "Unirme al reto";
    btnUnirse.addEventListener("click", () => unirse(reto.id, btnUnirse));
    acciones.appendChild(btnUnirse);
  }

  cuerpo.append(nombre, descripcion, premio, acciones);
  li.append(icono, cuerpo);
  return li;
}

async function cargarRetos() {
  listaRetos.innerHTML = '<li class="cargando">Cargando retos...</li>';
  try {
    const res = await fetch("/api/retos");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error();

    listaRetos.replaceChildren();
    if (data.retos.length === 0) {
      listaRetos.innerHTML = '<li class="cargando">Aún no hay retos disponibles.</li>';
      return;
    }
    data.retos.forEach((reto) => listaRetos.appendChild(crearTarjetaReto(reto)));
  } catch (err) {
    listaRetos.innerHTML = '<li class="cargando">No se pudieron cargar los retos.</li>';
  }
}

async function unirse(retoId, boton) {
  boton.disabled = true;
  try {
    const res = await fetch(`/api/retos/${retoId}/unirse`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      mostrarAviso("Te uniste al reto. ¡A por él!", true);
      cargarRetos();
    } else {
      mostrarAviso(data.mensaje || "No se pudo unir al reto.", false);
      boton.disabled = false;
    }
  } catch (err) {
    mostrarAviso("Error de conexión.", false);
    boton.disabled = false;
  }
}

async function completar(retoId, boton) {
  boton.disabled = true;
  try {
    const res = await fetch(`/api/retos/${retoId}/completar`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      const detalle = data.puntaje_acumulado != null
        ? ` Tu puntaje acumulado es ${data.puntaje_acumulado} pts.`
        : "";
      mostrarAviso(data.mensaje + detalle, true);
      cargarRetos();
    } else {
      mostrarAviso(data.mensaje || "No se pudo completar el reto.", false);
      boton.disabled = false;
    }
  } catch (err) {
    mostrarAviso("Error de conexión.", false);
    boton.disabled = false;
  }
}

cargarRetos();
