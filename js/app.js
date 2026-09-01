import { productsData, preciosBordesData } from './productos.js';

const spwa = {
    history: ['step-1'], // Pila de navegación para el botón Volver
    currentFlavorContext: '', 
    currentStyleChoice: '', 
    choices: {
        size: { name: '', price: 0, portions: 0 },
        style: '',
        flavor1: { id: 0, name: '', img: '' },
        flavor2: { id: 0, name: '', img: '' },
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
        // Evento Volver
        this.elements.btnVolver.addEventListener('click', () => this.goBack());

        // Paso 1
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

        // Paso 2
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

        // Paso 4: Finalizar
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
        if (this.history.length <= 1) return; // Ya estamos en el inicio

        const currentStep = this.history.pop(); // Removemos el actual
        this.elements.panels[currentStep].classList.remove('activo');
        
        const previousStep = this.getCurrentStep();
        
        // Manejo especial si volvemos dentro del catálogo (de Mitad 2 a Mitad 1)
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
        if (stepId === 'step-2') progress = 33;
        if (stepId === 'step-catalog') progress = this.currentFlavorContext === 'Mitad 2' ? 66 : 50;
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
                    <img src="${prod.img}" alt="${prod.nombre}" loading="lazy">
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
                    btn.textContent = "Combinar y Continuar 🚀";
                    btn.classList.remove('Mitad-1-Context');
                });
            }
        } else {
            flavorButtons.forEach(btn => {
                btn.textContent = "Elegir sabor y continuar 🚀";
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
                this.advanceTo('step-catalog'); // Empuja el mismo panel al historial para la Mitad 2
            } else {
                this.choices.flavor2 = { id: flavorId, name: flavorName, img: flavorImg };
                this.advanceTo('step-final'); 
            }
        } else {
            this.choices.flavor1 = { id: flavorId, name: flavorName, img: flavorImg };
            this.advanceTo('step-final'); 
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
        this.resetSPWA();
    },

    resetSPWA: function() {
        this.elements.panels[this.getCurrentStep()].classList.remove('activo');
        
        this.history = ['step-1'];
        this.currentFlavorContext = ''; 
        this.currentStyleChoice = ''; 
        
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
    const totalElementoUnified = document.getElementById('total-carrito');
    const btnBurbujaContador = document.getElementById('contador-burbuja');

    let totalCompra = 0;
    let cantidadTotalCompra = 0;

    contenedorItems.innerHTML = carrito.map(item => {
        const subtotalItemUnified = item.precio * item.cantidad;
        totalCompra += subtotalItemUnified;
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

    totalElementoUnified.textContent = formatoMonedaColombiaUnified.format(totalCompra);
    btnBurbujaContador.textContent = cantidadTotalCompra;
    spwaValidarFormulario();
};

const sidebarElemento = document.getElementById('sidebar-carrito');
window.abrirCarrito = () => sidebarElemento.classList.add('activo');
window.cerrarCarrito = () => sidebarElemento.classList.remove('activo');

document.getElementById('btn-carrito-global').addEventListener('click', abrirCarrito);
document.getElementById('btn-cerrar-carrito').addEventListener('click', cerrarCarrito);

const inputNombreCliente = document.getElementById('cliente-nombre');
const inputDireccionCliente = document.getElementById('cliente-direccion');
const btnPagarWhatsApp = document.getElementById('btn-pagar');

inputNombreCliente.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
    spwaValidarFormulario();
});
inputDireccionCliente.addEventListener('input', spwaValidarFormulario);

function spwaValidarFormulario() {
    btnPagarWhatsApp.disabled = !(inputNombreCliente.value.trim().length >= 3 && inputDireccionCliente.value.trim() !== '' && carrito.length > 0);
};

window.enviarWhatsApp = () => {
    if (btnPagarWhatsApp.disabled) return;
    let total = 0;
    let mensaje = `🍕 *NUEVO PEDIDO - MICHE PIZZA* 🍕\n\n*Cliente:* ${inputNombreCliente.value.trim()}\n*Dirección:* ${inputDireccionCliente.value.trim()}\n\n*Detalle de la Orden:*\n`;

    carrito.forEach(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        mensaje += `- ${item.cantidad}x ${item.nombre} (${item.tamano})\n`;
        if (item.borde && item.borde !== 'Sin Borde Adicional') mensaje += `  ✨ Adición: ${item.borde}\n`;
        mensaje += `  Subtotal: ${formatoMonedaColombiaUnified.format(subtotal)}\n`;
    });

    mensaje += `\n*TOTAL A PAGAR: ${formatoMonedaColombiaUnified.format(total)}*`;
    window.open(`https://wa.me/573244022566?text=${encodeURIComponent(mensaje)}`, '_blank');
};