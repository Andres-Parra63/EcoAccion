const listaHistorial = document.getElementById("lista-historial");
const historialVacio = document.getElementById("historial-vacio");
const avisoHistorial = document.getElementById("aviso-historial");
const resumenHistorial = document.getElementById("resumen-historial");

function formatearFecha(fechaIso) {
  const [ano, mes, dia] = fechaIso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(ano, mes - 1, dia));
}

function crearFila(accion) {
  const fila = document.createElement("li");
  fila.className = "accion-historial";

  const icono = document.createElement("span");
  icono.className = "icono-historial";
  icono.setAttribute("aria-hidden", "true");
  icono.textContent = accion.categoria_icono;

  const detalle = document.createElement("div");
  detalle.className = "detalle-historial";

  const cabecera = document.createElement("div");
  cabecera.className = "cabecera-accion";

  const categoria = document.createElement("h2");
  categoria.textContent = accion.categoria_nombre;

  const puntos = document.createElement("strong");
  puntos.className = "puntos-historial";
  puntos.textContent = `+${accion.puntos} pts`;

  const fecha = document.createElement("time");
  fecha.dateTime = accion.fecha;
  fecha.textContent = formatearFecha(accion.fecha);

  const descripcion = document.createElement("p");
  descripcion.textContent = accion.descripcion;

  const ods = document.createElement("span");
  ods.className = "ods-historial";
  ods.textContent = accion.ods;

  cabecera.append(categoria, puntos);
  detalle.append(cabecera, fecha, descripcion, ods);
  fila.append(icono, detalle);
  return fila;
}

async function cargarHistorial() {
  try {
    const respuesta = await fetch("/api/acciones");
    const data = await respuesta.json();
    if (!respuesta.ok || !data.ok) {
      throw new Error(data.mensaje || "No se pudo consultar el historial.");
    }

    listaHistorial.replaceChildren();
    if (data.acciones.length === 0) {
      listaHistorial.hidden = true;
      historialVacio.hidden = false;
      return;
    }

    data.acciones.forEach((accion) => listaHistorial.appendChild(crearFila(accion)));
    resumenHistorial.textContent = `${data.acciones.length} ${
      data.acciones.length === 1 ? "acción registrada" : "acciones registradas"
    }`;
    resumenHistorial.hidden = false;
  } catch (error) {
    listaHistorial.replaceChildren();
    avisoHistorial.textContent = error.message;
    avisoHistorial.className = "aviso aviso-historial fallo";
  }
}

cargarHistorial();
