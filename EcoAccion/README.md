# EcoAccion 🌱

App para registrar acciones sostenibles, ganar puntos y competir en un ranking.
Funciona como **app instalable en el celular y 100% offline** (sin internet).

## Prototipo (Parcial II)

MVP **sin base de datos real**: los datos son **datos quemados** que viven en el
propio navegador (JavaScript + almacenamiento local). No necesita servidor ni
internet para funcionar, lo que cumple el requisito del enunciado.

### Historias de usuario

| HU | Historia |
|----|----------|
| HU01 | Registro de usuario |
| HU02 | Inicio de sesión |
| HU03 | Registrar acción sostenible |
| HU04 | Clasificar acción |
| HU05 | Recibir puntos |
| HU06 | Visualizar impacto ambiental |
| HU07 | Consultar historial |
| HU08 | Consultar ranking |
| HU09 | Retos sostenibles |
| HU10 | Gestionar acciones y retos |

**Cambio del ciclo:** *Confirmación al registrar una acción sostenible* (HU03 + HU05):
al registrar, confirma el guardado, muestra los puntos ganados y el puntaje acumulado.

## Cómo funciona (arquitectura)

- **Frontend:** HTML, CSS y JavaScript. Es una **PWA** (se instala en el cel con ícono).
- **Lógica y datos:** `frontend/js/api-local.js` responde todas las operaciones en
  el navegador con datos quemados (guardados en `localStorage`). Por eso corre offline.
- **Backend Python (opcional):** `backend/` tiene un servidor equivalente (`server.py`
  sin dependencias, o `app.py` con Flask). No es necesario para la app, queda como
  versión de servidor de referencia.

## Verla en el computador

Opción simple (no requiere instalar nada): abre `frontend/login.html`… o mejor,
levanta un servidor estático para que la PWA funcione bien:

```bash
cd frontend
python -m http.server 8080
```

Abre **http://127.0.0.1:8080/login.html**. Entra con **demo@eco.com / 1234** o crea tu cuenta.

## Usarla en el celular (offline, para la U)

1. Sube la carpeta `frontend/` a un hosting estático gratis con HTTPS
   (por ejemplo **Netlify Drop**: https://app.netlify.com/drop, arrastras la carpeta
   y te da una URL). También sirve un "Static Site" de Render o GitHub Pages.
2. En el celular, **con internet** (en tu casa), abre esa URL. Deja que cargue.
3. Menú del navegador → **"Agregar a pantalla de inicio"**. Queda el ícono de la app.
4. En la U, **sin internet**: abres la app desde el ícono y funciona normal.
   Los datos se guardan en el teléfono.

> Para reiniciar la demo a su estado inicial: en la consola del navegador escribe
> `ecoReset()`, o borra los datos del sitio.

## Estructura

```
EcoAccion/
├── backend/   (servidor Python opcional: server.py, app.py, db.py)
└── frontend/
    ├── index.html, login.html, registro.html, registrar.html, historial.html,
    │   retos.html, ranking.html, impacto.html, gestionar.html
    ├── manifest.json, sw.js, icon-192.png, icon-512.png   (PWA)
    ├── css/estilos.css
    └── js/  (api-local.js = backend en el navegador, + lógica de cada pantalla)
```
