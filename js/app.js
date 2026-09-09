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
        bebida: { name: '', price: 0 }, // <-- NUEVO ESTADO PARA LA BEBIDA
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
            'step-bebidas': document.getElementById('step-bebidas'), // <-- REGISTRO DEL NUEVO PANEL
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

        // NUEVO: Escuchar clics en el paso de bebidas
        const bebidaCards = this.elements.panels['step-bebidas'].querySelectorAll('.large-card');
        bebidaCards.forEach(card => {
            card.addEventListener('click', () => {
                this.choices.bebida = {
                    name: card.dataset.bebida,
                    price: parseInt(card.dataset.price)
                };
                this.advanceTo('step-final'); // Después de la bebida, va al borde final
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
        if (stepId === 'step-bebidas') progress = 80; // <-- NUEVO PROGRESO
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
            return `
                <article class="tarjeta-producto">
                <div class="tarjeta-producto-imagen-contenedor">    
                    <img src="${prod.img}" alt="${prod.nombre}" loading="lazy"></div>               
                    <h3>${prod.nombre}</h3>
                    <p class="ingredientes"><strong>Ingredientes:</strong> ${prod.ingredientes}</p>
                    <button id="btn-flavor-${prod.id}">Elegir sabor</button>
                </article>
            `;
        }).join('');

        productsData.forEach(prod => {
            document.getElementById(`btn-flavor-${prod.id}`).addEventListener('click', () => {
                this.handleFlavorSelection(prod.id, prod.nombre, prod.img);
            });
        });
    },

    updateCatalogStepUI: function() {
        const flavorButtons = this.elements.panelCatalogoGrid.querySelectorAll('button');
        
        if (this.currentStyleChoice === 'Mitad y Mitad / Combinada') {
            if (this.currentFlavorContext === 'Mitad 1') {
                flavorButtons.forEach(btn => {
                    btn.textContent = "Elegir como Mitad 1";
                    btn.classList.add('Mitad-1-Context');
                });
            } else {
                flavorButtons.forEach(btn => {
                    btn.textContent = "Combinar y Continuar";
                    btn.classList.remove('Mitad-1-Context');
                });
            }
        } else {
            flavorButtons.forEach(btn => {
                btn.textContent = "Elegir sabor y continuar";
                btn.classList.remove('Mitad-1-Context');
            });
        }
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
                this.advanceTo('step-bebidas'); // <-- CAMBIO: Ahora va a bebidas
            }
        } else {
            this.choices.flavor1 = { id: flavorId, name: flavorName, img: flavorImg };
            this.advanceTo('step-bebidas'); // <-- CAMBIO: Ahora va a bebidas
        }
    },

    loadFinalStepUI: function() {
        this.loadDynamicBorderPricesSPWA();
        const portionsText = this.elements.panelFinalLargeCardPortions;
        
        if (this.choices.style === 'Mitad y Mitad / Combinada') {
            this.elements.panelFinalLargeCardImg.src = "https://images.unsplash.com/photo-1548369937-47519962c11a?auto=format&fit=crop&w=600&q=80";
            portionsText.innerHTML = `Mitad 1: ${this.choices.flavor1.name} <br> Mitad 2: ${this.choices.flavor2.name}`;
            portionsText.classList.remove('is-hidden');
            portionsText.classList.add('final-card-portions-text');
        } else {
            this.elements.panelFinalLargeCardImg.src = this.choices.flavor1.img;
            portionsText.classList.add('is-hidden');
            portionsText.classList.remove('final-card-portions-text');
        }
        
        this.elements.panelFinalLargeCard.classList.remove('is-hidden');
    },

    loadDynamicBorderPricesSPWA: function() {
        const borderPrice = preciosBordesData[this.choices.size.name] || 8000; 
        const formattedPrice = `+${formatoMonedaColombiaUnified.format(borderPrice)}`;
        
        document.getElementById('price-borde-queso-spwa').textContent = formattedPrice;
        document.getElementById('price-borde-bocadillo-spwa').textContent = formattedPrice;
        document.getElementById('price-borde-arequipe-spwa').textContent = formattedPrice;
        
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
        
        // 1. Agregar la pizza al carrito
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

        // 2. NUEVO: Agregar la bebida como un ítem independiente en el carrito si se seleccionó una
        if (this.choices.bebida.price > 0) {
            const bebidaItem = {
                key: `bebida-${this.choices.bebida.name.replace(/\s+/g, '-')}`,
                nombre: `Bebida: ${this.choices.bebida.name}`,
                tamano: '1.5 Litros',
                portions: '-',
                borde: '', // Las bebidas no tienen borde
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
        this.choices.bebida = { name: '', price: 0 }; // <-- Resetear bebida
        
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
let costoDomicilio = 0; // Variable global para el costo del domicilio
const formatoMonedaColombiaUnified = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });

window.spwaAddToCartUnified = (itemToAdd) => {
    const itemEnCarrito = carrito.find(item => item.key === itemToAdd.key);
    if (itemEnCarrito) { itemEnCarrito.cantidad++; } else { carrito.push(itemToAdd); }
    actualizarCarritoUnifiedUI();
    abrirCarrito();
};

window.cambiarCantidadUnified = (key, delta) => {
    const item = carrito.find(i => i.key === key);
    if (!item) return;
    item.cantidad += delta;
    if (item.cantidad <= 0) carrito = carrito.filter(i => i.key !== key);
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
                        <button onclick="window.cambiarCantidadUnified('${item.key}', -1)">-</button>
                        <span style="margin: 0 8px; font-weight: 600;">${item.cantidad}</span>
                        <button onclick="window.cambiarCantidadUnified('${item.key}', 1)">+</button>
                    </div>
                </div>
                <div class="item-subtotal">${formatoMonedaColombiaUnified.format(subtotalItemUnified)}</div>
            </div>
        `;
    }).join('');

    // Cálculo final sumando el domicilio
    let totalCompra = subtotalCompra + costoDomicilio;

    // Actualización visual de los 3 valores
    subtotalElemento.textContent = formatoMonedaColombiaUnified.format(subtotalCompra);
    domicilioElemento.textContent = formatoMonedaColombiaUnified.format(costoDomicilio);
    totalElementoUnified.textContent = formatoMonedaColombiaUnified.format(totalCompra);
    btnBurbujaContador.textContent = cantidadTotalCompra;
    
    spwaValidarFormulario();
};

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

// --- EVENT LISTENERS ---
// Lógica para mostrar/ocultar campos de domicilio
selectTipoEntrega.addEventListener('change', (e) => {
    if (e.target.value === 'Recoger') {
        contenedorDomicilio.classList.add('is-hidden');
        costoDomicilio = 0; // Si recoge, no hay cobro
    } else {
        contenedorDomicilio.classList.remove('is-hidden');
        // Si vuelve a Domicilio, recalcula basado en el barrio si ya había elegido uno
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
inputDireccionCliente.addEventListener('input', spwaValidarFormulario);
inputNombreCliente.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    spwaValidarFormulario();
});

function spwaValidarFormulario() {
    let nombreValido = inputNombreCliente.value.trim().length >= 9; // Validación de 9 caracteres
    let tipoEntregaValido = selectTipoEntrega.value !== '';
    let carritoLleno = carrito.length > 0;
    
    // Variables por defecto en true (Para el caso de "Recoger")
    let barrioValido = true;
    let direccionValida = true;

    // Si es a domicilio, forzamos la validación real
    if (selectTipoEntrega.value === 'Domicilio') {
        barrioValido = selectBarrioCliente.value !== '';
        direccionValida = inputDireccionCliente.value.trim() !== '';
    }

    let pagoValido = false;
    if (selectMetodoPago.value === 'Transferencia') {
        pagoValido = true;
    } else if (selectMetodoPago.value === 'Efectivo') {
        pagoValido = inputMontoEfectivo.value.trim() !== ''; 
    }

    btnPagarWhatsApp.disabled = !(nombreValido && tipoEntregaValido && barrioValido && direccionValida && carritoLleno && pagoValido);
};

window.enviarWhatsApp = () => {
    if (btnPagarWhatsApp.disabled) return;
    
    let subtotal = 0;
    let mensaje = `🍕 *NUEVO PEDIDO - MICHE PIZZA* 🍕\n\n*Cliente:* ${inputNombreCliente.value.trim()}\n`;

    // Adaptar mensaje según entrega
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

    // Desglose del total en el mensaje
    if (selectTipoEntrega.value === 'Domicilio') {
        mensaje += `\n*Subtotal Pizzas:* ${formatoMonedaColombiaUnified.format(subtotal)}`;
        mensaje += `\n*Domicilio (${selectBarrioCliente.value}):* ${formatoMonedaColombiaUnified.format(costoDomicilio)}`;
    }
    mensaje += `\n*TOTAL A PAGAR: ${formatoMonedaColombiaUnified.format(totalPagar)}*\n`;
    
    // Anexar detalles del pago
    mensaje += `\n*Método de Pago:* ${selectMetodoPago.value}`;
    if (selectMetodoPago.value === 'Efectivo') {
        const montoEfectivo = parseFloat(inputMontoEfectivo.value);
        const cambio = montoEfectivo - totalPagar;
        mensaje += `\n*Paga con:* ${formatoMonedaColombiaUnified.format(montoEfectivo)}`;
        mensaje += `\n*Cambio a llevar:* ${cambio >= 0 ? formatoMonedaColombiaUnified.format(cambio) : 'Pendiente'}`;
    } else {
        mensaje += `\n*(Comprobante adjunto en el chat)*`;
    }

    window.open(`https://wa.me/573137416559?text=${encodeURIComponent(mensaje)}`, '_blank');
};

document.getElementById('btn-carrito-global').addEventListener('click', abrirCarrito);
document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);
btnPagarWhatsApp.addEventListener('click', enviarWhatsApp);