
document.addEventListener("DOMContentLoaded", () => {
    const mensajes = {
      inputID: {
        valueMissing: "El ID es obligatorio."
      },
      inputMarca: {
        valueMissing: "La marca es obligatoria."
      },
      inputPrecio: {
        valueMissing: "El precio es obligatorio.",
        rangeUnderflow: c => `El precio mínimo es ${c.min} USD.`,
        rangeOverflow: c => `El precio máximo es ${c.max} USD.`
      },
      inputCantidad: {
        valueMissing: "La cantidad es obligatoria.",
        rangeUnderflow: c => `La cantidad mínima es ${c.min}.`,
        rangeOverflow: c => `La cantidad máxima es ${c.max}.`
      },
      inputColor: {
        valueMissing: "El color es obligatorio."
      }
    };

    const formulario = document.getElementById("frmFormulario");
    
    formulario.querySelectorAll(".form-control").forEach(campo => {
      campo.addEventListener("input", () => {
        const esValido = campo.checkValidity();

        campo.classList.toggle("is-valid", esValido);
        campo.classList.toggle("is-invalid", !esValido);

        if (!esValido) {
          generarMensajeError(campo, mensajes); 
        } else {
          const divError = document.getElementById("error-" + campo.id);
          if (divError) divError.textContent = "";
        }
      });
    });
    
    document.getElementById("btnAgregar").addEventListener("click", async () => {
        if (!validarFormulario(formulario, mensajes)) return;
        await enviarPintura("POST");
    });

    document.getElementById("btnModificar").addEventListener("click", async () => {
        if (!validarFormulario(formulario, mensajes)) return;
        await enviarPintura("PUT");
    });

    formulario.addEventListener("reset", () => {
        setTimeout(() => limpiarFormulario(formulario), 0);
    });

    document.getElementById("btnFiltrar").addEventListener("click", () => {
        const marcaBuscada = document.getElementById("inputMarca").value.trim().toLowerCase();

        if (!marcaBuscada) {
            alert("Ingresá una marca para filtrar.");
            return;
        }

        fetch("https://utnfra-api-pinturas.onrender.com/pinturas")
            .then(res => res.json())
            .then(data => {
            const pinturasFiltradas = data.filter(p => p.marca.toLowerCase() === marcaBuscada);
            mostrarListado(pinturasFiltradas);
            })
            .catch(() => alert("No se pudo obtener el listado de pinturas."));
    });

    document.getElementById("btnPromedio").addEventListener("click", () => {
      fetch("https://utnfra-api-pinturas.onrender.com/pinturas")
        .then(res => res.json())
        .then(data => {
          if (data.length === 0) {
            alert("No hay pinturas registradas.");
            return;
          }

          const total = data.reduce((acc, pintura) => acc + pintura.precio, 0);
          const promedio = (total / data.length).toFixed(2);

          alert(`El precio promedio de las pinturas es: $${promedio} USD`);
        })
        .catch(() => alert("No se pudo calcular el promedio."));
    });

    cargarListadoPinturas();
});

async function cargarListadoPinturas() {
    const URL_API = "https://utnfra-api-pinturas.onrender.com/pinturas";

    try {
        const response = await fetch(URL_API);
    if (!response.ok) {
        throw new Error("Error al obtener las pinturas");
    }

    const pinturas = await response.json();
        mostrarListado(pinturas);
    } catch (error) {
    
    document.getElementById("divListado").innerHTML =
        "<p class='text-danger'>No se pudo cargar el listado.</p>";
    }
}

function mostrarListado(pinturas) {
  const divListado = document.getElementById("divListado");

  const tablaHTML = `
    <table class="table table-hover table-bordered table-striped align-middle text-center">
      <thead class="table-dark">
        <tr>
          <th>ID</th>
          <th>Marca</th>
          <th>Precio (USD)</th>
          <th>Color</th>
          <th>Cantidad</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        ${pinturas
          .map(
            (p) => `
          <tr>
            <td>${p.id}</td>
            <td>${p.marca}</td>
            <td>${p.precio}</td>
            <td><input type="color" value="${p.color}" disabled></td>
            <td>${p.cantidad}</td>
            <td>
              <i class="bi bi-pencil-square text-primary me-2 cursor-pointer" onclick='seleccionarPintura(${JSON.stringify(
                p
              )})'></i>
              <i class="bi bi-trash text-danger cursor-pointer" onclick='eliminarPintura(${p.id}, "${p.marca}")'></i>
            </td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;

  divListado.innerHTML = tablaHTML;
}

function seleccionarPintura(pintura) {
    document.getElementById("inputID").value = pintura.id;
    document.getElementById("inputMarca").value = pintura.marca;
    document.getElementById("inputPrecio").value = pintura.precio;
    document.getElementById("inputColor").value = pintura.color;
    document.getElementById("inputCantidad").value = pintura.cantidad;
}

async function enviarPintura(method) {
  const id = document.getElementById("inputID").value.trim();
  const pintura = {
    marca: document.getElementById("inputMarca").value.trim(),
    precio: parseFloat(document.getElementById("inputPrecio").value),
    color: document.getElementById("inputColor").value,
    cantidad: parseInt(document.getElementById("inputCantidad").value)
  };

  const url = method === "PUT"
    ? `https://utnfra-api-pinturas.onrender.com/pinturas/${id}`
    : "https://utnfra-api-pinturas.onrender.com/pinturas";

    mostrarSpinner();
    try {
        const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pintura)
        });

        const resultado = await response.json();

        if (resultado.exito) {
            alert(`Pintura ${method === "PUT" ? "modificada" : "agregada"} correctamente.`);
            cargarListadoPinturas();
            limpiarFormulario(document.getElementById("frmFormulario"));
        } else {
            alert(resultado.mensaje);
        }
    } catch (error) {
        alert("Error al enviar los datos.");
    } finally {
        ocultarSpinner(); 
    }
}

async function eliminarPintura(id, marca) {
    const URL_API = `https://utnfra-api-pinturas.onrender.com/pinturas/${id}`;

    const confirmar = confirm(`¿Estás seguro de que querés eliminar la pintura con ID ${id} y MARCA "${marca}"?`);

    if (!confirmar) return;

    try {
        const response = await fetch(URL_API, { method: "DELETE" });

        if (!response.ok) throw new Error("Error al eliminar");

        const resultado = await response.json();

        if (resultado.exito) {
        cargarListadoPinturas();
        } else {
        alert("Error: " + resultado.mensaje);
        }
    } catch (error) {
        alert("No se pudo eliminar la pintura.");
    }
}

function validarFormulario(form, mensajes) {
  const campos = form.querySelectorAll(".form-control");
  let esValido = true;

  campos.forEach((campo) => {
    if (!campo.checkValidity()) {
      campo.classList.add("is-invalid");
      campo.classList.remove("is-valid");
      generarMensajeError(campo, mensajes);
      esValido = false;
    } else {
      campo.classList.remove("is-invalid");
      campo.classList.add("is-valid");
      const divError = document.getElementById("error-" + campo.id);
      if (divError) divError.textContent = "";
    }
  });

  form.classList.add("was-validated");
  return esValido;
}

function generarMensajeError(campo, mensajes) {
  const id = campo.id;
  const divError = document.getElementById("error-" + id);

  if (!divError) console.warn("No se encontró el div de error para:", id);
  if (!mensajes[id]) console.warn("No hay mensajes definidos para:", id);

  if (!divError || !mensajes[id]) return;

  for (const error in campo.validity) {
    if (campo.validity[error] && mensajes[id][error]) {
      const mensaje = typeof mensajes[id][error] === "function"
        ? mensajes[id][error](campo)
        : mensajes[id][error];
      divError.textContent = mensaje;
      break;
    }
  }
}

function limpiarFormulario(formulario) {
  formulario.reset();
  formulario.classList.remove('was-validated');
  formulario.querySelectorAll(".form-control").forEach((el) => {
    el.classList.remove("is-valid", "is-invalid");
  });

  formulario.querySelectorAll('.invalid-feedback').forEach((div) => {
    div.textContent = '';
  });
}

function mostrarSpinner() {
  document.getElementById("spinner").style.display = "block";
}

function ocultarSpinner() {
  document.getElementById("spinner").style.display = "none";
}

