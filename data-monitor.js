// /js/data-monitor.js
// Módulo para monitorear el consumo de datos de red en tiempo real

class DataMonitor {
    constructor(options = {}) {
        this.totalTransferSize = 0;
        this.totalEncodedSize = 0;
        this.totalDecodedSize = 0;
        this.recursosPorTipo = {
            'script': { count: 0, bytes: 0 },
            'css': { count: 0, bytes: 0 },
            'img': { count: 0, bytes: 0 },
            'fetch': { count: 0, bytes: 0 },
            'xmlhttprequest': { count: 0, bytes: 0 },
            'other': { count: 0, bytes: 0 }
        };
        
        this.recursosDetallados = [];
        this.observer = null;
        this.enabled = options.enabled !== false;
        this.showUI = options.showUI || false;
        this.sessionKey = 'easymarket_data_consumption';
        this.onUpdate = options.onUpdate || null;
        this.onThreshold = options.onThreshold || null;
        
        // Umbrales de advertencia (en MB)
        this.thresholds = {
            warning: options.warningThreshold || 50,  // 50 MB
            critical: options.criticalThreshold || 100 // 100 MB
        };
        
        // Cargar consumo previo de esta sesión
        this.cargarConsumoPrevio();
        
        if (this.enabled) {
            this.iniciarMonitoreo();
            if (this.showUI) this.crearUI();
        }
    }
    
    cargarConsumoPrevio() {
        try {
            const previo = sessionStorage.getItem(this.sessionKey);
            if (previo) {
                const data = JSON.parse(previo);
                this.totalTransferSize = data.totalTransferSize || 0;
                this.totalEncodedSize = data.totalEncodedSize || 0;
                this.totalDecodedSize = data.totalDecodedSize || 0;
                console.log(`📊 Consumo previo de esta sesión: ${this.getTotalMB()} MB`);
            }
        } catch (e) {
            console.warn('Error cargando consumo previo:', e);
        }
    }
    
    guardarConsumoActual() {
        try {
            const data = {
                totalTransferSize: this.totalTransferSize,
                totalEncodedSize: this.totalEncodedSize,
                totalDecodedSize: this.totalDecodedSize,
                timestamp: Date.now(),
                url: window.location.href
            };
            sessionStorage.setItem(this.sessionKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Error guardando consumo:', e);
        }
    }
    
    iniciarMonitoreo() {
        if (!window.PerformanceObserver) {
            console.warn('⚠️ PerformanceObserver no soportado en este navegador');
            return;
        }
        
        // Observer para recursos en tiempo real
        this.observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.entryType === 'resource') {
                    this.procesarRecurso(entry);
                }
            });
        });
        
        this.observer.observe({ type: 'resource', buffered: true });
        
        // También procesar recursos ya cargados (buffered)
        if (performance.getEntriesByType) {
            const recursosExistentes = performance.getEntriesByType('resource');
            recursosExistentes.forEach(entry => this.procesarRecurso(entry));
        }
        
        console.log('📡 Monitoreo de datos iniciado');
    }
    
    procesarRecurso(entry) {
        const transferSize = entry.transferSize || 0;
        const encodedSize = entry.encodedBodySize || 0;
        const decodedSize = entry.decodedBodySize || 0;
        
        // Si transferSize es 0 pero decodedSize > 0, vino de caché
        const desdeCache = (transferSize === 0 && decodedSize > 0);
        
        // Solo sumar si realmente consumió datos de red
        if (!desdeCache && transferSize > 0) {
            this.totalTransferSize += transferSize;
            this.totalEncodedSize += encodedSize;
            this.totalDecodedSize += decodedSize;
            
            // Clasificar por tipo
            let tipo = entry.initiatorType || 'other';
            if (!this.recursosPorTipo[tipo]) {
                this.recursosPorTipo[tipo] = { count: 0, bytes: 0 };
            }
            this.recursosPorTipo[tipo].count++;
            this.recursosPorTipo[tipo].bytes += transferSize;
            
            // Guardar detalle opcional (solo últimos 100)
            const nombre = entry.name.split('/').pop().split('?')[0];
            this.recursosDetallados.unshift({
                nombre: nombre,
                tipo: tipo,
                tamañoKB: (transferSize / 1024).toFixed(2),
                timestamp: new Date().toISOString(),
                desdeCache: false
            });
            
            if (this.recursosDetallados.length > 100) {
                this.recursosDetallados.pop();
            }
            
            // Verificar umbrales
            this.verificarUmbrales();
            
            // Llamar callback de actualización
            if (this.onUpdate) {
                this.onUpdate(this.getResumen());
            }
            
            // Guardar periódicamente (cada 10 recursos)
            if (this.recursosPorTipo[tipo].count % 10 === 0) {
                this.guardarConsumoActual();
            }
        } else if (desdeCache && entry.decodedBodySize > 0) {
            // Registrar en caché para depuración (sin sumar al total)
            if (this.showUI) {
                console.log(`💾 Cache hit: ${entry.name.split('/').pop()} (${(decodedSize / 1024).toFixed(2)} KB desde caché)`);
            }
        }
    }
    
    verificarUmbrales() {
        const totalMB = this.getTotalMB();
        
        if (totalMB >= this.thresholds.critical && this.onThreshold) {
            this.onThreshold('critical', totalMB, this.thresholds.critical);
        } else if (totalMB >= this.thresholds.warning && this.onThreshold) {
            this.onThreshold('warning', totalMB, this.thresholds.warning);
        }
    }
    
    getTotalMB() {
        return (this.totalTransferSize / 1024 / 1024).toFixed(2);
    }
    
    getTotalKB() {
        return (this.totalTransferSize / 1024).toFixed(2);
    }
    
    getResumen() {
        return {
            totalMB: this.getTotalMB(),
            totalKB: this.getTotalKB(),
            totalBytes: this.totalTransferSize,
            encodedMB: (this.totalEncodedSize / 1024 / 1024).toFixed(2),
            recursosPorTipo: this.recursosPorTipo,
            totalRecursos: Object.values(this.recursosPorTipo).reduce((sum, t) => sum + t.count, 0),
            muestraDetalles: this.recursosDetallados.slice(0, 10)
        };
    }
    
    crearUI() {
        // Crear indicador flotante
        const indicator = document.createElement('div');
        indicator.id = 'data-monitor-indicator';
        indicator.innerHTML = `
            <div class="data-monitor-toggle">
                <i class="fas fa-chart-line"></i>
                <span class="data-consumption">0 MB</span>
            </div>
            <div class="data-monitor-panel" style="display: none;">
                <div class="data-monitor-header">
                    <strong>📊 Consumo de Datos</strong>
                    <button class="data-monitor-close">&times;</button>
                </div>
                <div class="data-monitor-body">
                    <div class="data-stats">
                        <div class="stat">
                            <span class="stat-label">Total:</span>
                            <span class="stat-value total-mb">0 MB</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Recursos:</span>
                            <span class="stat-value total-recursos">0</span>
                        </div>
                    </div>
                    <div class="data-breakdown">
                        <h4>Desglose por tipo:</h4>
                        <div class="breakdown-list"></div>
                    </div>
                    <div class="data-warning" style="display: none;">
                        ⚠️ Consumo elevado de datos
                    </div>
                </div>
            </div>
        `;
        
        // Estilos
        const style = document.createElement('style');
        style.textContent = `
            #data-monitor-indicator {
                position: fixed;
                bottom: 80px;
                right: 15px;
                z-index: 9999;
                font-family: sans-serif;
            }
            .data-monitor-toggle {
                background: #ff6b4a;
                color: white;
                padding: 8px 12px;
                border-radius: 30px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                font-weight: bold;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                transition: all 0.3s;
            }
            .data-monitor-toggle:hover {
                background: #e55a3a;
                transform: scale(1.05);
            }
            .data-monitor-panel {
                position: absolute;
                bottom: 50px;
                right: 0;
                width: 280px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
                overflow: hidden;
                z-index: 10000;
            }
            .data-monitor-header {
                background: #2c3e50;
                color: white;
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .data-monitor-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
            }
            .data-monitor-body {
                padding: 12px;
                max-height: 300px;
                overflow-y: auto;
            }
            .data-stats {
                display: flex;
                justify-content: space-between;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #eee;
            }
            .stat {
                text-align: center;
            }
            .stat-label {
                font-size: 11px;
                color: #666;
                display: block;
            }
            .stat-value {
                font-size: 18px;
                font-weight: bold;
                color: #ff6b4a;
            }
            .data-breakdown h4 {
                font-size: 12px;
                margin: 8px 0;
                color: #555;
            }
            .breakdown-list {
                font-size: 11px;
            }
            .breakdown-item {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px solid #f0f0f0;
            }
            .data-warning {
                background: #fff3cd;
                color: #856404;
                padding: 8px;
                border-radius: 6px;
                font-size: 11px;
                margin-top: 10px;
                text-align: center;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(indicator);
        
        // Eventos UI
        const toggle = indicator.querySelector('.data-monitor-toggle');
        const panel = indicator.querySelector('.data-monitor-panel');
        const closeBtn = indicator.querySelector('.data-monitor-close');
        
        toggle.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            if (panel.style.display === 'block') {
                this.actualizarUI();
            }
        });
        
        closeBtn.addEventListener('click', () => {
            panel.style.display = 'none';
        });
        
        this.uiElements = {
            totalMB: indicator.querySelector('.total-mb'),
            totalRecursos: indicator.querySelector('.total-recursos'),
            breakdownList: indicator.querySelector('.breakdown-list'),
            warningDiv: indicator.querySelector('.data-warning'),
            consumoLabel: indicator.querySelector('.data-consumption')
        };
    }
    
    actualizarUI() {
        if (!this.uiElements) return;
        
        const resumen = this.getResumen();
        this.uiElements.totalMB.textContent = `${resumen.totalMB} MB`;
        this.uiElements.totalRecursos.textContent = resumen.totalRecursos;
        this.uiElements.consumoLabel.textContent = `${resumen.totalMB} MB`;
        
        // Actualizar desglose
        let breakdownHTML = '';
        for (const [tipo, data] of Object.entries(resumen.recursosPorTipo)) {
            if (data.count > 0) {
                breakdownHTML += `
                    <div class="breakdown-item">
                        <span>${tipo}</span>
                        <span>${data.count} recursos - ${(data.bytes / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                `;
            }
        }
        this.uiElements.breakdownList.innerHTML = breakdownHTML || '<div class="breakdown-item">No hay datos aún</div>';
        
        // Mostrar advertencia si aplica
        const totalMB = parseFloat(resumen.totalMB);
        if (totalMB >= this.thresholds.warning) {
            this.uiElements.warningDiv.style.display = 'block';
            this.uiElements.warningDiv.textContent = totalMB >= this.thresholds.critical 
                ? '⚠️ CRÍTICO: Consumo superior a ' + this.thresholds.critical + ' MB'
                : '⚠️ ADVERTENCIA: Consumo superior a ' + this.thresholds.warning + ' MB';
        } else {
            this.uiElements.warningDiv.style.display = 'none';
        }
    }
    
    detener() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.guardarConsumoActual();
        console.log('📡 Monitoreo detenido. Consumo total:', this.getTotalMB(), 'MB');
    }
    
    resetear() {
        this.totalTransferSize = 0;
        this.totalEncodedSize = 0;
        this.totalDecodedSize = 0;
        this.recursosPorTipo = {
            'script': { count: 0, bytes: 0 },
            'css': { count: 0, bytes: 0 },
            'img': { count: 0, bytes: 0 },
            'fetch': { count: 0, bytes: 0 },
            'xmlhttprequest': { count: 0, bytes: 0 },
            'other': { count: 0, bytes: 0 }
        };
        this.recursosDetallados = [];
        sessionStorage.removeItem(this.sessionKey);
        if (this.uiElements) {
            this.actualizarUI();
        }
        console.log('🔄 Contador de datos reiniciado');
    }
}

// Exportar como módulo
export default DataMonitor;

// Inicialización automática (opcional)
let monitorInstance = null;

export function iniciarMonitor(opciones = {}) {
    if (!monitorInstance) {
        monitorInstance = new DataMonitor(opciones);
    }
    return monitorInstance;
}

export function getMonitor() {
    return monitorInstance;
}
