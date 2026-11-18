// producto-form-validators.js
// Validaciones en tiempo real para formulario de productos con sistema de toasts

import { toast } from './Toast.js';

// ===== DICCIONARIOS DE PALABRAS PROHIBIDAS =====
// Basado en las funciones SQL existentes
const DICCIONARIOS = {
    DANG: [
        // A
        'abajoelcomunismo', 'abajolarevolucion', 'adicto', 'analfabeto',
        'apuestas', 'armas', 'arrebatar', 'arrebato', 'asalto', 'asaltar',
        'asecino', 'asesinato','apueta',
        
        // B
        'bolita',
        
        // C
        'cabron', 'canel', 'chingar', 'chingona', 'chivato', 'chivaton',
        'ciberclaria', 'claria', 'cocaina', 'cojer', 'comunismo', 'comunista',
        
        // D
        'demonio', 'diablo', 'dictadura', 'diazcanel', 'droga',
        
        // E
        'escoria', 'stupid', 'estafa', 'estupido',
        
        // F
        'fanoso', 'fidel', 'fidelcastro', 'follar',
        
        // G
        'garrote', 'ginetear', 'ginetera', 'gusano',
        
        // H
        'hierba', 'hijodeputa', 'hurto',
        
        // L
        'lamachi', 'lotto',
        
        // M
        'malandro', 'maldito', 'malparido', 'maltratar', 'marica', 'maricon',
        'mariconeria', 'marihuana', 'micerable', 'mierda', 'mincom', 'minint',
        'mojon',
        
        // N
        'negrademierda',
        
        // O
        'orgia',
        
        // P
        'pack', 'pajero', 'patriaomuerte', 'patriayvida', 'patriayviva',
        'pcc', 'pedofilo', 'pendejo', 'pene', 'peste', 'pistola', 'porno',
        'prostitucion', 'prostituta', 'puestoadedo', 'puta', 'puto',
        
        // R
        'raulcastro', 'revolucion', 'revolver', 'robo',
        
        // S
        'sicario', 'singar', 'singao', 'stupid',
        
        // T
        'tetas',
        
        // V
        'vagina', 'valitadegasolina', 'ventadecombustible', 'ventadegasolina',
        'videoreal', 'violador', 'violar',
        
        // X
        'xxx'
    ],
    
    WAR: [
        // A
        'asere',
        
        // B
        'baladegas', 'balitadegas', 'binance', 'bollo', 'boludo',
        
        // C
        'cabron', 'cambiodemoneda', 'capturafalsa', 'chavez', 'comemierda',
        'comprobante', 'cubacel', 'cubava', 'cuppormlc',
        
        // D
        'demoniaco', 'demonio', 'descarado', 'dolarefectivo',
        
        // E
        'eeuu', 'enzona', 'estadounidense', 'estadosunidos', 'estafador',
        'etecsa', 'euroefectivo',
        
        // F
        'feu', 'fotingo',
        
        // G
        'gobierno', 'gobiernocubano',
        
        // I
        'isarael', 'israel',
        
        // J
        'jinetera',
        
        // L
        'logiam',
        
        // M
        'maburro', 'maldecido', 'maldicion', 'maldito', 'malnacido',
        'maricon', 'mason', 'masoneria', 'medicamentos', 'medicina',
        'medicoscubanos', 'menticiero', 'mesaredonda', 'mesaretonta',
        'mlcportransferencia',
        
        // N
        'nauta', 'nicolasmaduro', 'noticiero', 'noticierocubano',
        
        // P
        'pagopendiente', 'pendejo', 'pinga', 'porlalivre',
        
        // R
        'recargarsaldo', 'religioso', 'revolico', 'rusia',
        
        // S
        'saldo', 'saldomovil', 'satanismo', 'singar',
        
        // T
        'tasadeltoque', 'transfermovil',
        
        // U
        'ucrania', 'ujc',
        
        // V
        'valadegas', 'valitadegas',
        
        // Y
        'yuma',
        
        // Z
        'zelle'
    ]
};

// ===== LÍMITES DE CARACTERES POR CAMPO =====
const LIMITES_CAMPOS = {
    Nombre: 120,
    Descripcion: 500,
    Ugps: 30,
    Promotion: 60,
    Telefono: 12,
    Telegram: 20,
    Marca: 10
};

// Control de toasts para evitar saturación
let ultimoToast = null;
let ultimoToastTiempo = 0;
const TOAST_DEBOUNCE = 2000; // 2 segundos entre toasts del mismo tipo

function mostrarToastConDebounce(tipo, titulo, mensaje, sugerencia = null) {
    const ahora = Date.now();
    const clave = `${tipo}|${titulo}`;
    
    if (ultimoToast === clave && (ahora - ultimoToastTiempo) < TOAST_DEBOUNCE) {
        console.log('Toast debounced:', clave);
        return;
    }
    
    ultimoToast = clave;
    ultimoToastTiempo = ahora;
    
    toast[tipo](titulo, mensaje, sugerencia);
}

// ===== FUNCIÓN PARA NORMALIZAR TEXTO (quitar acentos) =====
function normalizarTexto(texto) {
    if (!texto) return '';
    return texto.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

// ===== FUNCIÓN PARA VERIFICAR PALABRAS PROHIBIDAS =====
export function verificarPalabrasProhibidas(texto, campo) {
    if (!texto || typeof texto !== 'string') {
        return { encontradas: false, nivel: null, palabras: [], mensaje: '' };
    }

    const textoNormalizado = normalizarTexto(texto);
    const palabrasEncontradas = [];
    let nivelMaximo = null;

    for (const palabra of DICCIONARIOS.DANG) {
        if (textoNormalizado.includes(palabra)) {
            palabrasEncontradas.push(palabra);
            nivelMaximo = 'DANG';
            break;
        }
    }

    if (!nivelMaximo) {
        for (const palabra of DICCIONARIOS.WAR) {
            if (textoNormalizado.includes(palabra)) {
                palabrasEncontradas.push(palabra);
                nivelMaximo = 'WAR';
            }
        }
    }

    const esDang = nivelMaximo === 'DANG';
    
    return {
        encontradas: palabrasEncontradas.length > 0,
        nivel: nivelMaximo,
        palabras: palabrasEncontradas,
        mensaje: palabrasEncontradas.length > 0 
            ? `${esDang ? '🚫 Contenido prohibido' : '⚠️ Término sensible'}: ${palabrasEncontradas.join(', ')}`
            : ''
    };
}

// ===== FUNCIÓN PARA VERIFICAR LONGITUD =====
export function verificarLongitud(texto, campo) {
    if (!texto || typeof texto !== 'string') {
        return { excede: false, actual: 0, limite: LIMITES_CAMPOS[campo] || 0 };
    }

    const longitud = texto.length;
    const limite = LIMITES_CAMPOS[campo];

    if (!limite) return { excede: false, actual: longitud, limite: null };

    return {
        excede: longitud > limite,
        actual: longitud,
        limite: limite,
        restantes: limite - longitud,
        porcentaje: (longitud / limite) * 100,
        mensaje: longitud > limite 
            ? `❌ Excede el límite (${longitud}/${limite} caracteres)`
            : `✅ ${longitud}/${limite} caracteres`
    };
}

// ===== FUNCIÓN PARA VALIDAR TELÉFONO =====
export function validarTelefono(telefono) {
    if (!telefono) return { valido: true, mensaje: '' };
    
    const telefonoLimpio = telefono.replace(/[^\d+]/g, '');
    const tieneFormatoValido = /^\+?\d{7,12}$/.test(telefonoLimpio);
    
    return {
        valido: tieneFormatoValido,
        mensaje: tieneFormatoValido ? '' : 'Formato inválido. Use solo números y + (ej: +5351234567)'
    };
}

// ===== FUNCIÓN PARA VALIDAR TELEGRAM =====
export function validarTelegram(telegram) {
    if (!telegram) return { valido: true, mensaje: '' };
    
    const tieneFormatoValido = /^@?[a-zA-Z0-9_]{3,20}$/.test(telegram);
    
    return {
        valido: tieneFormatoValido,
        mensaje: tieneFormatoValido ? '' : 'Formato inválido. Use @ seguido de letras, números o _'
    };
}

// ===== FUNCIÓN PARA VALIDAR UGPS (Plus Code) =====
export function validarUgps(ugps) {
    if (!ugps) return { valido: true, mensaje: '' };
    
    const tieneFormatoValido = /^[A-Za-z0-9+ ]{4,30}$/.test(ugps);
    
    return {
        valido: tieneFormatoValido,
        mensaje: tieneFormatoValido ? '' : 'Formato de Plus Code inválido'
    };
}

// ===== FUNCIÓN PRINCIPAL PARA VALIDAR UN CAMPO COMPLETO =====
export function validarCampo(campo, valor, showToast = true) {
    const resultado = {
        campo,
        valor,
        valido: true,
        longitud: null,
        palabras: null,
        formato: null,
        mensajes: []
    };

    // Validar longitud
    if (LIMITES_CAMPOS[campo]) {
        resultado.longitud = verificarLongitud(valor, campo);
        if (resultado.longitud.excede) {
            resultado.valido = false;
            resultado.mensajes.push(resultado.longitud.mensaje);
            if (showToast) {
                mostrarToastConDebounce('warning', `📝 ${campo}`, resultado.longitud.mensaje);
            }
        }
    }

    // Validar palabras prohibidas
    resultado.palabras = verificarPalabrasProhibidas(valor, campo);
    if (resultado.palabras.encontradas) {
        resultado.valido = false;
        resultado.mensajes.push(resultado.palabras.mensaje);
        if (showToast) {
            const tipo = resultado.palabras.nivel === 'DANG' ? 'error' : 'warning';
            const titulo = resultado.palabras.nivel === 'DANG' ? '🚫 Contenido bloqueado' : '⚠️ Término sensible';
            mostrarToastConDebounce(tipo, titulo, resultado.palabras.mensaje, 'Por favor, modifica el contenido');
        }
    }

    // Validaciones específicas
    switch (campo) {
        case 'Telefono':
            resultado.formato = validarTelefono(valor);
            if (!resultado.formato.valido && valor) {
                resultado.valido = false;
                resultado.mensajes.push(resultado.formato.mensaje);
                if (showToast) {
                    mostrarToastConDebounce('warning', '📞 Teléfono inválido', resultado.formato.mensaje);
                }
            }
            break;
        case 'Telegram':
            resultado.formato = validarTelegram(valor);
            if (!resultado.formato.valido && valor) {
                resultado.valido = false;
                resultado.mensajes.push(resultado.formato.mensaje);
                if (showToast) {
                    mostrarToastConDebounce('warning', '💬 Telegram inválido', resultado.formato.mensaje);
                }
            }
            break;
        case 'Ugps':
            resultado.formato = validarUgps(valor);
            if (!resultado.formato.valido && valor) {
                resultado.valido = false;
                resultado.mensajes.push(resultado.formato.mensaje);
                if (showToast) {
                    mostrarToastConDebounce('warning', '📍 Ubicación inválida', resultado.formato.mensaje);
                }
            }
            break;
    }

    // Toast de éxito si todo está bien y hay valor
    if (showToast && resultado.valido && valor && valor.length > 0) {
        const campoLabels = {
            Nombre: 'Nombre del producto',
            Descripcion: 'Descripción',
            Promotion: 'Promoción',
            Telefono: 'Teléfono',
            Telegram: 'Telegram',
            Ugps: 'Ubicación',
            Marca: 'Marca'
        };
        mostrarToastConDebounce('success', `✓ ${campoLabels[campo] || campo} válido`, 'El campo cumple con los requisitos');
    }

    return resultado;
}

// ===== FUNCIÓN PARA CREAR INDICADOR VISUAL =====
export function crearIndicadorValidacion(inputId, opciones = {}) {
    const input = document.getElementById(inputId);
    if (!input) return null;

    // Remover indicador existente si lo hay
    if (input._validacionContainer) {
        input._validacionContainer.remove();
    }

    const contenedor = document.createElement('div');
    contenedor.className = 'validacion-indicador';
    contenedor.style.cssText = `
        margin-top: 5px;
        font-size: 0.8rem;
        transition: all 0.3s ease;
        display: none;
    `;

    input.parentNode.insertBefore(contenedor, input.nextSibling);
    input._validacionContainer = contenedor;

    // Barra de progreso para longitud
    if (opciones.mostrarBarra !== false && LIMITES_CAMPOS[inputId]) {
        const barraContainer = document.createElement('div');
        barraContainer.style.cssText = `
            width: 100%;
            height: 3px;
            background: #e5e7eb;
            border-radius: 2px;
            margin-top: 4px;
            overflow: hidden;
        `;
        
        const barra = document.createElement('div');
        barra.style.cssText = `
            height: 100%;
            width: 0%;
            background: #10b981;
            transition: width 0.3s ease, background 0.3s ease;
        `;
        
        barraContainer.appendChild(barra);
        contenedor.appendChild(barraContainer);
        input._barraLongitud = barra;
    }

    // Contenedor para mensajes
    const mensajesDiv = document.createElement('div');
    mensajesDiv.className = 'validacion-mensajes';
    mensajesDiv.style.fontSize = '0.75rem';
    contenedor.appendChild(mensajesDiv);
    
    input._validacionMensajes = mensajesDiv;

    return contenedor;
}

// ===== FUNCIÓN PARA ACTUALIZAR VALIDACIÓN EN TIEMPO REAL =====
export function setupValidacionTiempoReal(inputId, opciones = {}) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (!input._validacionMensajes) {
        crearIndicadorValidacion(inputId, opciones);
    }

    let timeoutId = null;

    function validarInput() {
        // Debounce para toasts
        if (timeoutId) clearTimeout(timeoutId);
        
        timeoutId = setTimeout(() => {
            const resultado = validarCampo(inputId, input.value, true);
            
            // Actualizar clases
            input.classList.remove('is-valid', 'is-invalid');
            if (resultado.valido && input.value) {
                input.classList.add('is-valid');
            } else if (!resultado.valido && input.value) {
                input.classList.add('is-invalid');
            }

            // Actualizar mensajes visuales
            if (input._validacionMensajes) {
                if (resultado.mensajes.length > 0 && !resultado.valido) {
                    input._validacionMensajes.innerHTML = resultado.mensajes.map(msg => 
                        `<div style="color: #ef4444; margin-top: 2px;">${msg}</div>`
                    ).join('');
                } else {
                    input._validacionMensajes.innerHTML = '';
                }
            }

            // Actualizar barra de progreso
            if (input._barraLongitud && resultado.longitud) {
                const porcentaje = Math.min(resultado.longitud.porcentaje, 100);
                input._barraLongitud.style.width = `${porcentaje}%`;
                
                if (porcentaje > 90) {
                    input._barraLongitud.style.background = '#ef4444';
                } else if (porcentaje > 75) {
                    input._barraLongitud.style.background = '#f59e0b';
                } else {
                    input._barraLongitud.style.background = '#10b981';
                }
            }

            if (opciones.onValidate) {
                opciones.onValidate(resultado);
            }
        }, 500);
    }

    input.addEventListener('input', validarInput);
    input.addEventListener('blur', validarInput);
    
    setTimeout(validarInput, 100);
}

// ===== FUNCIÓN PARA CONFIGURAR TODAS LAS VALIDACIONES =====
export function configurarValidacionesFormulario(opciones = {}) {
    const camposAValidar = ['Nombre', 'Descripcion', 'Promotion', 'Telefono', 'Telegram', 'Ugps', 'Marca'];

    camposAValidar.forEach(campo => {
        const input = document.getElementById(campo);
        if (input) {
            setupValidacionTiempoReal(campo, opciones);
        }
    });

    // Contador de caracteres para Descripción
    const descripcion = document.getElementById('Descripcion');
    if (descripcion) {
        const contador = document.createElement('small');
        contador.className = 'form-text text-muted';
        contador.style.cssText = 'margin-top: 5px; font-size: 0.75rem;';
        descripcion.parentNode.appendChild(contador);
        
        descripcion.addEventListener('input', () => {
            const len = descripcion.value.length;
            const limite = LIMITES_CAMPOS.Descripcion;
            const restantes = limite - len;
            
            if (restantes < 0) {
                contador.innerHTML = `<span style="color: #ef4444;">❌ Excede por ${Math.abs(restantes)} caracteres</span>`;
            } else {
                contador.innerHTML = `📝 ${len}/${limite} caracteres (${restantes} restantes)`;
            }
        });
    }
}

// ===== FUNCIÓN PARA VALIDAR TODO EL FORMULARIO =====
export function validarFormularioCompleto() {
    const camposAValidar = ['Nombre', 'Descripcion', 'Promotion', 'Telefono', 'Telegram', 'Ugps', 'Marca'];
    let formularioValido = true;
    const errores = [];

    camposAValidar.forEach(campo => {
        const input = document.getElementById(campo);
        if (input && input.value) {
            const resultado = validarCampo(campo, input.value, false);
            if (!resultado.valido) {
                formularioValido = false;
                errores.push({
                    campo,
                    mensajes: resultado.mensajes
                });
            }
        }
    });

    return { valido: formularioValido, errores };
}

export { LIMITES_CAMPOS };

export default {
    verificarPalabrasProhibidas,
    verificarLongitud,
    validarCampo,
    setupValidacionTiempoReal,
    configurarValidacionesFormulario,
    validarFormularioCompleto,
    LIMITES_CAMPOS
};
