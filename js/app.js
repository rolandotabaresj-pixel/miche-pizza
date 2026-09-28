import { productsData, preciosBordesData } from './productos.js';

const spwa = {
    history: ['step-1'], 
    currentFlavorContext: '', 
    currentStyleChoice: '', 
    choices: {
        size: { name: '', price: 0, portions: 0 },
        style: '',
        flavor1: { id: 0, name: '', img: '' },
        flavor2: { id: 0, name: '', img: '' },
        bebida: { name: '', price: 0 },
        border: { name: 'Sin Borde Adicional', price: 0 }
    },
    
    elements: {
        progressHeader: document.getElementById('spwa-progress-header'),
        progressBarFill: document.getElementById('spwa-progress-bar-fill'),
        btnVolver: document.getElementById('btn-volver'),
        panels: {
            'step-1': document.getElementById('step-1'),
            'step-2': document.getElementById('step-2'),
            'step-catalog': document.getElementById('step-catalog'),
            'step-bebidas': document.getElementById('step-bebidas'),
            'step-final': document.getElementById('step-final')
        },
        panelCatalogoTitle: document.getElementById('flavor-progress-title'),
        panelCatalogoChosenFlavorBanner: document.getElementById('flavor-chosen-banner'),
        panelCatalogoGrid: document.getElementById('catalog-flavor-grid'),
        panelFinalLargeCard: document.getElementById('step-final-large-card'),
        panelFinalLargeCardImg: document.getElementById('final-card-img'),
        panelFinalLargeCardPortions: document.getElementById('final-card-portions'),
        panelFinalBtnAddCart: document.getElementById('btn-add-cart-final')
    },

    init: function() {
        this.bindEvents();
        this.renderCatalog(); 
    },

    bindEvents: function() {
        this.elements.btnVolver.addEventListener('click', () => this.goBack());

        const sizeCards = this.elements.panels['step-1'].querySelectorAll('.large-card');
        sizeCards.forEach(card => {
            card.addEventListener('click', () => {
                this.choices.size = {
                    name: card.dataset.size,
                    price: parseInt(card.dataset.price),
                    portions: parseInt(card.dataset.portions)
                };
                this.advanceTo('step-2');
            });
        });

        const styleCards = this.elements.panels['step-2'].querySelectorAll('.binary-card');
        styleCards.forEach(card => {
            card.addEventListener('click', () => {
                this.choices.style = card.dataset.style;
                this.currentStyleChoice = this.choices.style;
                this.currentFlavorContext = this.choices.style === 'Mitad y Mitad / Combinada' ? 'Mitad 1' : '';
                
                this.updateProgressTitle();
                this.advanceTo('step-catalog'); 
            });
        });

        const bebidaCards = this.elements.panels['step-bebidas'].querySelectorAll('.large-card');
        bebidaCards.forEach(card => {
            card.addEventListener('click', () => {
                this.choices.bebida = {
                    name: card.dataset.bebida,
                    price: parseInt(card.dataset.price)
                };
                this.advanceTo('step-final');
            });
        });

        this.elements.panelFinalBtnAddCart.addEventListener('click', () => {
            this.finalizeOrderAndAddToCart();
        });
    },

    getCurrentStep: function() {
        return this.history[this.history.length - 1];
    },

    advanceTo: function(nextStepId) {
        const currentStep = this.getCurrentStep();
        this.elements.panels[currentStep].classList.remove('activo');
        
        this.history.push(nextStepId);
        this.triggerStepUI(nextStepId);
    },

    goBack: function() {
        if (this.history.length <= 1) return;

        const currentStep = this.history.pop();
        this.elements.panels[currentStep].classList.remove('activo');
        
        const previousStep = this.getCurrentStep();
        
        if (currentStep === 'step-catalog' && previousStep === 'step-catalog') {
            this.currentFlavorContext = 'Mitad 1';
            this.updateProgressTitle();
        }

        this.triggerStepUI(previousStep);
    },

    triggerStepUI: function(stepId) {
        this.updateProgressBar(stepId);

        if (stepId === 'step-1') {
            this.elements.progressHeader.classList.add('is-hidden');
        } else {
            this.elements.progressHeader.classList.remove('is-hidden');
        }

        if (stepId === 'step-catalog') {
            this.updateCatalogStepUI();
        } else if (stepId === 'step-final') {
            this.loadFinalStepUI();
        }

        setTimeout(() => {
            this.elements.panels[stepId].classList.add('activo');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);
    },

    updateProgressBar: function(stepId) {
        let progress = 0;
        if (stepId === 'step-2') progress = 20;
        if (stepId === 'step-catalog') progress = this.currentFlavorContext === 'Mitad 2' ? 60 : 40;
        if (stepId === 'step-bebidas') progress = 80;
        if (stepId === 'step-final') progress = 100;
        
        this.elements.progressBarFill.style.width = `${progress}%`;
    },

    updateProgressTitle: function() {
        if (this.currentStyleChoice === 'Mitad y Mitad / Combinada') {
            if (this.currentFlavorContext === 'Mitad 1') {
                this.elements.panelCatalogoTitle.textContent = "Elige tu Primer Sabor";
                this.elements.panelCatalogoChosenFlavorBanner.style.display = "none";
            } else {
                this.elements.panelCatalogoTitle.textContent = "Elige tu Segundo Sabor";
                this.elements.panelCatalogoChosenFlavorBanner.style.display = "block";
                this.elements.panelCatalogoChosenFlavorBanner.textContent = `Sabor 1: ${this.choices.flavor1.name}`;
            }
        } else {
            this.elements.panelCatalogoTitle.textContent = "Elige tu Sabor Único";
            this.elements.panelCatalogoChosenFlavorBanner.style.display = "none";
        }
    },

    renderCatalog: function() {
        this.elements.panelCatalogoGrid.innerHTML = productsData.map(prod => {
            const isAgotado = prod.nombre.toLowerCase() === 'salami';
            const disabledAttr = isAgotado ? 'disabled style="background-color: #cccccc; cursor: not-allowed; opacity: 0.7;"' : '';
            const btnText = isAgotado ? 'Agotado' : 'Elegir sabor';

            return `
                <article class="tarjeta-producto">
                <div class="tarjeta-producto-imagen-contenedor">    
                    <img src="${prod.img}" alt="${prod.nombre}" loading="lazy"></div>               
                    <h3>${prod.nombre}</h3>
                    <p class="ingredientes"><strong>Ingredientes:</strong> ${prod.ingredientes}</p>
                    <button type="button" id="btn-flavor-${prod.id}" ${disabledAttr}>${btnText}</button>
                </article>
            `;
        }).join('');

        productsData.forEach(prod => {
            if (prod.nombre.toLowerCase() !== 'salami') {
                document.getElementById(`btn-flavor-${prod.id}`).addEventListener('click', () => {
                    this.handleFlavorSelection(prod.id, prod.nombre, prod.img);
                });
            }
        });
    },

    updateCatalogStepUI: function() {
        productsData.forEach(prod => {
            const btn = document.getElementById(`btn-flavor-${prod.id}`);
            if (!btn) return;

            if (prod.nombre.toLowerCase() === 'salami') {
                btn.textContent = "Agotada";
                btn.disabled = true;
                return;
            }

            if (this.currentStyleChoice === 'Mitad y Mitad / Combinada') {
                if (this.currentFlavorContext === 'Mitad 1') {
                    btn.textContent = "Elegir como Mitad 1";
                    btn.classList.add('Mitad-1-Context');
                } else {
                    btn.textContent = "Combinar y Continuar";
                    btn.classList.remove('Mitad-1-Context');
                }
            } else {
                btn.textContent = "Elegir sabor y continuar";
                btn.classList.remove('Mitad-1-Context');
            }
        });
    },

    handleFlavorSelection: function(flavorId, flavorName, flavorImg) {
        if (this.currentStyleChoice === 'Mitad y Mitad / Combinada') {
            if (this.currentFlavorContext === 'Mitad 1') {
                this.choices.flavor1 = { id: flavorId, name: flavorName, img: flavorImg };
                this.currentFlavorContext = 'Mitad 2';
                this.updateProgressTitle();
                this.advanceTo('step-catalog'); 
            } else {
                this.choices.flavor2 = { id: flavorId, name: flavorName, img: flavorImg };
                this.advanceTo('step-bebidas');
            }
        } else {
            this.choices.flavor1 = { id: flavorId, name: flavorName, img: flavorImg };
            this.advanceTo('step-bebidas');
        }
    },

    loadFinalStepUI: function() {
        this.loadDynamicBorderPricesSPWA();
        const portionsText = this.elements.panelFinalLargeCardPortions;
        
        if (this.choices.style === 'Mitad y Mitad / Combinada') {
            this.elements.panelFinalLargeCardImg.src = "assets/borde.jpeg";
            portionsText.innerHTML = `Mitad 1: ${this.choices.flavor1.name} <br> Mitad 2: ${this.choices.flavor2.name}`;
            portionsText.classList.remove('is-hidden');
            portionsText.classList.add('final-card-portions-text');
        } else {
            this.elements.panelFinalLargeCardImg.src = "assets/borde.jpeg";
            portionsText.classList.add('is-hidden');
            portionsText.classList.remove('final-card-portions-text');
        }
        
        this.elements.panelFinalLargeCard.classList.remove('is-hidden');
    },

    loadDynamicBorderPricesSPWA: function() {
        const borderPrice = preciosBordesData[this.choices.size.name] || 8000; 
        const formattedPrice = `+${formatoMonedaColombiaUnified.format(borderPrice)}`;
        
        const elQueso = document.getElementById('price-borde-queso-spwa');
        const elBocadillo = document.getElementById('price-borde-bocadillo-spwa');
        const elArequipe = document.getElementById('price-borde-arequipe-spwa');

        if (elQueso) elQueso.textContent = formattedPrice;
        if (elBocadillo) elBocadillo.textContent = formattedPrice;
        if (elArequipe) elArequipe.textContent = formattedPrice;
        
        const borderRadios = document.querySelectorAll('input[name="borde-final-spwa"]');
        borderRadios.forEach(radio => {
            radio.dataset.price = radio.value === 'Sin Borde Adicional' ? 0 : borderPrice;
        });
    },

    finalizeOrderAndAddToCart: function() {
        const borderRadiosSPWA = document.querySelectorAll('input[name="borde-final-spwa"]');
        let borderChoice = { name: 'Sin Borde Adicional', price: 0 };

        borderRadiosSPWA.forEach(radio => {
            if (radio.checked) {
                borderChoice.name = radio.value;
                borderChoice.price = parseInt(radio.dataset.price);
            }
        });
        
        this.choices.border = borderChoice;
        
        let finalPizzaName = this.choices.style === 'Mitad y Mitad / Combinada' 
            ? `Pizza Combinada: [ M1: ${this.choices.flavor1.name} / M2: ${this.choices.flavor2.name} ]`
            : `Pizza: [ Sabor: ${this.choices.flavor1.name} ]`;
        
        const pizzaItem = {
            key: `${this.choices.flavor1.id}-${this.choices.flavor2.id}-${this.choices.size.name}-${this.choices.border.name}`,
            nombre: finalPizzaName,
            tamano: this.choices.size.name,
            portions: this.choices.size.portions,
            borde: this.choices.border.name,
            precio: this.choices.size.price + this.choices.border.price,
            cantidad: 1
        };
        
        spwaAddToCartUnified(pizzaItem);

        if (this.choices.bebida && this.choices.bebida.price > 0) {
            const bebidaItem = {
                key: `bebida-${this.choices.bebida.name.replace(/\s+/g, '-')}`,
                nombre: `Bebida: ${this.choices.bebida.name}`,
                tamano: '1.5 Litros',
                portions: '-',
                borde: '',
                precio: this.choices.bebida.price,
                cantidad: 1
            };
            spwaAddToCartUnified(bebidaItem);
        }

        this.resetSPWA();
    },

    resetSPWA: function() {
        this.elements.panels[this.getCurrentStep()].classList.remove('activo');
        
        this.history = ['step-1'];
        this.currentFlavorContext = ''; 
        this.currentStyleChoice = ''; 
        this.choices.bebida = { name: '', price: 0 };
        
        const borderRadiosSPWA = document.querySelectorAll('input[name="borde-final-spwa"]');
        borderRadiosSPWA.forEach(radio => radio.checked = radio.value === 'Sin Borde Adicional');
        
        this.triggerStepUI('step-1');
    }
};

spwa.init();

/* =========================================
   LÓGICA DEL CARRITO UNIFICADO Y WHATSAPP
   ========================================= */
let carrito = [];
let costoDomicilio = 0;
const formatoMonedaColombiaUnified = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

window.spwaAddToCartUnified = (itemToAdd) => {
    const itemEnCarrito = carrito.find(item => item.key === itemToAdd.key);
    if (itemEnCarrito) { 
        itemEnCarrito.cantidad++; 
    } else { 
        carrito.push(itemToAdd); 
    }
    actualizarCarritoUnifiedUI();
    abrirCarrito();
};

window.cambiarCantidadUnified = (key, delta) => {
    const item = carrito.find(i => i.key === key);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.key !== key);
    }
    actualizarCarritoUnifiedUI();
};

function actualizarCarritoUnifiedUI() {
    const contenedorItems = document.getElementById('items-carrito');
    const subtotalElemento = document.getElementById('subtotal-carrito');
    const domicilioElemento = document.getElementById('domicilio-carrito');
    const totalElementoUnified = document.getElementById('total-carrito');
    const btnBurbujaContador = document.getElementById('contador-burbuja');

    let subtotalCompra = 0;
    let cantidadTotalCompra = 0;

    contenedorItems.innerHTML = carrito.map(item => {
        const subtotalItemUnified = item.precio * item.cantidad;
        subtotalCompra += subtotalItemUnified;
        cantidadTotalCompra += item.cantidad;
        
        let adicBordeHtml = (item.borde && item.borde !== 'Sin Borde Adicional') ? `<p style="color:#D32F2F; font-size:0.75rem;">+ ${item.borde}</p>` : '';

        return `
            <div class="item-carrito">
                <div class="item-info">
                    <h4>${item.nombre}</h4>
                    <p>${item.tamano} (${item.portions} porciones)</p>
                    ${adicBordeHtml}
                    <p>${formatoMonedaColombiaUnified.format(item.precio)} c/u</p>
                    <div class="item-controles">
                        <button type="button" onclick="window.cambiarCantidadUnified('${item.key}', -1)">-</button>
                        <span style="margin: 0 8px; font-weight: 600;">${item.cantidad}</span>
                        <button type="button" onclick="window.cambiarCantidadUnified('${item.key}', 1)">+</button>
                    </div>
                </div>
                <div class="item-subtotal">${formatoMonedaColombiaUnified.format(subtotalItemUnified)}</div>
            </div>
        `;
    }).join('');

    let totalCompra = subtotalCompra + costoDomicilio;

    subtotalElemento.textContent = formatoMonedaColombiaUnified.format(subtotalCompra);
    domicilioElemento.textContent = formatoMonedaColombiaUnified.format(costoDomicilio);
    totalElementoUnified.textContent = formatoMonedaColombiaUnified.format(totalCompra);
    btnBurbujaContador.textContent = cantidadTotalCompra;
    
    spwaValidarFormulario();
}

const sidebarElemento = document.getElementById('sidebar-carrito');
window.abrirCarrito = () => sidebarElemento.classList.add('activo');
window.cerrarCarrito = () => sidebarElemento.classList.remove('activo');

// --- REFERENCIAS DEL FORMULARIO ---
const inputNombreCliente = document.getElementById('cliente-nombre');
const selectTipoEntrega = document.getElementById('cliente-tipo-entrega');
const contenedorDomicilio = document.getElementById('contenedor-domicilio');
const selectBarrioCliente = document.getElementById('cliente-barrio');
const inputDireccionCliente = document.getElementById('cliente-direccion');
const selectMetodoPago = document.getElementById('cliente-metodo-pago');
const containerEfectivo = document.getElementById('pago-efectivo-container');
const containerTransferencia = document.getElementById('pago-transferencia-container');
const inputMontoEfectivo = document.getElementById('cliente-monto-efectivo');
const btnPagarWhatsApp = document.getElementById('btn-pagar');

// --- EVENT LISTENERS DE FORMULARIO ---
selectTipoEntrega.addEventListener('change', (e) => {
    if (e.target.value === 'Recoger') {
        contenedorDomicilio.classList.add('is-hidden');
        costoDomicilio = 0;
    } else {
        contenedorDomicilio.classList.remove('is-hidden');
        const opcionSeleccionada = selectBarrioCliente.options[selectBarrioCliente.selectedIndex];
        costoDomicilio = opcionSeleccionada && !opcionSeleccionada.disabled ? (parseInt(opcionSeleccionada.dataset.precio) || 0) : 0;
    }
    actualizarCarritoUnifiedUI();
});

selectBarrioCliente.addEventListener('change', (e) => {
    const opcionSeleccionada = e.target.options[e.target.selectedIndex];
    costoDomicilio = parseInt(opcionSeleccionada.dataset.precio) || 0;
    actualizarCarritoUnifiedUI(); 
});

selectMetodoPago.addEventListener('change', (e) => {
    const metodo = e.target.value;
    if (metodo === 'Efectivo') {
        containerEfectivo.classList.remove('is-hidden');
        containerTransferencia.classList.add('is-hidden');
    } else if (metodo === 'Transferencia') {
        containerTransferencia.classList.remove('is-hidden');
        containerEfectivo.classList.add('is-hidden');
    }
    spwaValidarFormulario();
});

inputMontoEfectivo.addEventListener('input', spwaValidarFormulario);
inputMontoEfectivo.addEventListener('change', spwaValidarFormulario);
inputDireccionCliente.addEventListener('input', spwaValidarFormulario);

inputNombreCliente.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    spwaValidarFormulario();
});

function spwaValidarFormulario() {
    let nombreValido = inputNombreCliente.value.trim().length >= 3;
    let tipoEntregaValido = selectTipoEntrega.value !== '';
    let carritoLleno = carrito.length > 0;
    
    let barrioValido = true;
    let direccionValida = true;

    if (selectTipoEntrega.value === 'Domicilio') {
        barrioValido = selectBarrioCliente.value !== '';
        direccionValida = inputDireccionCliente.value.trim() !== '';
    }

    let subtotalActual = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    let totalPagarActual = subtotalActual + costoDomicilio;

    let pagoValido = false;
    if (selectMetodoPago.value === 'Transferencia') {
        pagoValido = true;
    } else if (selectMetodoPago.value === 'Efectivo') {
        const montoIngresado = parseFloat(inputMontoEfectivo.value) || 0;
        pagoValido = montoIngresado >= totalPagarActual;
    }

    btnPagarWhatsApp.disabled = !(nombreValido && tipoEntregaValido && barrioValido && direccionValida && carritoLleno && pagoValido);
}

// =========================================
// TIQUET DE CONFIRMACIÓN PREVIO A WHATSAPP
// =========================================
function spwaPintarTiquetModal() {
    const contenedor = document.getElementById('tiquet-detalles');
    const totales = document.getElementById('tiquet-totales');
    if (!contenedor || !totales) return;

    let subtotal = 0;
    let htmlProductos = '';

    carrito.forEach(item => {
        const subtotalItem = item.precio * item.cantidad;
        subtotal += subtotalItem;
        
        htmlProductos += `
            <div class="tiquet-item">
                <span><strong>${item.cantidad}x</strong> ${item.nombre}</span>
                <span>${formatoMonedaColombiaUnified.format(subtotalItem)}</span>
            </div>
            <div class="tiquet-item-sub">• Tamaño: ${item.tamano}</div>
        `;
        if (item.borde && item.borde !== 'Sin Borde Adicional') {
            htmlProductos += `<div class="tiquet-item-sub">• Borde: ${item.borde}</div>`;
        }
    });

    contenedor.innerHTML = htmlProductos;

    let costoEnvio = (selectTipoEntrega.value === 'Domicilio') ? costoDomicilio : 0;
    let totalPagar = subtotal + costoEnvio;

    let metodoPagoTexto = selectMetodoPago.value;
    if (selectMetodoPago.value === 'Efectivo') {
        const montoIngresado = parseFloat(inputMontoEfectivo.value) || 0;
        const cambio = montoIngresado - totalPagar;
        metodoPagoTexto += ` (Paga con: ${formatoMonedaColombiaUnified.format(montoIngresado)} | Cambio: ${cambio >= 0 ? formatoMonedaColombiaUnified.format(cambio) : '$0'})`;
    }

    totales.innerHTML = `
        <div class="tiquet-item"><span>Subtotal:</span> <span>${formatoMonedaColombiaUnified.format(subtotal)}</span></div>
        ${selectTipoEntrega.value === 'Domicilio' ? `<div class="tiquet-item"><span>Domicilio (${selectBarrioCliente.value}):</span> <span>${formatoMonedaColombiaUnified.format(costoEnvio)}</span></div>` : ''}
        <div class="tiquet-item" style="font-size: 1.05rem; margin-top: 0.3rem;"><strong>TOTAL:</strong> <strong>${formatoMonedaColombiaUnified.format(totalPagar)}</strong></div>
        <div class="tiquet-linea">---------------------------------</div>
        <div class="tiquet-item"><span>Cliente:</span> <span>${inputNombreCliente.value.trim()}</span></div>
        <div class="tiquet-item"><span>Entrega:</span> <span>${selectTipoEntrega.value === 'Recoger' ? 'Recoger en tienda' : 'Domicilio'}</span></div>
        ${selectTipoEntrega.value === 'Domicilio' ? `<div class="tiquet-item-sub">📍 Dir: ${inputDireccionCliente.value.trim()} (${selectBarrioCliente.value})</div>` : ''}
        <div class="tiquet-item-sub">💳 Pago: ${metodoPagoTexto}</div>
    `;
}

window.enviarWhatsApp = () => {
    let subtotal = 0;
    let mensaje = `🍕 *NUEVO PEDIDO - MICHE PIZZA* 🍕\n\n*Cliente:* ${inputNombreCliente.value.trim()}\n`;

    if (selectTipoEntrega.value === 'Recoger') {
        mensaje += `*Entrega:* 🏪 Pasará a recoger en tienda\n\n`;
    } else {
        mensaje += `*Entrega:* 🛵 Domicilio\n*Dirección:* ${inputDireccionCliente.value.trim()} (${selectBarrioCliente.value})\n\n`;
    }

    mensaje += `*Detalle de la Orden:*\n`;

    carrito.forEach(item => {
        const subtotalItem = item.precio * item.cantidad;
        subtotal += subtotalItem;
        mensaje += `- ${item.cantidad}x ${item.nombre} (${item.tamano})\n`;
        if (item.borde && item.borde !== 'Sin Borde Adicional') mensaje += `  ✨ Adición: ${item.borde}\n`;
        mensaje += `  Subtotal: ${formatoMonedaColombiaUnified.format(subtotalItem)}\n`;
    });

    let totalPagar = subtotal + costoDomicilio;

    if (selectTipoEntrega.value === 'Domicilio') {
        mensaje += `\n*Subtotal Pizzas:* ${formatoMonedaColombiaUnified.format(subtotal)}`;
        mensaje += `\n*Domicilio (${selectBarrioCliente.value}):* ${formatoMonedaColombiaUnified.format(costoDomicilio)}`;
    }
    mensaje += `\n*TOTAL A PAGAR: ${formatoMonedaColombiaUnified.format(totalPagar)}*\n`;
    
    mensaje += `\n*Método de Pago:* ${selectMetodoPago.value}`;
    if (selectMetodoPago.value === 'Efectivo') {
        const montoEfectivo = parseFloat(inputMontoEfectivo.value) || 0;
        const cambio = montoEfectivo - totalPagar;
        mensaje += `\n*Paga con:* ${formatoMonedaColombiaUnified.format(montoEfectivo)}`;
        mensaje += `\n*Cambio a llevar:* ${cambio >= 0 ? formatoMonedaColombiaUnified.format(cambio) : 'Pendiente'}`;
    } else {
        mensaje += `\n*(Comprobante adjunto en el chat)*`;
    }

    window.open(`https://wa.me/573137416559?text=${encodeURIComponent(mensaje)}`, '_blank');
};

// --- APERTURA Y CIERRE DEL CARRITO ---
document.getElementById('btn-carrito-global').addEventListener('click', abrirCarrito);
document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);

// --- INTERCEPTOR PRINCIPAL DEL BOTON (NUEVO CONTROL DINÁMICO) ---
btnPagarWhatsApp.addEventListener('click', (e) => {
    e.preventDefault();
    if (btnPagarWhatsApp.disabled) return;
    
    try {
        // En lugar de usar variables guardadas arriba, buscamos el tiquet dinámicamente en este instante
        const modal = document.getElementById('modal-tiquet');
        const btnConfirmar = document.getElementById('btn-tiquet-confirmar');
        const btnCorregir = document.getElementById('btn-tiquet-corregir');

        // Si falta algo en el HTML, abrimos WhatsApp de una vez
        if (!modal || !btnConfirmar || !btnCorregir) {
            console.warn("No se detectó el HTML del Tiquet. Enviando directamente.");
            window.enviarWhatsApp();
            return;
        }

        // Llenar los datos del recibo
        spwaPintarTiquetModal();

        // Asignar comportamiento a los botones del Tiquet
        btnCorregir.onclick = function() {
            modal.classList.add('is-hidden');
            abrirCarrito();
        };

        btnConfirmar.onclick = function() {
            modal.classList.add('is-hidden');
            window.enviarWhatsApp();
        };

        // Mostrar Tiquet en pantalla
        cerrarCarrito();
        modal.classList.remove('is-hidden');

    } catch (error) {
        console.error("Fallo inesperado al mostrar tiquet:", error);
        window.enviarWhatsApp(); // Respaldo máximo de seguridad
    }
});
