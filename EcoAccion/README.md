# EcoAccion 🌱

Aplicación para registrar acciones sostenibles, ganar puntos y motivar la
participación mediante retos y un ranking.

## Prototipo (Parcial II)

MVP **sin base de datos real**: todos los datos son datos quemados en memoria
(se reinician al reiniciar el servidor), como pide el enunciado.

### Historias de usuario implementadas

| HU | Historia | Pantalla / API |
|----|----------|----------------|
| HU01 | Registro de usuario | `registro.html` · `POST /api/registro` |
| HU02 | Inicio de sesión | `login.html` · `POST /api/login` |
| HU03 | Registrar acción sostenible | `registrar.html` · `POST /api/acciones` |
| HU04 | Clasificar acción | selector de categorías · `GET /api/categorias` |
| HU05 | Recibir puntos | suma automática al registrar |
| HU06 | Visualizar impacto ambiental | `impacto.html` · `GET /api/estadisticas` |
| HU07 | Consultar historial | `historial.html` · `GET /api/acciones` |
| HU08 | Consultar ranking | `ranking.html` · `GET /api/ranking` |
| HU09 | Retos sostenibles | `retos.html` · `GET/POST /api/retos/...` |
| HU10 | Gestionar acciones y retos | `gestionar.html` · `/api/gestion/...` |

**Cambio del ciclo:** *Confirmación al registrar una acción sostenible*
(HU03 + HU05). Al registrar, el sistema confirma el guardado, muestra los
puntos obtenidos y el puntaje acumulado, y notifica si ocurre un error.

## Tecnologías

- **Frontend:** HTML, CSS y JavaScript (sin frameworks).
- **Backend:** Python. Dos formas de correrlo:
  - `server.py` — solo librería estándar, **no requiere instalar nada**.
  - `app.py` — con Flask (mismas rutas), para quien prefiera Flask.
- **Datos:** en memoria (datos quemados), sin base de datos real.

## Cómo ejecutar (recomendado, sin instalar nada)

Desde **Git Bash**, dentro de la carpeta del proyecto:

```bash
cd backend
python server.py
```

Abre **http://127.0.0.1:5000**. Para detenerlo: `Ctrl + C`.

> Alternativa con Flask: `pip install -r backend/requirements.txt` y luego
> `python backend/app.py`.

## Cómo entrar

- Cuenta de demostración: **demo@eco.com** / contraseña **1234**
- O crea tu propia cuenta desde "Regístrate aquí" (HU01).

## Estructura

```
EcoAccion/
├── backend/
│   ├── server.py         # Servidor sin dependencias (recomendado)
│   ├── app.py            # Servidor con Flask (mismas rutas)
│   ├── db.py             # Datos quemados + lógica de negocio
│   └── requirements.txt
└── frontend/
    ├── login.html · registro.html
    ├── registrar.html · historial.html · retos.html
    ├── ranking.html · impacto.html · gestionar.html
    ├── css/estilos.css
    └── js/ (auth, login, registro, registrar, historial, retos, ranking, impacto, gestionar)
```
