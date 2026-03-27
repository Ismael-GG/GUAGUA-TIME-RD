let datosApp = { sectores: [], rutas: [], config_alertas: [] };


document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    
    const btnBuscar = document.getElementById('btnBuscar');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', buscarRutas);
    }


    mostrarFavoritos();
});

async function cargarDatos() {
    try {
    
        const respuesta = await fetch('datos.json');
        if (!respuesta.ok) throw new Error("Archivo datos.json no encontrado");
        
        datosApp = await respuesta.json();
        
       
        const selectO = document.getElementById('origen');
        const selectD = document.getElementById('destino');
        
        if (selectO && selectD) {
            datosApp.sectores.sort().forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                selectO.appendChild(opt.cloneNode(true));
                selectD.appendChild(opt);
            });
            console.log("✅ Datos cargados y selectores listos");
        }
    } catch (error) {
        console.error("❌ Error de carga:", error);
    }
}


function buscarRutas() {
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;

    if (!origen || !destino) {
        alert("Por favor, selecciona origen y destino.");
        return;
    }

    const filtradas = datosApp.rutas.filter(r => 
        r.origen === origen && r.destino === destino
    );

    let pctTiempoExtra = 0;
    let costoExtraTotal = 0;

    document.querySelectorAll('.alerta:checked').forEach(check => {

        const alertaInfo = datosApp.config_alertas.find(a => 
            check.parentElement.textContent.includes(a.nombre)
        );
        
        if (alertaInfo) {
            pctTiempoExtra += alertaInfo.pct;
            costoExtraTotal += (alertaInfo.costo_extra || 0);
        }
    });

    const lluviaActiva = Array.from(document.querySelectorAll('.alerta:checked'))
                              .some(check => check.parentElement.textContent.includes("Lluvia"));

    const resultadosCalculados = filtradas.map(r => {

        const tiempoFinal = Math.round(r.tiempo_base * (1 + pctTiempoExtra / 100));
        
        let costoFinal = r.costo_base;

        if (r.tipo === "Motoconcho" && lluviaActiva) {
            costoFinal = r.costo_base + 50;
        } else {
            
            costoFinal = r.costo_base + costoExtraTotal;
        }

        return { ...r, tiempoFinal, costoFinal };
    });

    
    resultadosCalculados.sort((a, b) => a.tiempoFinal - b.tiempoFinal);

    renderizarRutas(resultadosCalculados);
}

function renderizarRutas(lista) {
    const contenedor = document.getElementById('lista-rutas');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<p style="color:red; padding:10px;">No hay rutas disponibles para este trayecto.</p>';
        return;
    }

    lista.forEach(r => {
        const div = document.createElement('div');
        div.className = 'ruta-card';
        div.innerHTML = `
            <div style="border-bottom: 1px solid #eee; margin-bottom: 8px;">
                <strong style="color:#004a99;">${r.nombre}</strong> <small>(${r.tipo})</small>
            </div>
            <p>⏱️ Tiempo: <strong>${r.tiempoFinal} mins</strong></p>
            <p>💰 Costo: <strong>RD$ ${r.costoFinal}</strong></p>
            <button onclick="guardarFav(${r.id})" style="background:#ffcc00; color:black; font-size:12px;">⭐ Favorito</button>
        `;
        contenedor.appendChild(div);
    });
}

window.guardarFav = function(id) {
    let favs = JSON.parse(localStorage.getItem('guagua_favs')) || [];
    
    if (!favs.includes(id)) {
        favs.push(id);
        localStorage.setItem('guagua_favs', JSON.stringify(favs));
        alert("Guardado en favoritos localmente.");
        mostrarFavoritos();
    } else {
        alert("Ya está en tus favoritos.");
    }
};

function mostrarFavoritos() {
    const contenedorFavs = document.getElementById('lista-favoritos');
    if (!contenedorFavs) return;

    const favIds = JSON.parse(localStorage.getItem('guagua_favs')) || [];
    contenedorFavs.innerHTML = '';

    if (favIds.length === 0) {
        contenedorFavs.innerHTML = '<p><small>No tienes rutas favoritas aún.</small></p>';
        return;
    }

    favIds.forEach(id => {
        const r = datosApp.rutas.find(ruta => ruta.id === id);
        if (r) {
            const item = document.createElement('div');
            item.style = "font-size: 13px; border-bottom: 1px dashed #ccc; padding: 5px 0;";
            item.innerHTML = `📍 ${r.nombre} (${r.origen} -> ${r.destino})`;
            contenedorFavs.appendChild(item);
        }
    });
}