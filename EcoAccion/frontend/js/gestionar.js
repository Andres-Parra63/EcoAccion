/* ==========================================================================
   gestionar.js — Gestionar acciones y retos (HU10)
   - Lista y elimina acciones registradas
   - Lista, crea y elimina retos
   ========================================================================== */
const avisoGestion = document.getElementById("aviso-gestion");
const listaAcciones = document.getElementById("lista-acciones");
const listaRetosGestion = document.getElementById("lista-retos-gestion");
const botonesPanel = document.querySelectorAll(".pestanas button");
const panelAcciones = document.getElementById("panel-acciones");
const panelRetos = document.getElementById("panel-retos");
const formReto = document.getElementById("form-reto");

function mostrarAviso(mensaje, exito) {
  avisoGestion.textContent = mensaje;
  avisoGestion.className = "aviso " + (exito ? "exito" : "fallo");
}

// --- Pestañas ---
botonesPanel.forEach((btn) => {
  btn.addEventListener("click", () => {
    botonesPanel.forEach((b) => b.classList.remove("activa"));
    btn.classList.add("activa");
    const panel = btn.dataset.panel;
    panelAcciones.hidden = panel !== "acciones";
    panelRetos.hidden = panel !== "retos";
  });
});

// --- Acciones ---
async function cargarAcciones() {
  listaAcciones.innerHTML = '<li class="cargando">Cargando...</li>';
  try {
    const res = await fetch("/api/gestion/acciones");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error();

    listaAcciones.replaceChildren();
    if (data.acciones.length === 0) {
      listaAcciones.innerHTML = '<li class="cargando">No hay acciones registradas.</li>';
      return;
    }
    data.acciones.forEach((a) => {
      const li = document.createElement("li");
      li.className = "fila-gestion";
      li.innerHTML = `
        <span class="icono-gestion" aria-hidden="true">${a.categoria_icono}</span>
        <div class="texto-gestion">
          <strong>${a.categoria_nombre} · ${a.puntos} pts</strong>
          <small>${a.usuario} · ${a.fecha}</small>
          <p>${a.descripcion}</p>
        </div>`;
      const btn = document.createElement("button");
      btn.className = "boton-eliminar";
      btn.textContent = "Eliminar";
      btn.setAttribute("aria-label", "Eliminar acción");
      btn.addEventListener("click", () => eliminarAccion(a.id));
      li.appendChild(btn);
      listaAcciones.appendChild(li);
    });
  } catch (err) {
    listaAcciones.innerHTML = '<li class="cargando">No se pudieron cargar las acciones.</li>';
  }
}

async function eliminarAccion(id) {
  try {
    const res = await fetch(`/api/gestion/acciones/${id}/eliminar`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      mostrarAviso("Acción eliminada.", true);
      cargarAcciones();
    } else {
      mostrarAviso(data.mensaje || "No se pudo eliminar.", false);
    }
  } catch (err) {
    mostrarAviso("Error de conexión.", false);
  }
}

// --- Retos ---
async function cargarRetosGestion() {
  listaRetosGestion.innerHTML = '<li class="cargando">Cargando...</li>';
  try {
    const res = await fetch("/api/gestion/retos");
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error();

    listaRetosGestion.replaceChildren();
    data.retos.forEach((r) => {
      const li = document.createElement("li");
      li.className = "fila-gestion";
      li.innerHTML = `
        <span class="icono-gestion" aria-hidden="true">${r.icono}</span>
        <div class="texto-gestion">
          <strong>${r.nombre} · ${r.puntos} pts</strong>
          <small>${r.inscritos} participante(s) · ${r.vencido ? "vencido" : "vence " + r.fecha_limite}</small>
          <p>${r.descripcion}</p>
        </div>`;
      const btn = document.createElement("button");
      btn.className = "boton-eliminar";
      btn.textContent = "Eliminar";
      btn.addEventListener("click", () => eliminarReto(r.id));
      li.appendChild(btn);
      listaRetosGestion.appendChild(li);
    });
  } catch (err) {
    listaRetosGestion.innerHTML = '<li class="cargando">No se pudieron cargar los retos.</li>';
  }
}

async function eliminarReto(id) {
  try {
    const res = await fetch(`/api/gestion/retos/${id}/eliminar`, { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      mostrarAviso("Reto eliminado.", true);
      cargarRetosGestion();
    } else {
      mostrarAviso(data.mensaje || "No se pudo eliminar.", false);
    }
  } catch (err) {
    mostrarAviso("Error de conexión.", false);
  }
}

function marcarError(campo, mensaje) {
  document.getElementById(`campo-${campo}`).classList.add("invalido");
  document.getElementById(`error-${campo}`).textContent = mensaje;
}

function limpiarErroresReto() {
  ["nombre", "descripcion", "puntos", "fecha_limite"].forEach((c) => {
    document.getElementById(`campo-${c}`).classList.remove("invalido");
    document.getElementById(`error-${c}`).textContent = "";
  });
}

formReto.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limpiarErroresReto();

  const payload = {
    nombre: document.getElementById("nombre-reto").value.trim(),
    descripcion: document.getElementById("descripcion-reto").value.trim(),
    puntos: document.getElementById("puntos-reto").value,
    icono: document.getElementById("icono-reto").value.trim() || "🌱",
    fecha_limite: document.getElementById("fecha-limite-reto").value,
  };

  try {
    const res = await fetch("/api/gestion/retos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      mostrarAviso("Reto creado.", true);
      formReto.reset();
      cargarRetosGestion();
    } else if (data.errores) {
      Object.entries(data.errores).forEach(([campo, msj]) => marcarError(campo, msj));
      mostrarAviso("Revisa los campos marcados.", false);
    } else {
      mostrarAviso(data.mensaje || "No se pudo crear el reto.", false);
    }
  } catch (err) {
    mostrarAviso("Error de conexión.", false);
  }
});

// Carga inicial
cargarAcciones();
cargarRetosGestion();
