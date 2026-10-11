"""
db.py — Capa de datos de EcoAccion (DATOS QUEMADOS, en memoria).

Para el Parcial II el prototipo es un MVP SIN base de datos real: todos los
datos viven en memoria (listas y diccionarios de Python) y se reinician cada
vez que se levanta el servidor. Esto cumple el requisito "sin base de datos
real (datos quemados permitidos)".

Aquí está TODA la lógica de negocio. Los servidores (app.py con Flask y
server.py con la librería estándar) solo enrutan y serializan: llaman a estas
funciones y devuelven lo que retornan. Así la lógica vive en un solo lugar.

Historias cubiertas:
  HU01 Registro de usuario        -> crear_usuario
  HU02 Inicio de sesión           -> autenticar
  HU03 Registrar acción           -> registrar_accion
  HU04 Clasificar acción          -> CATEGORIAS / listar_categorias
  HU05 Recibir puntos             -> registrar_accion suma puntos
  HU06 Visualizar impacto         -> obtener_estadisticas
  HU07 Consultar historial        -> listar_acciones
  HU08 Consultar ranking          -> obtener_ranking
  HU09 Retos sostenibles          -> listar_retos / unirse_reto / completar_reto
  HU10 Gestionar acciones y retos -> gestion_*
Cambio del ciclo: confirmación al registrar (HU03 + HU05) -> registrar_accion
  devuelve mensaje de confirmación, puntos obtenidos y puntaje acumulado.
"""
from datetime import datetime


class ErrorValidacion(Exception):
    """Error de negocio que el router convierte en una respuesta JSON."""

    def __init__(self, errores=None, mensaje=None, codigo=422):
        super().__init__(mensaje or "Datos inválidos")
        self.errores = errores or {}
        self.mensaje = mensaje
        self.codigo = codigo


# ---------------------------------------------------------------------------
#  Catálogo de categorías (HU04) con puntos (HU05) e impacto (HU06)
# ---------------------------------------------------------------------------
CATEGORIAS = {
    "reciclaje": {
        "nombre": "Reciclaje", "descripcion": "Reciclar materiales", "icono": "♻️",
        "puntos": 20, "ods": "ODS 12 - Producción y consumo responsables",
        "impacto": {"co2": 2, "agua": 0, "energia": 0, "arboles": 0},
    },
    "ahorro_agua": {
        "nombre": "Ahorro de agua", "descripcion": "Usar el agua de manera responsable", "icono": "💧",
        "puntos": 15, "ods": "ODS 6 - Agua limpia y saneamiento",
        "impacto": {"co2": 0, "agua": 40, "energia": 0, "arboles": 0},
    },
    "ahorro_energia": {
        "nombre": "Ahorro de energía", "descripcion": "Reducir el consumo de energía", "icono": "💡",
        "puntos": 15, "ods": "ODS 7 - Energía asequible y no contaminante",
        "impacto": {"co2": 1, "agua": 0, "energia": 5, "arboles": 0},
    },
    "transporte_sostenible": {
        "nombre": "Transporte sostenible", "descripcion": "Usar bicicleta, caminar o transporte público", "icono": "🚲",
        "puntos": 25, "ods": "ODS 11 - Ciudades y comunidades sostenibles",
        "impacto": {"co2": 3, "agua": 0, "energia": 0, "arboles": 0},
    },
    "reforestacion": {
        "nombre": "Reforestación", "descripcion": "Plantar árboles y cuidar áreas verdes", "icono": "🌳",
        "puntos": 30, "ods": "ODS 15 - Vida de ecosistemas terrestres",
        "impacto": {"co2": 5, "agua": 0, "energia": 0, "arboles": 1},
    },
}

# Categorías heredadas de versiones anteriores (compatibilidad de datos).
CATEGORIAS_ANTERIORES = {
    "movilidad": {
        "nombre": "Transporte sostenible", "descripcion": "Usar bicicleta, caminar o transporte público",
        "icono": "🚲", "puntos": 25, "ods": "ODS 11 - Ciudades y comunidades sostenibles",
        "impacto": {"co2": 3, "agua": 0, "energia": 0, "arboles": 0},
    },
    "consumo_local": {
        "nombre": "Consumo local", "descripcion": "Preferir productos locales", "icono": "🥕",
        "puntos": 10, "ods": "ODS 12 - Producción y consumo responsables",
        "impacto": {"co2": 1, "agua": 0, "energia": 0, "arboles": 0},
    },
}


def get_categoria(clave):
    return CATEGORIAS.get(clave) or CATEGORIAS_ANTERIORES.get(clave)


def listar_categorias():
    """HU04: categorías disponibles para clasificar una acción."""
    return [
        {
            "valor": clave, "nombre": info["nombre"], "descripcion": info["descripcion"],
            "icono": info["icono"], "puntos": info["puntos"], "ods": info["ods"],
        }
        for clave, info in CATEGORIAS.items()
    ]


# ---------------------------------------------------------------------------
#  Datos quemados (se reinician al reiniciar el servidor)
# ---------------------------------------------------------------------------
USUARIOS = []
ACCIONES = []
RETOS = []
PARTICIPACIONES = {}   # (usuario_id, reto_id) -> {"progreso": int, "completado": bool}

_seq = {"usuario": 0, "accion": 0, "reto": 0}
_usuario_actual_id = None


def _nuevo_id(tipo):
    _seq[tipo] += 1
    return _seq[tipo]


def init_db():
    """Carga los datos iniciales en memoria. Seguro de llamar varias veces."""
    global _usuario_actual_id
    if USUARIOS:
        return  # ya inicializado

    usuarios_demo = [
        # (nombre,     correo,            password, puntos, es_amigo)
        ("María G.",   "maria@eco.com",   "1234", 500, 1),
        ("Juan P.",    "juan@eco.com",    "1234", 480, 0),
        ("Ana L.",     "ana@eco.com",     "1234", 450, 1),
        ("Carlos M.",  "carlos@eco.com",  "1234", 380, 0),
        ("Tú",         "demo@eco.com",    "1234", 350, 0),
    ]
    for nombre, correo, password, puntos, es_amigo in usuarios_demo:
        USUARIOS.append({
            "id": _nuevo_id("usuario"), "nombre": nombre, "correo": correo,
            "password": password, "puntos": puntos, "es_amigo": es_amigo,
        })
    # Usuario autenticado por defecto para la demo: "Tú"
    _usuario_actual_id = USUARIOS[-1]["id"]

    retos_demo = [
        ("Semana sin plástico", "Evita los plásticos de un solo uso durante 7 días.", 50, "♻️"),
        ("Movilidad verde",     "Usa transporte sostenible 5 veces esta semana.",     40, "🚲"),
        ("Guardián del agua",   "Registra 3 acciones de ahorro de agua.",             30, "💧"),
        ("Sembrador",           "Planta o cuida un árbol este mes.",                  60, "🌳"),
    ]
    for nombre, descripcion, puntos, icono in retos_demo:
        RETOS.append({
            "id": _nuevo_id("reto"), "nombre": nombre, "descripcion": descripcion,
            "puntos": puntos, "icono": icono,
        })


# ---------------------------------------------------------------------------
#  Usuarios / sesión
# ---------------------------------------------------------------------------
def _buscar_usuario(usuario_id):
    return next((u for u in USUARIOS if u["id"] == usuario_id), None)


def get_usuario_actual():
    """Devuelve el usuario autenticado actual (dict) o None."""
    return _buscar_usuario(_usuario_actual_id)


def set_usuario_actual(usuario_id):
    global _usuario_actual_id
    _usuario_actual_id = usuario_id


def _usuario_publico(usuario):
    """Versión segura del usuario (sin contraseña) para enviar al frontend."""
    return {
        "id": usuario["id"], "nombre": usuario["nombre"],
        "correo": usuario["correo"], "puntos": usuario["puntos"],
    }


def crear_usuario(datos):
    """
    HU01 - Registro de usuario. Valida y crea el usuario en memoria,
    lo deja como usuario autenticado actual y lo devuelve.
    """
    nombre = (datos.get("nombre") or "").strip()
    correo = (datos.get("correo") or "").strip().lower()
    password = (datos.get("password") or "")

    errores = {}
    if not nombre:
        errores["nombre"] = "El nombre es obligatorio."
    if not correo:
        errores["correo"] = "El correo es obligatorio."
    elif "@" not in correo or "." not in correo.split("@")[-1]:
        errores["correo"] = "Escribe un correo válido."
    elif any(u["correo"] == correo for u in USUARIOS):
        errores["correo"] = "Ya existe una cuenta con ese correo."
    if len(password) < 4:
        errores["password"] = "La contraseña debe tener al menos 4 caracteres."

    if errores:
        raise ErrorValidacion(errores=errores)

    usuario = {
        "id": _nuevo_id("usuario"), "nombre": nombre, "correo": correo,
        "password": password, "puntos": 0, "es_amigo": 0,
    }
    USUARIOS.append(usuario)
    set_usuario_actual(usuario["id"])
    return _usuario_publico(usuario)


def autenticar(datos):
    """HU02 - Inicio de sesión. Valida credenciales contra los datos quemados."""
    correo = (datos.get("correo") or "").strip().lower()
    password = (datos.get("password") or "")

    errores = {}
    if not correo:
        errores["correo"] = "El correo es obligatorio."
    if not password:
        errores["password"] = "La contraseña es obligatoria."
    if errores:
        raise ErrorValidacion(errores=errores)

    usuario = next((u for u in USUARIOS if u["correo"] == correo), None)
    if usuario is None or usuario["password"] != password:
        raise ErrorValidacion(
            mensaje="Correo o contraseña incorrectos.", codigo=401
        )

    set_usuario_actual(usuario["id"])
    return _usuario_publico(usuario)


# ---------------------------------------------------------------------------
#  HU03 / HU05 - Registrar acción y recibir puntos (con confirmación)
# ---------------------------------------------------------------------------
def registrar_accion(datos):
    """
    HU03 + HU05 + cambio del ciclo (confirmación).

    Valida los campos, guarda la acción, suma los puntos al usuario y
    devuelve una CONFIRMACIÓN con los puntos obtenidos y el puntaje acumulado.
    """
    categoria = (datos.get("categoria") or "").strip()
    fecha = (datos.get("fecha") or "").strip()
    descripcion = (datos.get("descripcion") or "").strip()

    errores = {}
    if not categoria:
        errores["categoria"] = "Selecciona un tipo de acción."
    elif categoria not in CATEGORIAS:
        errores["categoria"] = "El tipo de acción no es válido."

    if not fecha:
        errores["fecha"] = "La fecha es obligatoria."
    else:
        try:
            datetime.strptime(fecha, "%Y-%m-%d")
        except ValueError:
            errores["fecha"] = "La fecha no tiene un formato válido."

    if not descripcion:
        errores["descripcion"] = "La descripción es obligatoria."
    elif len(descripcion) > 200:
        errores["descripcion"] = "La descripción no puede superar los 200 caracteres."

    if errores:
        raise ErrorValidacion(errores=errores)

    usuario = get_usuario_actual()
    if usuario is None:
        raise ErrorValidacion(mensaje="No hay un usuario autenticado.", codigo=401)

    # HU05: una misma acción (categoría, fecha y descripción) no otorga puntos dos veces.
    repetida = any(
        a["usuario_id"] == usuario["id"] and a["categoria"] == categoria
        and a["fecha"] == fecha and a["descripcion"].lower() == descripcion.lower()
        for a in ACCIONES
    )
    if repetida:
        raise ErrorValidacion(
            mensaje="Esta acción ya fue registrada con la misma fecha y descripción. No se otorgan puntos duplicados.",
            codigo=409,
        )

    puntos = CATEGORIAS[categoria]["puntos"]
    ods = CATEGORIAS[categoria]["ods"]

    accion = {
        "id": _nuevo_id("accion"), "usuario_id": usuario["id"],
        "categoria": categoria, "fecha": fecha, "descripcion": descripcion,
        "puntos": puntos, "ods": ods,
        "creada_en": datetime.now().isoformat(timespec="seconds"),
    }
    ACCIONES.append(accion)
    usuario["puntos"] += puntos  # HU05: suma puntos al perfil

    # Cambio del ciclo: confirmación clara con puntos obtenidos y acumulado.
    return {
        "mensaje": f"¡Acción registrada! Ganaste {puntos} puntos.",
        "puntos_obtenidos": puntos,
        "puntaje_acumulado": usuario["puntos"],
        "accion": {
            "id": accion["id"], "categoria": categoria, "fecha": fecha,
            "descripcion": descripcion, "puntos": puntos, "ods": ods,
            "usuario": usuario["nombre"],
        },
    }


# ---------------------------------------------------------------------------
#  HU07 - Historial
# ---------------------------------------------------------------------------
def listar_acciones(usuario_id=None):
    usuario = _buscar_usuario(usuario_id) if usuario_id else get_usuario_actual()
    if usuario is None:
        raise ErrorValidacion(mensaje="No hay un usuario autenticado.", codigo=401)

    propias = [a for a in ACCIONES if a["usuario_id"] == usuario["id"]]
    # Más recientes primero (por fecha, luego por orden de creación)
    propias = sorted(propias, key=lambda a: (a["fecha"], a["creada_en"], a["id"]), reverse=True)

    acciones = []
    for a in propias:
        cat = get_categoria(a["categoria"]) or {}
        acciones.append({
            "id": a["id"], "categoria": a["categoria"],
            "categoria_nombre": cat.get("nombre", a["categoria"]),
            "categoria_icono": cat.get("icono", "🌱"),
            "fecha": a["fecha"], "descripcion": a["descripcion"],
            "puntos": a["puntos"], "ods": a["ods"],
        })
    return {"usuario": usuario["nombre"], "acciones": acciones}


# ---------------------------------------------------------------------------
#  HU08 - Ranking
# ---------------------------------------------------------------------------
def obtener_ranking(tipo="global"):
    tipo = (tipo or "global").lower()
    actual = get_usuario_actual()
    actual_id = actual["id"] if actual else None

    if tipo == "amigos":
        candidatos = [u for u in USUARIOS if u["es_amigo"] == 1 or u["id"] == actual_id]
    else:
        candidatos = list(USUARIOS)

    ordenados = sorted(candidatos, key=lambda u: (-u["puntos"], u["nombre"]))
    ranking = []
    for i, u in enumerate(ordenados, start=1):
        ranking.append({
            "posicion": i, "id": u["id"], "nombre": u["nombre"],
            "puntos": u["puntos"], "es_actual": u["id"] == actual_id,
        })
    return {"tipo": tipo, "ranking": ranking}


# ---------------------------------------------------------------------------
#  HU06 - Estadísticas / impacto
# ---------------------------------------------------------------------------
def obtener_estadisticas(periodo="mes", usuario_id=None):
    periodo = (periodo or "mes").lower()
    if periodo not in ("mes", "todo"):
        periodo = "mes"

    usuario = _buscar_usuario(usuario_id) if usuario_id else get_usuario_actual()
    if usuario is None:
        raise ErrorValidacion(mensaje="No hay un usuario autenticado.", codigo=401)

    desde = datetime.now().strftime("%Y-%m-01")
    propias = [a for a in ACCIONES if a["usuario_id"] == usuario["id"]]
    if periodo == "mes":
        propias = [a for a in propias if a["fecha"] >= desde]

    total_acciones = len(propias)
    total_puntos = sum(a["puntos"] for a in propias)
    co2 = agua = energia = arboles = 0
    for a in propias:
        impacto = (get_categoria(a["categoria"]) or {}).get("impacto", {})
        co2 += impacto.get("co2", 0)
        agua += impacto.get("agua", 0)
        energia += impacto.get("energia", 0)
        arboles += impacto.get("arboles", 0)

    return {
        "periodo": periodo, "usuario": usuario["nombre"],
        "total_acciones": total_acciones, "total_puntos": total_puntos,
        "impacto": {
            "co2_evitado": co2, "agua_ahorrada": agua,
            "energia_ahorrada": energia, "arboles_plantados": arboles,
        },
    }


# ---------------------------------------------------------------------------
#  HU09 - Retos sostenibles
# ---------------------------------------------------------------------------
def listar_retos(usuario_id=None):
    usuario = _buscar_usuario(usuario_id) if usuario_id else get_usuario_actual()
    uid = usuario["id"] if usuario else None

    retos = []
    for r in RETOS:
        part = PARTICIPACIONES.get((uid, r["id"]))
        retos.append({
            "id": r["id"], "nombre": r["nombre"], "descripcion": r["descripcion"],
            "puntos": r["puntos"], "icono": r["icono"],
            "participando": part is not None,
            "completado": bool(part and part["completado"]),
        })
    return {"retos": retos}


def _reto(reto_id):
    return next((r for r in RETOS if r["id"] == reto_id), None)


def unirse_reto(reto_id, usuario_id=None):
    usuario = _buscar_usuario(usuario_id) if usuario_id else get_usuario_actual()
    if usuario is None:
        raise ErrorValidacion(mensaje="No hay un usuario autenticado.", codigo=401)
    if _reto(reto_id) is None:
        raise ErrorValidacion(mensaje="El reto no existe.", codigo=404)

    clave = (usuario["id"], reto_id)
    if clave not in PARTICIPACIONES:
        PARTICIPACIONES[clave] = {"progreso": 0, "completado": False}
    return {"mensaje": "Te uniste al reto.", "reto_id": reto_id}


def completar_reto(reto_id, usuario_id=None):
    usuario = _buscar_usuario(usuario_id) if usuario_id else get_usuario_actual()
    if usuario is None:
        raise ErrorValidacion(mensaje="No hay un usuario autenticado.", codigo=401)
    reto = _reto(reto_id)
    if reto is None:
        raise ErrorValidacion(mensaje="El reto no existe.", codigo=404)

    clave = (usuario["id"], reto_id)
    part = PARTICIPACIONES.get(clave)
    if part is None:
        raise ErrorValidacion(mensaje="Primero debes unirte al reto.", codigo=409)
    if part["completado"]:
        raise ErrorValidacion(mensaje="Ya habías completado este reto.", codigo=409)

    part["completado"] = True
    usuario["puntos"] += reto["puntos"]  # recompensa del reto
    return {
        "mensaje": f"¡Reto completado! Ganaste {reto['puntos']} puntos.",
        "puntos_obtenidos": reto["puntos"],
        "puntaje_acumulado": usuario["puntos"],
    }


# ---------------------------------------------------------------------------
#  HU10 - Gestionar acciones y retos (panel de administración simple)
# ---------------------------------------------------------------------------
def gestion_listar_acciones():
    acciones = []
    for a in sorted(ACCIONES, key=lambda x: x["id"], reverse=True):
        usuario = _buscar_usuario(a["usuario_id"])
        cat = get_categoria(a["categoria"]) or {}
        acciones.append({
            "id": a["id"], "usuario": usuario["nombre"] if usuario else "—",
            "categoria_nombre": cat.get("nombre", a["categoria"]),
            "categoria_icono": cat.get("icono", "🌱"),
            "fecha": a["fecha"], "descripcion": a["descripcion"], "puntos": a["puntos"],
        })
    return {"acciones": acciones}


def gestion_eliminar_accion(accion_id):
    accion = next((a for a in ACCIONES if a["id"] == accion_id), None)
    if accion is None:
        raise ErrorValidacion(mensaje="La acción no existe.", codigo=404)
    # Al eliminar, descuenta los puntos que había otorgado
    usuario = _buscar_usuario(accion["usuario_id"])
    if usuario:
        usuario["puntos"] = max(0, usuario["puntos"] - accion["puntos"])
    ACCIONES.remove(accion)
    return {"mensaje": "Acción eliminada."}


def gestion_listar_retos():
    retos = []
    for r in RETOS:
        inscritos = sum(1 for (_, rid) in PARTICIPACIONES if rid == r["id"])
        retos.append({
            "id": r["id"], "nombre": r["nombre"], "descripcion": r["descripcion"],
            "puntos": r["puntos"], "icono": r["icono"], "inscritos": inscritos,
        })
    return {"retos": retos}


def gestion_crear_reto(datos):
    nombre = (datos.get("nombre") or "").strip()
    descripcion = (datos.get("descripcion") or "").strip()
    icono = (datos.get("icono") or "🌱").strip() or "🌱"
    try:
        puntos = int(datos.get("puntos"))
    except (TypeError, ValueError):
        puntos = 0

    errores = {}
    if not nombre:
        errores["nombre"] = "El nombre del reto es obligatorio."
    if not descripcion:
        errores["descripcion"] = "La descripción es obligatoria."
    if puntos <= 0:
        errores["puntos"] = "Los puntos deben ser un número mayor que 0."
    if errores:
        raise ErrorValidacion(errores=errores)

    reto = {
        "id": _nuevo_id("reto"), "nombre": nombre, "descripcion": descripcion,
        "puntos": puntos, "icono": icono,
    }
    RETOS.append(reto)
    return {"mensaje": "Reto creado.", "reto": reto}


def gestion_eliminar_reto(reto_id):
    reto = _reto(reto_id)
    if reto is None:
        raise ErrorValidacion(mensaje="El reto no existe.", codigo=404)
    RETOS.remove(reto)
    # Limpia participaciones de ese reto
    for clave in [k for k in PARTICIPACIONES if k[1] == reto_id]:
        del PARTICIPACIONES[clave]
    return {"mensaje": "Reto eliminado."}


if __name__ == "__main__":
    init_db()
    print(f"Datos en memoria listos: {len(USUARIOS)} usuarios, {len(RETOS)} retos.")
