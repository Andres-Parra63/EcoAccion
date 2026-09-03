/* Protección visual para la demostración. No reemplaza autenticación de servidor. */
const sesionEcoAccion =
  localStorage.getItem("ecoaccionSesion") || sessionStorage.getItem("ecoaccionSesion");

if (!sesionEcoAccion) {
  window.location.replace("/");
} else {
  document.querySelectorAll("[data-cerrar-sesion]").forEach((boton) => {
    boton.addEventListener("click", () => {
      localStorage.removeItem("ecoaccionSesion");
      sessionStorage.removeItem("ecoaccionSesion");
      window.location.replace("/");
    });
  });
}
