const formulario = document.querySelector("form");
const btnNuevoPedido = document.getElementById("btnNuevoPedido");
const MENSAJE_ERROR_INPUT_INCOMPLETOS =
    "⚠️ Por favor, rellena todos los campos";
const MENSAJE_ERROR_FALTA_INGREDIENTE =
    "⚠️ Por favor, selecciona al menos 1 ingrediente";
const MENSAJE_ERROR_FALTA_TAMANO_PIZZA =
    "⚠️ Por favor, selecciona el tamaño de tu pizza";

const SERVER_URL = "http://localhost:5500/";
const API = "datos.json";

formulario.addEventListener("submit", (e) => {
    e.preventDefault();

    // Sacamos provecho del "FormData" para recuperar todos los inputs con sus valores del formulario
    // Referencia: https://developer.mozilla.org/es/docs/Web/API/FormData
    // el objeto se forma a partir del "name" de cada input y su respectivo "value"
    const formData = new FormData(formulario);
    const datosFormulario = Object.fromEntries(formData);

    if (!esFormularioValido(datosFormulario)) {
        document.getElementById("mensajeContenedor").classList.remove("hidden");
        return;
    }

    document.getElementById("mensajeContenedor").classList.add("hidden");

    calcularTotalPedidoAJAX(datosFormulario);
});

btnNuevoPedido.addEventListener("click", () => {
    formulario.reset();
    document.getElementById("pedidoRealizado").classList.add("hidden");
    document.querySelector("main").classList.remove("hidden");
});

function esFormularioValido(datos) {
    // Revisamos si tenemos campos con valor de espacios en blanco (" ")
    for ([campo, valor] of Object.entries(datos)) {
        if (valor.trim() === "") {
            document.getElementById("mensajeAlerta").textContent =
                MENSAJE_ERROR_INPUT_INCOMPLETOS;
            return false;
        }
    }

    if (!existeTamanoDePizza(datos)) {
        document.getElementById("mensajeAlerta").textContent =
            MENSAJE_ERROR_FALTA_TAMANO_PIZZA;
        return false;
    }

    // Nos aseguramos que exista al menos un ingrediente
    if (!existeAlmenosUnIngrediente(datos)) {
        document.getElementById("mensajeAlerta").textContent =
            MENSAJE_ERROR_FALTA_INGREDIENTE;
        return false;
    }

    return true;
}

function existeAlmenosUnIngrediente(datos) {
    const ingredientesAVerificar = [];
    // Recuperamos todos los checkboxes (que ahora solo serian para los ingredientes)
    const checkboxes = document.querySelectorAll("input[type=checkbox]");

    // Iteramos sobre la lista y agregamos el "name" a la lista de ingredientesAVerificar
    checkboxes.forEach((checkbox) => {
        ingredientesAVerificar.push(checkbox.name);
    });

    // Iteramos sobre la lista de ingredientes generada dinamicamente
    for (let ingrediente of ingredientesAVerificar) {
        // Verificamos si AL MENOS un ingrediente existe en el formulario (seleccionado)
        if (datos[ingrediente] !== undefined) return true;
    }

    return false;
}

function existeTamanoDePizza(datos) {
    return datos.pizzaSize !== undefined;
}

// AE-2 AJAX

/**
 * Realiza una llamada AJAX al servidor para recuperar los siguientes datos de la pizzería:
 * - ingredientes
 * - tamaños
 *
 * En caso de error, alertamos al usuario de que ha ocurrido un error.
 *
 * @param {Function} onLoad Función callback que se ejecutará en caso la petición devuelva una respuesta válida,
 *               dicho callback debe recibir un parametro, que sería el JSON que devuelve el servidor.
 *
 * @example
 *
 * // nuestro callback que será invocado despues
 * function miCallback(respuestaJSONDelServidor) {
 *   console.log(`El servidor ha respondido con: ${respuestaJSONDelServidor}`);
 * }
 *
 * obtenerDatosDeIngredientesTamanos(miCallback);
 *
 */
function obtenerDatosDeIngredientesTamanos(onLoad) {
    const request = new XMLHttpRequest();
    request.open("GET", SERVER_URL + API, true);
    request.send();

    request.onload = function () {
        onLoad(JSON.parse(this.responseText));
    };

    request.onerror = function () {
        alert("Ups, ha ocurido un error! :[");
    };
}

function popularTamanosPizza(tamanosPizzas) {
    const contenedor = document.getElementById("tamanos-contenedor");
    const radioButtonClassName = "rounded-md px-2 py-1 mx-1";
    const radioButtonName = "pizzaSize";

    for (let tamano of tamanosPizzas) {
        let div = document.createElement("div");
        let input = document.createElement("input");
        let label = document.createElement("label");

        input.className = radioButtonClassName;
        input.name = radioButtonName;
        input.id = tamano.value;
        input.value = tamano.value;
        input.type = "radio";

        label.setAttribute("for", tamano.value);
        label.appendChild(
            document.createTextNode(
                `${tamano.nombre} - ${parseFloat(tamano.precio).toFixed(2)} €`
            )
        );

        div.appendChild(input);
        div.appendChild(label);
        contenedor.appendChild(div);
    }
}

function popularIngredientesPizza(ingredientesPizza) {
    const contenedor = document.getElementById("ingredientes-contenedor");
    const checkboxButtonClassName = "rounded-md px-2 py-1 mx-1";

    for (let ingrediente of ingredientesPizza) {
        let div = document.createElement("div");
        let input = document.createElement("input");
        let label = document.createElement("label");

        input.className = checkboxButtonClassName;
        input.name = ingrediente.value;
        input.id = ingrediente.value;
        input.type = "checkbox";

        label.setAttribute("for", ingrediente.value);
        label.appendChild(
            document.createTextNode(
                `${ingrediente.nombre} - ${parseFloat(
                    ingrediente.precio
                ).toFixed(2)} €`
            )
        );

        div.appendChild(input);
        div.appendChild(label);
        contenedor.appendChild(div);
    }
}

function calcularTotalPedidoAJAX(datosFormulario) {
    // Invocamos la función para que realice la petición AJAX
    // y pasamos el callback a ejecutar una vez tengamos la
    // información necesario del servidor
    obtenerDatosDeIngredientesTamanos(function (jsonResponse) {
        calcularTotalPedido(datosFormulario, jsonResponse);
    });
}

function calcularTotalPedido(datosFormulario, jsonServidor) {
    let total = 0;

    // Iteramos sobre los diferentes tamaños de pizza existente
    // Creamos un objeto que contendra como llave el "value" del tamaño
    // Y como valor el precio, esto nos ayudara a calcular facilmente el precio
    // del tamaño de pizza seleccionado
    const costoPizzaPorTamano = {};
    for (let tamano of jsonServidor.tamanosPizza) {
        // Guardamos el precio como un float para mantener su precision decimal
        costoPizzaPorTamano[tamano.value] = parseFloat(tamano.precio);
    }

    // Sumamos al total el tamano seleccionado del formulario
    total += costoPizzaPorTamano[datosFormulario.pizzaSize];

    // Iteramos sobre los ingredientes del servidor y buscamos los que han sido
    // seleccionados por parte del usuario para sumarle el precio acorde
    for (let ingrediente of jsonServidor.ingredientes) {
        if (datosFormulario[ingrediente.value] !== undefined) {
            total += parseFloat(ingrediente.precio);
        }
    }

    document.getElementById("totalPedido").textContent = `${total.toFixed(
        2
    )} €`;
    document.querySelector("main").classList.add("hidden");
    document.getElementById("pedidoRealizado").classList.remove("hidden");
}

const botonRefrescar = document.getElementById("refrescar-btn");

botonRefrescar.addEventListener("click", () => {
    // Limpiamos los ingredientes y tamaños anteriores
    document.getElementById("ingredientes-contenedor").innerHTML = "";
    document.getElementById("tamanos-contenedor").innerHTML = "";

    // Llamamos nuevamente a la api para popular los nuevos posibles datos
    obtenerDatosDeIngredientesTamanos(function (jsonResponse) {
        popularTamanosPizza(jsonResponse.tamanosPizza);
        popularIngredientesPizza(jsonResponse.ingredientes);
    });
});

// Cargamos los ingredientes y tamanos de la AJAX request
obtenerDatosDeIngredientesTamanos(function (jsonResponse) {
    popularTamanosPizza(jsonResponse.tamanosPizza);
    popularIngredientesPizza(jsonResponse.ingredientes);
});
