"""
app.py — Backend de EcoAccion con Flask.

Mismas funcionalidades que server.py pero usando Flask. Toda la lógica vive
en db.py (datos quemados, en memoria), así que estas rutas solo enrutan.

    pip install -r requirements.txt
    python app.py        ->   http://127.0.0.1:5000

Si no puedes instalar Flask, usa server.py (no requiere instalar nada).

Historias: HU01 registro, HU02 login, HU03 registrar, HU04 categorías,
HU05 puntos, HU06 impacto, HU07 historial, HU08 ranking, HU09 retos,
HU10 gestionar. Cambio del ciclo: confirmación al registrar.
"""
import os

from flask import Flask, jsonify, request, send_from_directory

import db

FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")

app = Flask(__name__, static_folder=None)
db.init_db()


def responder(funcion, codigo_ok=200):
    """Ejecuta una función de db.py y arma la respuesta/errores en JSON."""
    try:
        resultado = funcion()
        payload = {"ok": True}
        if isinstance(resultado, dict):
            payload.update(resultado)
        return jsonify(payload), codigo_ok
    except db.ErrorValidacion as e:
        cuerpo = {"ok": False}
        if e.errores:
            cuerpo["errores"] = e.errores
        if e.mensaje:
            cuerpo["mensaje"] = e.mensaje
        return jsonify(cuerpo), e.codigo
    except Exception as exc:  # noqa: BLE001
        return jsonify({"ok": False, "mensaje": "Error interno.", "detalle": str(exc)}), 500


# ---------------------------------------------------------------------------
#  Frontend estático
# ---------------------------------------------------------------------------
@app.route("/")
def home():
    return send_from_directory(FRONTEND_DIR, "login.html")


@app.route("/<path:archivo>")
def estaticos(archivo):
    return send_from_directory(FRONTEND_DIR, archivo)


# ---------------------------------------------------------------------------
#  Usuarios (HU01 registro, HU02 login)
# ---------------------------------------------------------------------------
@app.route("/api/registro", methods=["POST"])
def registro():
    return responder(lambda: db.crear_usuario(request.get_json(silent=True) or {}), 201)


@app.route("/api/login", methods=["POST"])
def login():
    return responder(lambda: db.autenticar(request.get_json(silent=True) or {}))


# ---------------------------------------------------------------------------
#  Acciones (HU03 registrar + confirmación, HU07 historial)
# ---------------------------------------------------------------------------
@app.route("/api/acciones", methods=["POST"])
def registrar_accion():
    return responder(lambda: db.registrar_accion(request.get_json(silent=True) or {}), 201)


@app.route("/api/acciones", methods=["GET"])
def listar_acciones():
    return responder(db.listar_acciones)


# ---------------------------------------------------------------------------
#  HU04 categorías
# ---------------------------------------------------------------------------
@app.route("/api/categorias", methods=["GET"])
def categorias():
    return responder(lambda: {"categorias": db.listar_categorias()})


# ---------------------------------------------------------------------------
#  HU08 ranking
# ---------------------------------------------------------------------------
@app.route("/api/ranking", methods=["GET"])
def ranking():
    return responder(lambda: db.obtener_ranking(request.args.get("tipo", "global")))


# ---------------------------------------------------------------------------
#  HU06 estadísticas / impacto
# ---------------------------------------------------------------------------
@app.route("/api/estadisticas", methods=["GET"])
def estadisticas():
    return responder(lambda: db.obtener_estadisticas(request.args.get("periodo", "mes")))


# ---------------------------------------------------------------------------
#  HU09 retos
# ---------------------------------------------------------------------------
@app.route("/api/retos", methods=["GET"])
def retos():
    return responder(db.listar_retos)


@app.route("/api/retos/<int:reto_id>/unirse", methods=["POST"])
def unirse_reto(reto_id):
    return responder(lambda: db.unirse_reto(reto_id))


@app.route("/api/retos/<int:reto_id>/completar", methods=["POST"])
def completar_reto(reto_id):
    return responder(lambda: db.completar_reto(reto_id))


# ---------------------------------------------------------------------------
#  HU10 gestionar acciones y retos
# ---------------------------------------------------------------------------
@app.route("/api/gestion/acciones", methods=["GET"])
def gestion_acciones():
    return responder(db.gestion_listar_acciones)


@app.route("/api/gestion/acciones/<int:accion_id>/eliminar", methods=["POST"])
def gestion_eliminar_accion(accion_id):
    return responder(lambda: db.gestion_eliminar_accion(accion_id))


@app.route("/api/gestion/retos", methods=["GET"])
def gestion_retos():
    return responder(db.gestion_listar_retos)


@app.route("/api/gestion/retos", methods=["POST"])
def gestion_crear_reto():
    return responder(lambda: db.gestion_crear_reto(request.get_json(silent=True) or {}), 201)


@app.route("/api/gestion/retos/<int:reto_id>/eliminar", methods=["POST"])
def gestion_eliminar_reto(reto_id):
    return responder(lambda: db.gestion_eliminar_reto(reto_id))


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
