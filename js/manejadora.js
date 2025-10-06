document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("mostrar").addEventListener("click", mostrarListadoAlumnos);
    document.getElementById("mostrar-argentinos").addEventListener("click", mostrarArgentinos);
    document.getElementById("mostrar-homonimos").addEventListener("click", mostrarHomonimos);
    document.getElementById("formulario").addEventListener("submit", validarFormulario);
});

function mostrarArgentinos(e){
    e.preventDefault();
    mostrarSpinner();

    fetch("https://api-alumnos-modelo-pp.onrender.com/alumnos")
        .then(response => {
            ocultarSpinner();
            return response.json();
        })
        .then(alumnos => {
            const argentinos = alumnos.filter(a => a.pais === "Argentina");
            renderizarListado(argentinos);
        })
        .catch(error => {
            ocultarSpinner();
            alert("Error al filtrar argentinos: " + error.message);
        });
}

function mostrarHomonimos(e){
    e.preventDefault();
    const nombreBuscado = document.getElementById("nombre").value.trim();
    if (!nombreBuscado) {
        alert("Ingrese un nombre en el formulario para buscar homónimos.");
        return;
    }

    mostrarSpinner();
    fetch("https://api-alumnos-modelo-pp.onrender.com/alumnos")
        .then(response => {
            ocultarSpinner();
            return response.json();
        })
        .then(alumnos => {
            const homonimos = alumnos.filter(a => a.nombre && a.nombre.toLowerCase() === nombreBuscado.toLowerCase());
            renderizarListado(homonimos);
        })
        .catch(error => {
            ocultarSpinner();
            alert("Error al buscar homónimos: " + error.message);
        });
}

function mostrarSpinner() {
    document.getElementById("spinner").style.display = "block";
}

function ocultarSpinner() {
    document.getElementById("spinner").style.display = "none";
}

function mostrarListadoAlumnos(event) {
    if (event) event.preventDefault();
    mostrarSpinner();

    fetch("https://api-alumnos-modelo-pp.onrender.com/alumnos")
        .then(response => {
            if (!response.ok) {
                throw new Error("Error al recuperar los alumnos");
            }
            return response.json();
        })
        .then(alumnos => {
            ocultarSpinner();
            renderizarListado(alumnos);
        })
        .catch(error => {
            ocultarSpinner();
            document.getElementById("panel-derecha").innerHTML = `<p class="text-danger">No se pudo cargar el listado de alumnos.</p>`;
            console.error("Error:", error);
        });
}

function renderizarListado(alumnos) {
    const panelDerecha = document.getElementById("panel-derecha");
    panelDerecha.innerHTML = "";

    const tabla = document.createElement("table");
    tabla.className = "table table-striped table-bordered table-hover";

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Legajo</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Foto</th>
            <th>País</th>
            <th>Eliminar</th>
        </tr>
    `;
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    alumnos.forEach(alumno => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><a href="#" class="link-legajo" data-legajo="${alumno.legajo}">${alumno.legajo}</a></td>
            <td>${alumno.nombre}</td>
            <td>${alumno.email}</td>
            <td><img src="${alumno.foto}" width="70" height="70" alt="Foto de ${alumno.nombre}"></td>
            <td>${alumno.pais}</td>
            <td>
                <button class="btn btn-danger btn-sm btn-eliminar" data-legajo="${alumno.legajo}" data-nombre="${alumno.nombre}" data-email="${alumno.email}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    panelDerecha.appendChild(tabla);

    document.querySelectorAll(".link-legajo").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            cargarAlumno(e.target.dataset.legajo);
        });
    });

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const { legajo, nombre, email } = e.currentTarget.dataset;
            const confirmar = confirm(`¿Eliminar alumno?\nLegajo: ${legajo}\nNombre: ${nombre}\nCorreo: ${email}`);
            if (confirmar) eliminarAlumno(legajo);
        });
    });
}

function cargarAlumno(legajo) {
    fetch(`https://api-alumnos-modelo-pp.onrender.com/alumnos/${legajo}`)
        .then(response => {
            ocultarSpinner();
            if (!response.ok) {
                throw new Error("Alumno no encontrado");
            }
            return response.json();
        })
        .then(alumno => {
            document.getElementById("legajo").value = alumno.legajo;
            document.getElementById("nombre").value = alumno.nombre;
            document.getElementById("email").value = alumno.email;
            document.getElementById("pais").value = alumno.pais;
            document.getElementById("foto_img").src = alumno.foto;

            ["nombre", "email", "pais", "foto", "terminos"].forEach(id => {
                const campo = document.getElementById(id);
                campo.classList.remove("is-valid", "is-invalid");
            });

            const formulario = document.getElementById("formulario");
            formulario.removeEventListener("submit", validarFormulario);
            formulario.addEventListener("submit", validarModificacion);
        })
        .catch(error => {
            ocultarSpinner();
            alert("Error al cargar el alumno: " + error.message);
        });
}

function validarFormulario(event) {
    event.preventDefault();
    validarCampos(agregarAlumno);
}

function validarModificacion(event) {
    event.preventDefault();
    validarCampos(modificarAlumno);
}

function validarCampos(callback) {
    const nombre = document.getElementById("nombre");
    const email = document.getElementById("email");
    const pais = document.getElementById("pais");
    const foto = document.getElementById("foto");
    const terminos = document.getElementById("terminos");

    let esValido = true;

    if (nombre.value.trim() === "") {
        nombre.classList.add("is-invalid");
        document.getElementById("error-nombre").textContent = "El nombre es obligatorio.";
        esValido = false;
    } else {
        nombre.classList.remove("is-invalid");
        nombre.classList.add("is-valid");
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email.value.trim())) {
        email.classList.add("is-invalid");
        document.getElementById("error-email").textContent = "Ingrese un correo electrónico válido.";
        esValido = false;
    } else {
        email.classList.remove("is-invalid");
        email.classList.add("is-valid");
    }

    if (pais.value === "") {
        pais.classList.add("is-invalid");
        document.getElementById("error-pais").textContent = "Debe seleccionar un país.";
        esValido = false;
    } else {
        pais.classList.remove("is-invalid");
        pais.classList.add("is-valid");
    }

    const archivo = foto.files[0];
    if (!archivo) {
        foto.classList.add("is-invalid");
        document.getElementById("error-foto").textContent = "Debe seleccionar una foto.";
        esValido = false;
    } else {
        const extensionesPermitidas = ["jpg", "jpeg", "png", "gif"];
        const extension = archivo.name.split(".").pop().toLowerCase();
        if (!extensionesPermitidas.includes(extension)) {
            foto.classList.add("is-invalid");
            document.getElementById("error-foto").textContent = "Formato inválido. Solo JPG, JPEG, PNG o GIF.";
            esValido = false;
        } else {
            foto.classList.remove("is-invalid");
            foto.classList.add("is-valid");
        }
    }

    if (!terminos.checked) {
        terminos.classList.add("is-invalid");
        document.getElementById("error-terminos").textContent = "Debe aceptar los términos.";
        esValido = false;
    } else {
        terminos.classList.remove("is-invalid");
        terminos.classList.add("is-valid");
    }

    if (esValido) {
        callback();
    }
}

function agregarAlumno() {
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const pais = document.getElementById("pais").value;
    const fotoFile = document.getElementById("foto").files[0];

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("email", email);
    formData.append("pais", pais);
    formData.append("foto", fotoFile);

    mostrarSpinner();
    fetch("https://api-alumnos-modelo-pp.onrender.com/alumnos", {
        method: "POST",
        body: formData
    })
    .then(response => {
        ocultarSpinner();
        if (!response.ok) {
            throw new Error("No se pudo agregar el alumno");
        }
        return response.json();
    })
    .then(() => {
        mostrarListadoAlumnos();
        limpiarFormulario();
    })
    .catch(error => {
        ocultarSpinner();
        alert("Error: " + error.message);
    });
}

function limpiarFormulario() {
    document.getElementById("formulario").reset();
    document.getElementById("foto_img").src = "./img/user.png";
    document.getElementById("legajo").value = "";

    ["nombre", "email", "pais", "foto", "terminos"].forEach(id => {
        document.getElementById(id).classList.remove("is-valid", "is-invalid");
    });

    const formulario = document.getElementById("formulario");
    formulario.removeEventListener("submit", validarModificacion);
    formulario.addEventListener("submit", validarFormulario);
}

function modificarAlumno() {
    const legajo = document.getElementById("legajo").value;
    const nombre = document.getElementById("nombre").value.trim();
    const email = document.getElementById("email").value.trim();
    const pais = document.getElementById("pais").value;
    const fotoFile = document.getElementById("foto").files[0];

    const formData = new FormData();
    formData.append("nombre", nombre);
    formData.append("email", email);
    formData.append("pais", pais);
    formData.append("foto", fotoFile);

    mostrarSpinner();
    fetch(`https://api-alumnos-modelo-pp.onrender.com/alumnos/${legajo}`, {
        method: "PUT",
        body: formData
    })
    .then(response => {
        ocultarSpinner();
        if (!response.ok) {
            throw new Error("No se pudo modificar el alumno");
        }
        return response.json();
    })
    .then(() => {
        mostrarListadoAlumnos();
        limpiarFormulario();

        const formulario = document.getElementById("formulario");
        formulario.removeEventListener("submit", validarModificacion);
        formulario.addEventListener("submit", validarFormulario);
    })
    .catch(error => {
        ocultarSpinner();
        alert("Error: " + error.message);
    });
}

function eliminarAlumno(legajo) {
    mostrarSpinner();
    fetch(`https://api-alumnos-modelo-pp.onrender.com/alumnos/${legajo}`, {
        method: "DELETE"
    })
    .then(response => {
        ocultarSpinner();
        if (!response.ok) {
            throw new Error("No se pudo eliminar el alumno");
        }
        return response.json();
    })
    .then(() => {
        mostrarListadoAlumnos();
    })
    .catch(error => {
        ocultarSpinner();
        alert("Error al eliminar: " + error.message);
    });
}

function renderizarListado(alumnos) {
    const panelDerecha = document.getElementById("panel-derecha");
    panelDerecha.innerHTML = "";

    const tabla = document.createElement("table");
    tabla.className = "table table-striped table-bordered table-hover";

    const thead = document.createElement("thead");
    thead.innerHTML = `
        <tr>
            <th>Legajo</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Foto</th>
            <th>País</th>
            <th>Eliminar</th>
        </tr>
    `;
    tabla.appendChild(thead);

    const tbody = document.createElement("tbody");

    alumnos.forEach(alumno => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td><a href="#" class="link-legajo" data-legajo="${alumno.legajo}">${alumno.legajo}</a></td>
            <td>${alumno.nombre}</td>
            <td>${alumno.email}</td>
            <td><img src="${alumno.foto}" width="70" height="70" alt="Foto de ${alumno.nombre}"></td>
            <td>${alumno.pais}</td>
            <td>
                <button class="btn btn-danger btn-sm btn-eliminar" data-legajo="${alumno.legajo}" data-nombre="${alumno.nombre}" data-email="${alumno.email}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(fila);
    });

    tabla.appendChild(tbody);
    panelDerecha.appendChild(tabla);

    document.querySelectorAll(".link-legajo").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const legajo = e.target.dataset.legajo;
            cargarAlumno(legajo);
        });
    });

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const legajo = e.currentTarget.dataset.legajo;
            const nombre = e.currentTarget.dataset.nombre;
            const email = e.currentTarget.dataset.email;

            const confirmar = confirm(`¿Seguro que desea eliminar al alumno?\nLegajo: ${legajo}\nNombre: ${nombre}\nCorreo: ${email}`);
            if (confirmar) {
                eliminarAlumno(legajo);
            }
        });
    });
}