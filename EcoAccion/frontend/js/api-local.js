/* ==========================================================================
   api-local.js — Backend en el navegador (modo OFFLINE)

   Hace que EcoAccion funcione SIN servidor y SIN internet. Intercepta las
   llamadas fetch("/api/...") y las responde con datos quemados guardados en
   el propio navegador (localStorage). Así la app corre 100% en el celular,
   offline, sin depender de un PC ni de la red.

   IMPORTANTE: este archivo debe cargarse ANTES que el JS de cada pantalla.
   Cumple el requisito del MVP "sin base de datos real (datos quemados)".
   ========================================================================== */
(function () {
  "use strict";

  const CLAVE = "eco_data_v1";

  // ---- Catálogo de categorías (HU04/05/06), igual que en el backend ----
  const CATEGORIAS = {
    reciclaje: { nombre: "Reciclaje", descripcion: "Reciclar materiales", icono: "♻️", puntos: 20, ods: "ODS 12 - Producción y consumo responsables", impacto: { co2: 2, agua: 0, energia: 0, arboles: 0 } },
    ahorro_agua: { nombre: "Ahorro de agua", descripcion: "Usar el agua de manera responsable", icono: "💧", puntos: 15, ods: "ODS 6 - Agua limpia y saneamiento", impacto: { co2: 0, agua: 40, energia: 0, arboles: 0 } },
    ahorro_energia: { nombre: "Ahorro de energía", descripcion: "Reducir el consumo de energía", icono: "💡", puntos: 15, ods: "ODS 7 - Energía asequible y no contaminante", impacto: { co2: 1, agua: 0, energia: 5, arboles: 0 } },
    transporte_sostenible: { nombre: "Transporte sostenible", descripcion: "Usar bicicleta, caminar o transporte público", icono: "🚲", puntos: 25, ods: "ODS 11 - Ciudades y comunidades sostenibles", impacto: { co2: 3, agua: 0, energia: 0, arboles: 0 } },
    reforestacion: { nombre: "Reforestación", descripcion: "Plantar árboles y cuidar áreas verdes", icono: "🌳", puntos: 30, ods: "ODS 15 - Vida de ecosistemas terrestres", impacto: { co2: 5, agua: 0, energia: 0, arboles: 1 } },
  };
  const CAT_ANTERIORES = {
    movilidad: CATEGORIAS.transporte_sostenible,
    consumo_local: { nombre: "Consumo local", descripcion: "Preferir productos locales", icono: "🥕", puntos: 10, ods: "ODS 12 - Producción y consumo responsables", impacto: { co2: 1, agua: 0, energia: 0, arboles: 0 } },
  };
  function getCategoria(clave) { return CATEGORIAS[clave] || CAT_ANTERIORES[clave] || null; }

  // ---- Datos iniciales (datos quemados) ----
  function semilla() {
    return {
      usuarios: [
        { id: 1, nombre: "María G.", correo: "maria@eco.com", password: "1234", puntos: 500, es_amigo: 1 },
        { id: 2, nombre: "Juan P.", correo: "juan@eco.com", password: "1234", puntos: 480, es_amigo: 0 },
        { id: 3, nombre: "Ana L.", correo: "ana@eco.com", password: "1234", puntos: 450, es_amigo: 1 },
        { id: 4, nombre: "Carlos M.", correo: "carlos@eco.com", password: "1234", puntos: 380, es_amigo: 0 },
        { id: 5, nombre: "Tú", correo: "demo@eco.com", password: "1234", puntos: 350, es_amigo: 0 },
      ],
      acciones: [],
      retos: [
        { id: 1, nombre: "Semana sin plástico", descripcion: "Evita los plásticos de un solo uso durante 7 días.", puntos: 50, icono: "♻️" },
        { id: 2, nombre: "Movilidad verde", descripcion: "Usa transporte sostenible 5 veces esta semana.", puntos: 40, icono: "🚲" },
        { id: 3, nombre: "Guardián del agua", descripcion: "Registra 3 acciones de ahorro de agua.", puntos: 30, icono: "💧" },
        { id: 4, nombre: "Sembrador", descripcion: "Planta o cuida un árbol este mes.", puntos: 60, icono: "🌳" },
      ],
      participaciones: {}, // "usuarioId_retoId" -> {progreso, completado}
      seq: { usuario: 5, accion: 0, reto: 4 },
      actualId: 5, // usuario autenticado de demostración ("Tú")
    };
  }

  function cargar() {
    try {
      const raw = localStorage.getItem(CLAVE);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const d = semilla();
    guardar(d);
    return d;
  }
  function guardar(d) { try { localStorage.setItem(CLAVE, JSON.stringify(d)); } catch (e) {} }
  function nuevoId(d, tipo) { d.seq[tipo] += 1; return d.seq[tipo]; }
  function usuarioActual(d) { return d.usuarios.find((u) => u.id === d.actualId) || null; }
  function pub(u) { return { id: u.id, nombre: u.nombre, correo: u.correo, puntos: u.puntos }; }

  // Respuesta estándar
  function R(status, data) { return { status: status, data: data }; }
  function ok(extra) { return R(extra && extra._status ? extra._status : 200, Object.assign({ ok: true }, extra)); }
  function err(status, payload) { return R(status, Object.assign({ ok: false }, payload)); }

  // ---------------------------------------------------------------------
  //  Operaciones (equivalentes a db.py)
  // ---------------------------------------------------------------------
  function crearUsuario(d, body) {
    const nombre = (body.nombre || "").trim();
    const correo = (body.correo || "").trim().toLowerCase();
    const password = body.password || "";
    const errores = {};
    if (!nombre) errores.nombre = "El nombre es obligatorio.";
    if (!correo) errores.correo = "El correo es obligatorio.";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) errores.correo = "Escribe un correo válido.";
    else if (d.usuarios.some((u) => u.correo === correo)) errores.correo = "Ya existe una cuenta con ese correo.";
    if (password.length < 4) errores.password = "La contraseña debe tener al menos 4 caracteres.";
    if (Object.keys(errores).length) return err(422, { errores: errores });

    const u = { id: nuevoId(d, "usuario"), nombre: nombre, correo: correo, password: password, puntos: 0, es_amigo: 0 };
    d.usuarios.push(u);
    d.actualId = u.id;
    guardar(d);
    return R(201, Object.assign({ ok: true }, pub(u)));
  }

  function autenticar(d, body) {
    const correo = (body.correo || "").trim().toLowerCase();
    const password = body.password || "";
    const errores = {};
    if (!correo) errores.correo = "El correo es obligatorio.";
    if (!password) errores.password = "La contraseña es obligatoria.";
    if (Object.keys(errores).length) return err(422, { errores: errores });
    const u = d.usuarios.find((x) => x.correo === correo);
    if (!u || u.password !== password) return err(401, { mensaje: "Correo o contraseña incorrectos." });
    d.actualId = u.id;
    guardar(d);
    return ok(pub(u));
  }

  function registrarAccion(d, body) {
    const categoria = (body.categoria || "").trim();
    const fecha = (body.fecha || "").trim();
    const descripcion = (body.descripcion || "").trim();
    const errores = {};
    if (!categoria) errores.categoria = "Selecciona un tipo de acción.";
    else if (!CATEGORIAS[categoria]) errores.categoria = "El tipo de acción no es válido.";
    if (!fecha) errores.fecha = "La fecha es obligatoria.";
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || isNaN(new Date(fecha).getTime())) errores.fecha = "La fecha no tiene un formato válido.";
    if (!descripcion) errores.descripcion = "La descripción es obligatoria.";
    else if (descripcion.length > 200) errores.descripcion = "La descripción no puede superar los 200 caracteres.";
    if (Object.keys(errores).length) return err(422, { errores: errores });

    const u = usuarioActual(d);
    if (!u) return err(401, { mensaje: "No hay un usuario autenticado." });
    const info = CATEGORIAS[categoria];
    const accion = { id: nuevoId(d, "accion"), usuario_id: u.id, categoria: categoria, fecha: fecha, descripcion: descripcion, puntos: info.puntos, ods: info.ods, creada_en: new Date().toISOString() };
    d.acciones.push(accion);
    u.puntos += info.puntos;
    guardar(d);
    return R(201, {
      ok: true,
      mensaje: "¡Acción registrada! Ganaste " + info.puntos + " puntos.",
      puntos_obtenidos: info.puntos,
      puntaje_acumulado: u.puntos,
      accion: { id: accion.id, categoria: categoria, fecha: fecha, descripcion: descripcion, puntos: info.puntos, ods: info.ods, usuario: u.nombre },
    });
  }

  function listarAcciones(d) {
    const u = usuarioActual(d);
    if (!u) return err(401, { mensaje: "No hay un usuario autenticado." });
    const propias = d.acciones
      .filter((a) => a.usuario_id === u.id)
      .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : b.id - a.id));
    const acciones = propias.map((a) => {
      const cat = getCategoria(a.categoria) || {};
      return { id: a.id, categoria: a.categoria, categoria_nombre: cat.nombre || a.categoria, categoria_icono: cat.icono || "🌱", fecha: a.fecha, descripcion: a.descripcion, puntos: a.puntos, ods: a.ods };
    });
    return ok({ usuario: u.nombre, acciones: acciones });
  }

  function obtenerRanking(d, tipo) {
    tipo = (tipo || "global").toLowerCase();
    const u = usuarioActual(d);
    const aid = u ? u.id : null;
    let cand = tipo === "amigos" ? d.usuarios.filter((x) => x.es_amigo === 1 || x.id === aid) : d.usuarios.slice();
    cand.sort((a, b) => b.puntos - a.puntos || a.nombre.localeCompare(b.nombre));
    const ranking = cand.map((x, i) => ({ posicion: i + 1, id: x.id, nombre: x.nombre, puntos: x.puntos, es_actual: x.id === aid }));
    return ok({ tipo: tipo, ranking: ranking });
  }

  function obtenerEstadisticas(d, periodo) {
    periodo = (periodo || "mes").toLowerCase();
    if (periodo !== "mes" && periodo !== "todo") periodo = "mes";
    const u = usuarioActual(d);
    if (!u) return err(401, { mensaje: "No hay un usuario autenticado." });
    const hoy = new Date();
    const desde = hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0") + "-01";
    let propias = d.acciones.filter((a) => a.usuario_id === u.id);
    if (periodo === "mes") propias = propias.filter((a) => a.fecha >= desde);
    let co2 = 0, agua = 0, energia = 0, arboles = 0, puntos = 0;
    propias.forEach((a) => {
      const im = (getCategoria(a.categoria) || {}).impacto || {};
      co2 += im.co2 || 0; agua += im.agua || 0; energia += im.energia || 0; arboles += im.arboles || 0;
      puntos += a.puntos;
    });
    return ok({ periodo: periodo, usuario: u.nombre, total_acciones: propias.length, total_puntos: puntos, impacto: { co2_evitado: co2, agua_ahorrada: agua, energia_ahorrada: energia, arboles_plantados: arboles } });
  }

  function listarRetos(d) {
    const u = usuarioActual(d);
    const uid = u ? u.id : null;
    const retos = d.retos.map((r) => {
      const p = d.participaciones[uid + "_" + r.id];
      return { id: r.id, nombre: r.nombre, descripcion: r.descripcion, puntos: r.puntos, icono: r.icono, participando: !!p, completado: !!(p && p.completado) };
    });
    return ok({ retos: retos });
  }

  function unirseReto(d, retoId) {
    const u = usuarioActual(d);
    if (!u) return err(401, { mensaje: "No hay un usuario autenticado." });
    if (!d.retos.some((r) => r.id === retoId)) return err(404, { mensaje: "El reto no existe." });
    const k = u.id + "_" + retoId;
    if (!d.participaciones[k]) d.participaciones[k] = { progreso: 0, completado: false };
    guardar(d);
    return ok({ mensaje: "Te uniste al reto.", reto_id: retoId });
  }

  function completarReto(d, retoId) {
    const u = usuarioActual(d);
    if (!u) return err(401, { mensaje: "No hay un usuario autenticado." });
    const reto = d.retos.find((r) => r.id === retoId);
    if (!reto) return err(404, { mensaje: "El reto no existe." });
    const k = u.id + "_" + retoId;
    const p = d.participaciones[k];
    if (!p) return err(409, { mensaje: "Primero debes unirte al reto." });
    if (p.completado) return err(409, { mensaje: "Ya habías completado este reto." });
    p.completado = true;
    u.puntos += reto.puntos;
    guardar(d);
    return ok({ mensaje: "¡Reto completado! Ganaste " + reto.puntos + " puntos.", puntos_obtenidos: reto.puntos, puntaje_acumulado: u.puntos });
  }

  function gestionListarAcciones(d) {
    const acciones = d.acciones.slice().sort((a, b) => b.id - a.id).map((a) => {
      const u = d.usuarios.find((x) => x.id === a.usuario_id);
      const cat = getCategoria(a.categoria) || {};
      return { id: a.id, usuario: u ? u.nombre : "—", categoria_nombre: cat.nombre || a.categoria, categoria_icono: cat.icono || "🌱", fecha: a.fecha, descripcion: a.descripcion, puntos: a.puntos };
    });
    return ok({ acciones: acciones });
  }

  function gestionEliminarAccion(d, id) {
    const i = d.acciones.findIndex((a) => a.id === id);
    if (i < 0) return err(404, { mensaje: "La acción no existe." });
    const a = d.acciones[i];
    const u = d.usuarios.find((x) => x.id === a.usuario_id);
    if (u) u.puntos = Math.max(0, u.puntos - a.puntos);
    d.acciones.splice(i, 1);
    guardar(d);
    return ok({ mensaje: "Acción eliminada." });
  }

  function gestionListarRetos(d) {
    const retos = d.retos.map((r) => {
      const inscritos = Object.keys(d.participaciones).filter((k) => k.endsWith("_" + r.id)).length;
      return { id: r.id, nombre: r.nombre, descripcion: r.descripcion, puntos: r.puntos, icono: r.icono, inscritos: inscritos };
    });
    return ok({ retos: retos });
  }

  function gestionCrearReto(d, body) {
    const nombre = (body.nombre || "").trim();
    const descripcion = (body.descripcion || "").trim();
    const icono = (body.icono || "🌱").trim() || "🌱";
    const puntos = parseInt(body.puntos, 10);
    const errores = {};
    if (!nombre) errores.nombre = "El nombre del reto es obligatorio.";
    if (!descripcion) errores.descripcion = "La descripción es obligatoria.";
    if (!(puntos > 0)) errores.puntos = "Los puntos deben ser un número mayor que 0.";
    if (Object.keys(errores).length) return err(422, { errores: errores });
    const reto = { id: nuevoId(d, "reto"), nombre: nombre, descripcion: descripcion, puntos: puntos, icono: icono };
    d.retos.push(reto);
    guardar(d);
    return R(201, { ok: true, mensaje: "Reto creado.", reto: reto });
  }

  function gestionEliminarReto(d, id) {
    const i = d.retos.findIndex((r) => r.id === id);
    if (i < 0) return err(404, { mensaje: "El reto no existe." });
    d.retos.splice(i, 1);
    Object.keys(d.participaciones).filter((k) => k.endsWith("_" + id)).forEach((k) => delete d.participaciones[k]);
    guardar(d);
    return ok({ mensaje: "Reto eliminado." });
  }

  // ---------------------------------------------------------------------
  //  Enrutador
  // ---------------------------------------------------------------------
  function enrutar(method, path, query, body) {
    const d = cargar();
    let m;
    if (method === "GET") {
      if (path === "/api/categorias") {
        const cats = Object.keys(CATEGORIAS).map((k) => ({ valor: k, nombre: CATEGORIAS[k].nombre, descripcion: CATEGORIAS[k].descripcion, icono: CATEGORIAS[k].icono, puntos: CATEGORIAS[k].puntos, ods: CATEGORIAS[k].ods }));
        return ok({ categorias: cats });
      }
      if (path === "/api/acciones") return listarAcciones(d);
      if (path === "/api/ranking") return obtenerRanking(d, query.get("tipo") || "global");
      if (path === "/api/estadisticas") return obtenerEstadisticas(d, query.get("periodo") || "mes");
      if (path === "/api/retos") return listarRetos(d);
      if (path === "/api/gestion/acciones") return gestionListarAcciones(d);
      if (path === "/api/gestion/retos") return gestionListarRetos(d);
    } else if (method === "POST") {
      if (path === "/api/registro") return crearUsuario(d, body);
      if (path === "/api/login") return autenticar(d, body);
      if (path === "/api/acciones") return registrarAccion(d, body);
      if (path === "/api/gestion/retos") return gestionCrearReto(d, body);
      if ((m = path.match(/^\/api\/retos\/(\d+)\/unirse$/))) return unirseReto(d, parseInt(m[1], 10));
      if ((m = path.match(/^\/api\/retos\/(\d+)\/completar$/))) return completarReto(d, parseInt(m[1], 10));
      if ((m = path.match(/^\/api\/gestion\/acciones\/(\d+)\/eliminar$/))) return gestionEliminarAccion(d, parseInt(m[1], 10));
      if ((m = path.match(/^\/api\/gestion\/retos\/(\d+)\/eliminar$/))) return gestionEliminarReto(d, parseInt(m[1], 10));
    }
    return err(404, { mensaje: "Ruta no encontrada." });
  }

  // ---------------------------------------------------------------------
  //  Interceptar fetch("/api/...")
  // ---------------------------------------------------------------------
  const fetchOriginal = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    let url;
    try { url = typeof input === "string" ? input : input.url; } catch (e) { url = String(input); }
    let u;
    try { u = new URL(url, window.location.origin); } catch (e) { u = null; }
    if (u && u.pathname.indexOf("/api/") === 0) {
      const method = ((init && init.method) || (typeof input === "object" && input.method) || "GET").toUpperCase();
      let body = {};
      const rawBody = init && init.body;
      if (rawBody) { try { body = JSON.parse(rawBody); } catch (e) { body = {}; } }
      let res;
      try { res = enrutar(method, u.pathname, u.searchParams, body); }
      catch (e) { res = R(500, { ok: false, mensaje: "Error interno.", detalle: String(e) }); }
      return Promise.resolve(new Response(JSON.stringify(res.data), { status: res.status, headers: { "Content-Type": "application/json" } }));
    }
    if (fetchOriginal) return fetchOriginal(input, init);
    return Promise.reject(new Error("fetch no disponible"));
  };

  // Utilidad para reiniciar la demo desde la consola: ecoReset()
  window.ecoReset = function () { try { localStorage.removeItem(CLAVE); } catch (e) {} location.reload(); };
})();
