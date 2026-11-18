document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("filter-form");

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    const categoria = document.getElementById("filter-categoria").value;
    const estado = document.getElementById("filter-estado").value;
    const precioMin = parseFloat(document.getElementById("filter-precio-min").value) || 0;
    const precioMax = parseFloat(document.getElementById("filter-precio-max").value) || Infinity;
    const fechaDesde = document.getElementById("filter-fecha-desde")?.value || "";
    const fechaHasta = document.getElementById("filter-fecha-hasta")?.value || "";

    const productos = document.querySelectorAll(".product-result-card");

    productos.forEach(card => {
      const cardCategoria = card.dataset.categoria;
      const cardEstado = card.dataset.estado;
      const cardPrecio = parseFloat(card.dataset.precio);
      const cardFecha = card.dataset.fecha;

      let visible = true;

      if (categoria && cardCategoria !== categoria) visible = false;
      if (estado && cardEstado !== estado) visible = false;
      if (cardPrecio < precioMin || cardPrecio > precioMax) visible = false;
      if (fechaDesde && cardFecha < fechaDesde) visible = false;
      if (fechaHasta && cardFecha > fechaHasta) visible = false;

      card.style.display = visible ? "flex" : "none";
    });
  });

  form.addEventListener("reset", function() {
    const productos = document.querySelectorAll(".product-result-card");
    productos.forEach(card => {
      card.style.display = "flex";
    });
  });
});
