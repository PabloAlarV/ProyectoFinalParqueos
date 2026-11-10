// PARQUEOS UMG - JAVASCRIPT BASICO
var capacidad = 100, tarifa = 10;
var usuarios = [], dentro = [], movimientos = [];
var usuarioActual = null, tipoAcceso = "usuario";
var indiceSalida = -1, horaSalida = "", horasCobro = 0;

function campo(id) { return document.getElementById(id); }

// Guardar y recuperar la informacion
function guardarDatos() {
    var datos = { usuarios: usuarios, dentro: dentro, movimientos: movimientos };
    localStorage.setItem("parqueosUMG", JSON.stringify(datos));
}
function cargarDatos() {
    var datos = localStorage.getItem("parqueosUMG");
    if (datos != null) {
        datos = JSON.parse(datos);
        usuarios = datos.usuarios; dentro = datos.dentro; movimientos = datos.movimientos;
    }
}

// Navegar entre las secciones
function ver(grupo, nombre) {
    campo("zona-publica").hidden = grupo != "publica";
    campo("zona-admin").hidden = grupo != "admin";
    campo("zona-usuario").hidden = grupo != "usuario";
    var secciones = document.getElementsByClassName("vista-" + grupo);
    for (var i = 0; i < secciones.length; i++) secciones[i].hidden = true;
    campo(grupo + "-" + nombre).hidden = false;
    if (grupo == "admin") cargarAdmin(nombre);
    if (grupo == "usuario") cargarUsuario(nombre);
}

function seleccionarTipo(tipo) {
    tipoAcceso = tipo;
    campo("login-mensaje").hidden = true;
    if (tipo == "admin") {
        campo("titulo-acceso").textContent = "Acceso de administrador";
        campo("label-correo").textContent = "Usuario";
        campo("login-correo").placeholder = "admin";
        campo("credenciales-admin").hidden = false;
        campo("enlace-registro").hidden = true;
    } else {
        campo("titulo-acceso").textContent = "Acceso de usuario";
        campo("label-correo").textContent = "Correo electronico";
        campo("login-correo").placeholder = "correo@ejemplo.com";
        campo("credenciales-admin").hidden = true;
        campo("enlace-registro").hidden = false;
    }
    campo("login-correo").value = ""; campo("login-clave").value = "";
}

// Registrar un cliente y su vehiculo
function registrarUsuario(evento) {
    evento.preventDefault();
    var nombre = campo("reg-nombre").value, dpi = campo("reg-dpi").value;
    var telefono = campo("reg-telefono").value, correo = campo("reg-correo").value.toLowerCase();
    var placa = campo("reg-placa").value.toUpperCase(), modelo = campo("reg-modelo").value;
    var color = campo("reg-color").value, clave = campo("reg-clave").value;

    if (clave != campo("reg-confirmar").value) {
        campo("registro-mensaje").textContent = "Las contrasenas no coinciden.";
        campo("registro-mensaje").hidden = false; return;
    }
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].correo == correo || usuarios[i].placa == placa) {
            campo("registro-mensaje").textContent = "El correo o la placa ya estan registrados.";
            campo("registro-mensaje").hidden = false; return;
        }
    }
    usuarios.push({ nombre: nombre, dpi: dpi, telefono: telefono, correo: correo,
        placa: placa, modelo: modelo, color: color, clave: clave });
    guardarDatos();
    campo("conf-nombre").textContent = nombre; campo("conf-dpi").textContent = dpi;
    campo("conf-telefono").textContent = telefono; campo("conf-correo").textContent = correo;
    campo("conf-modelo").textContent = modelo; campo("conf-color").textContent = color;
    campo("conf-placa").textContent = placa; campo("form-registro").reset();
    ver("publica", "confirmacion");
}

// Comprobar el acceso
function iniciarSesion(evento) {
    evento.preventDefault();
    var correo = campo("login-correo").value.toLowerCase(), clave = campo("login-clave").value;
    var correcto = false;
    if (tipoAcceso == "admin") {
        if (correo == "admin" && clave == "2026") correcto = true;
        if (correcto) ver("admin", "panel");
    } else {
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].correo == correo && usuarios[i].clave == clave) {
                usuarioActual = usuarios[i]; correcto = true;
            }
        }
        if (correcto) ver("usuario", "cuenta");
    }
    if (correcto == false) {
        campo("login-mensaje").textContent = "Usuario o contrasena incorrectos.";
        campo("login-mensaje").hidden = false;
    }
    campo("login-clave").value = "";
}
function cerrarSesion() { usuarioActual = null; ver("publica", "inicio"); }

// Mostrar clientes que todavia no han ingresado
function cargarListaClientes() {
    campo("cliente-entrada").innerHTML = "<option value=''>Selecciona un cliente</option>";
    for (var i = 0; i < usuarios.length; i++) {
        var ocupado = false;
        for (var j = 0; j < dentro.length; j++) {
            if (dentro[j].correo == usuarios[i].correo) ocupado = true;
        }
        if (ocupado == false) {
            var opcion = document.createElement("option");
            opcion.value = usuarios[i].correo;
            opcion.textContent = usuarios[i].nombre + " - " + usuarios[i].placa;
            campo("cliente-entrada").appendChild(opcion);
        }
    }
}
function registrarEntrada(evento) {
    evento.preventDefault();
    var correo = campo("cliente-entrada").value;
    if (dentro.length >= capacidad) {
        campo("entrada-mensaje").textContent = "No hay espacios disponibles.";
        campo("entrada-mensaje").hidden = false; return;
    }
    for (var i = 0; i < usuarios.length; i++) {
        if (usuarios[i].correo == correo) {
            dentro.push({ nombre: usuarios[i].nombre, dpi: usuarios[i].dpi, correo: correo,
                placa: usuarios[i].placa, modelo: usuarios[i].modelo, color: usuarios[i].color,
                ingreso: new Date().toISOString() });
            guardarDatos(); ver("admin", "dentro"); return;
        }
    }
}

// Cobrar Q10 por cada hora iniciada
function calcularHoras(entrada, salida) {
    var minutos = (new Date(salida) - new Date(entrada)) / 60000;
    var horas = Math.ceil(minutos / 60);
    if (horas < 1) horas = 1;
    return horas;
}
function prepararSalida(indice) {
    indiceSalida = indice; horaSalida = new Date().toISOString();
    horasCobro = calcularHoras(dentro[indice].ingreso, horaSalida);
    campo("pago-cliente").textContent = dentro[indice].nombre;
    campo("pago-placa").textContent = dentro[indice].placa;
    campo("pago-horas").textContent = horasCobro;
    campo("pago-tiempo").textContent = horasCobro + " hora(s)";
    campo("pago-total").textContent = "Q" + (horasCobro * tarifa).toFixed(2);
    campo("panel-pago").hidden = false;
}
function confirmarPago(evento) {
    evento.preventDefault();
    if (indiceSalida == -1) return;
    var auto = dentro[indiceSalida];
    movimientos.push({ numero: movimientos.length + 1, nombre: auto.nombre, dpi: auto.dpi,
        correo: auto.correo, placa: auto.placa, modelo: auto.modelo, color: auto.color,
        ingreso: auto.ingreso, salida: horaSalida, horas: horasCobro, total: horasCobro * tarifa,
        metodo: campo("metodo-pago").value });
    dentro.splice(indiceSalida, 1); indiceSalida = -1;
    guardarDatos(); campo("panel-pago").hidden = true; ver("admin", "factura");
}
function cancelarPago() { indiceSalida = -1; campo("panel-pago").hidden = true; }

// Llenar las tablas
function llenarTabla(id, filas, columnas) {
    var cuerpo = campo(id); cuerpo.innerHTML = "";
    if (filas.length == 0) cuerpo.innerHTML = "<tr><td colspan='" + columnas + "'>No hay registros.</td></tr>";
    for (var i = 0; i < filas.length; i++) {
        var fila = cuerpo.insertRow();
        for (var j = 0; j < filas[i].length; j++) fila.insertCell().textContent = filas[i][j];
    }
}

// Mostrar una factura
function verFactura(id, correo) {
    var factura = null;
    for (var i = movimientos.length - 1; i >= 0; i--) {
        if (correo == "admin" || movimientos[i].correo == correo) { factura = movimientos[i]; break; }
    }
    var aviso = "admin-factura-vacia", boton = "admin-imprimir";
    if (correo != "admin") { aviso = "mi-factura-vacia"; boton = "mi-imprimir"; }
    campo(id).innerHTML = "";
    if (factura == null) {
        campo(id).hidden = true; campo(aviso).hidden = false; campo(boton).hidden = true;
    } else {
        var datos = ["Factura F-" + factura.numero, "Cliente: " + factura.nombre,
            "DPI: " + factura.dpi, "Placa: " + factura.placa,
            "Vehiculo: " + factura.modelo + " - " + factura.color,
            "Horas: " + factura.horas, "Metodo: " + factura.metodo,
            "Total pagado: Q" + factura.total.toFixed(2), "Estado: PAGADO"];
        var titulo = document.createElement("h3"); titulo.textContent = "PARQUEOS UMG";
        campo(id).appendChild(titulo);
        for (var j = 0; j < datos.length; j++) {
            var p = document.createElement("p"); p.textContent = datos[j]; campo(id).appendChild(p);
        }
        campo(id).hidden = false; campo(aviso).hidden = true; campo(boton).hidden = false;
    }
}

// Informacion que ve el administrador
function cargarAdmin(nombre) {
    var filas = [], i;
    if (nombre == "panel") {
        var ingresos = 0;
        for (i = 0; i < movimientos.length; i++) ingresos += movimientos[i].total;
        campo("total-capacidad").textContent = capacidad;
        campo("total-dentro").textContent = dentro.length;
        campo("total-libres").textContent = capacidad - dentro.length;
        campo("total-ingresos").textContent = "Q" + ingresos.toFixed(2);
        for (i = 0; i < dentro.length; i++) filas.push([dentro[i].placa, dentro[i].nombre,
            dentro[i].modelo, new Date(dentro[i].ingreso).toLocaleString()]);
        llenarTabla("resumen-dentro", filas, 4);
    }
    if (nombre == "entrada") cargarListaClientes();
    if (nombre == "dentro") {
        campo("tabla-dentro").innerHTML = "";
        for (i = 0; i < dentro.length; i++) {
            var fila = campo("tabla-dentro").insertRow();
            fila.insertCell().textContent = dentro[i].placa;
            fila.insertCell().textContent = dentro[i].nombre;
            fila.insertCell().textContent = dentro[i].modelo;
            fila.insertCell().textContent = new Date(dentro[i].ingreso).toLocaleString();
            fila.insertCell().innerHTML = "<button onclick='prepararSalida(" + i + ")'>Registrar salida</button>";
        }
        if (dentro.length == 0) llenarTabla("tabla-dentro", [], 5);
    }
    if (nombre == "clientes") {
        for (i = 0; i < usuarios.length; i++) filas.push([usuarios[i].nombre, usuarios[i].dpi,
            usuarios[i].telefono, usuarios[i].correo, usuarios[i].placa, usuarios[i].modelo]);
        llenarTabla("tabla-clientes", filas, 6);
    }
    if (nombre == "movimientos") {
        for (i = movimientos.length - 1; i >= 0; i--) filas.push([
            new Date(movimientos[i].salida).toLocaleString(), movimientos[i].nombre, movimientos[i].placa,
            new Date(movimientos[i].ingreso).toLocaleString(), new Date(movimientos[i].salida).toLocaleString(),
            movimientos[i].horas + " hora(s)", "Q" + movimientos[i].total.toFixed(2)]);
        llenarTabla("tabla-movimientos", filas, 7);
    }
    if (nombre == "factura") verFactura("admin-factura-caja", "admin");
}

// Informacion que ve el usuario
function cargarUsuario(nombre) {
    campo("mi-nombre").textContent = usuarioActual.nombre;
    campo("mi-dpi").textContent = usuarioActual.dpi;
    campo("mi-telefono").textContent = usuarioActual.telefono;
    campo("mi-correo").textContent = usuarioActual.correo;
    campo("mi-vehiculo").textContent = usuarioActual.modelo + " - " + usuarioActual.color;
    campo("mi-placa").textContent = usuarioActual.placa;
    campo("mi-disponibles").textContent = capacidad - dentro.length;

    if (nombre == "estacionamiento") {
        var encontrado = false;
        campo("detalle-estacionamiento").hidden = true; campo("sin-estacionamiento").hidden = false;
        for (var i = 0; i < dentro.length; i++) {
            if (dentro[i].correo == usuarioActual.correo) {
                encontrado = true;
                var horas = calcularHoras(dentro[i].ingreso, new Date());
                campo("mi-placa-dentro").textContent = dentro[i].placa;
                campo("mi-ingreso").textContent = new Date(dentro[i].ingreso).toLocaleString();
                campo("mi-tiempo").textContent = horas + " hora(s)";
                campo("mi-estimado").textContent = "Q" + (horas * tarifa).toFixed(2);
            }
        }
        campo("detalle-estacionamiento").hidden = !encontrado;
        campo("sin-estacionamiento").hidden = encontrado;
    }
    if (nombre == "movimientos") {
        var filas = [];
        for (var j = movimientos.length - 1; j >= 0; j--) {
            if (movimientos[j].correo == usuarioActual.correo) filas.push([
                new Date(movimientos[j].salida).toLocaleString(), movimientos[j].placa,
                new Date(movimientos[j].ingreso).toLocaleString(), new Date(movimientos[j].salida).toLocaleString(),
                movimientos[j].horas + " hora(s)", "Q" + movimientos[j].total.toFixed(2)]);
        }
        llenarTabla("mis-movimientos", filas, 6);
    }
    if (nombre == "factura") verFactura("mi-factura-caja", usuarioActual.correo);
}

cargarDatos();
ver("publica", "inicio");
seleccionarTipo("usuario");
