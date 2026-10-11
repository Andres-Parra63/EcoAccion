"""
server.py — Servidor de EcoAccion SIN dependencias externas.

Usa solo la librería estándar de Python (http.server). No requiere instalar
nada: se ejecuta con el Python que ya tienes.

    python server.py      ->   http://127.0.0.1:5000

Toda la lógica vive en db.py (datos quemados, en memoria). Este archivo solo
enruta las peticiones y serializa las respuestas.
"""
import json
import os
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

import db

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
# En local usa 5000. En un hosting (Render) toma el puerto de la variable PORT.
PUERTO = int(os.environ.get("PORT", 5000))

TIPOS = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
}


class Handler(BaseHTTPRequestHandler):
    # ---- helpers ----
    def _json(self, codigo, data):
        cuerpo = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(cuerpo)))
        self.end_headers()
        self.wfile.write(cuerpo)

    def _archivo(self, ruta_rel):
        if not ruta_rel or ruta_rel == "/":
            ruta_rel = "login.html"
        ruta_rel = ruta_rel.lstrip("/")
        ruta_abs = os.path.abspath(os.path.join(FRONTEND_DIR, ruta_rel))
        if not ruta_abs.startswith(FRONTEND_DIR) or not os.path.isfile(ruta_abs):
            self.send_error(404, "Archivo no encontrado")
            return
        ext = os.path.splitext(ruta_abs)[1].lower()
        with open(ruta_abs, "rb") as fh:
            contenido = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", TIPOS.get(ext, "application/octet-stream"))
        self.send_header("Content-Length", str(len(contenido)))
        self.end_headers()
        self.wfile.write(contenido)

    def _leer_json(self):
        largo = int(self.headers.get("Content-Length") or 0)
        if largo == 0:
            return {}
        try:
            return json.loads(self.rfile.read(largo).decode("utf-8")) or {}
        except (ValueError, UnicodeDecodeError):
            return {}

    def _ejecutar(self, funcion, codigo_ok=200):
        """Llama a una función de db.py y arma la respuesta/errores."""
        try:
            resultado = funcion()
            payload = {"ok": True}
            if isinstance(resultado, dict):
                payload.update(resultado)
            self._json(codigo_ok, payload)
        except db.ErrorValidacion as e:
            cuerpo = {"ok": False}
            if e.errores:
                cuerpo["errores"] = e.errores
            if e.mensaje:
                cuerpo["mensaje"] = e.mensaje
            self._json(e.codigo, cuerpo)
        except Exception as exc:  # noqa: BLE001
            self._json(500, {"ok": False, "mensaje": "Error interno.", "detalle": str(exc)})

    # ---- GET ----
    def do_GET(self):
        partes = urlparse(self.path)
        ruta = partes.path
        q = parse_qs(partes.query)

        if ruta == "/api/categorias":
            return self._ejecutar(lambda: {"categorias": db.listar_categorias()})
        if ruta == "/api/acciones":
            return self._ejecutar(db.listar_acciones)
        if ruta == "/api/ranking":
            tipo = q.get("tipo", ["global"])[0]
            return self._ejecutar(lambda: db.obtener_ranking(tipo))
        if ruta == "/api/estadisticas":
            periodo = q.get("periodo", ["mes"])[0]
            return self._ejecutar(lambda: db.obtener_estadisticas(periodo))
        if ruta == "/api/retos":
            return self._ejecutar(db.listar_retos)
        if ruta == "/api/gestion/acciones":
            return self._ejecutar(db.gestion_listar_acciones)
        if ruta == "/api/gestion/retos":
            return self._ejecutar(db.gestion_listar_retos)

        return self._archivo(ruta)

    # ---- POST ----
    def do_POST(self):
        ruta = urlparse(self.path).path
        datos = self._leer_json()

        if ruta == "/api/registro":
            return self._ejecutar(lambda: db.crear_usuario(datos), 201)
        if ruta == "/api/login":
            return self._ejecutar(lambda: db.autenticar(datos))
        if ruta == "/api/acciones":
            return self._ejecutar(lambda: db.registrar_accion(datos), 201)
        if ruta == "/api/gestion/retos":
            return self._ejecutar(lambda: db.gestion_crear_reto(datos), 201)

        m = re.match(r"^/api/retos/(\d+)/unirse$", ruta)
        if m:
            return self._ejecutar(lambda: db.unirse_reto(int(m.group(1))))
        m = re.match(r"^/api/retos/(\d+)/completar$", ruta)
        if m:
            return self._ejecutar(lambda: db.completar_reto(int(m.group(1))))
        m = re.match(r"^/api/gestion/acciones/(\d+)/eliminar$", ruta)
        if m:
            return self._ejecutar(lambda: db.gestion_eliminar_accion(int(m.group(1))))
        m = re.match(r"^/api/gestion/retos/(\d+)/eliminar$", ruta)
        if m:
            return self._ejecutar(lambda: db.gestion_eliminar_reto(int(m.group(1))))

        m = re.match(r"^/api/gestion/retos/(\d+)/alternar$", ruta)
        if m:
            return self._ejecutar(lambda: db.gestion_alternar_reto(int(m.group(1))))

        self.send_error(404, "Ruta no encontrada")

    def log_message(self, formato, *args):
        pass  # consola limpia


def main():
    db.init_db()
    servidor = ThreadingHTTPServer(("127.0.0.1", PUERTO), Handler)
    print(f"EcoAccion corriendo en http://127.0.0.1:{PUERTO}")
    print("Para detenerlo: Ctrl + C")
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor detenido.")
        servidor.server_close()


if __name__ == "__main__":
    main()
