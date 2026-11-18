// components/Toast.js - Con cola para evitar saturación

/**
 * Sistema de toasts modernos con cola para evitar saturación
 */
class ToastManager {
    constructor() {
        this.container = null;
        this.toasts = [];
        this.queue = [];
        this.maxConcurrentToasts = 3;
        this.activeToasts = 0;
        this.createContainer();
    }
    
    createContainer() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }
        this.container = document.getElementById('toast-container');
        
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = this.getStyles();
            document.head.appendChild(style);
        }
    }
    
    getStyles() {
        return `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
            }
            
            .toast-notification {
                pointer-events: auto;
                min-width: 320px;
                max-width: 450px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.05);
                animation: slideInRight 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .toast-notification.hiding {
                animation: slideOutRight 0.3s ease forwards;
            }
            
            .toast-content {
                display: flex;
                align-items: flex-start;
                padding: 16px 20px;
                gap: 14px;
            }
            
            .toast-icon {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }
            
            .toast-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.5;
                color: #1f2937;
            }
            
            .toast-message strong {
                display: block;
                font-weight: 600;
                margin-bottom: 4px;
                font-size: 15px;
            }
            
            .toast-message p {
                margin: 0;
                color: #6b7280;
            }
            
            .toast-message small {
                display: block;
                margin-top: 6px;
                font-size: 12px;
                color: #9ca3af;
            }
            
            .toast-close {
                flex-shrink: 0;
                width: 24px;
                height: 24px;
                background: transparent;
                border: none;
                cursor: pointer;
                color: #9ca3af;
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: all 0.2s;
            }
            
            .toast-close:hover {
                background: #f3f4f6;
                color: #4b5563;
            }
            
            .toast-progress {
                height: 3px;
                background: rgba(0, 0, 0, 0.1);
                width: 100%;
                position: relative;
            }
            
            .toast-progress-bar {
                height: 100%;
                width: 100%;
                background: currentColor;
                animation: progress 3s linear forwards;
            }
            
            @keyframes progress {
                from { width: 100%; }
                to { width: 0%; }
            }
            
            .toast-notification.toast-success {
                background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                border-left: 4px solid #10b981;
            }
            .toast-notification.toast-success .toast-icon {
                background: #10b98120;
                color: #10b981;
            }
            
            .toast-notification.toast-error {
                background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
                border-left: 4px solid #ef4444;
            }
            .toast-notification.toast-error .toast-icon {
                background: #ef444420;
                color: #ef4444;
            }
            
            .toast-notification.toast-warning {
                background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
                border-left: 4px solid #f59e0b;
            }
            .toast-notification.toast-warning .toast-icon {
                background: #f59e0b20;
                color: #f59e0b;
            }
            
            .toast-notification.toast-info {
                background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                border-left: 4px solid #3b82f6;
            }
            .toast-notification.toast-info .toast-icon {
                background: #3b82f620;
                color: #3b82f6;
            }
        `;
    }
    
    /**
     * Procesa la cola de toasts
     */
    processQueue() {
        if (this.queue.length === 0) return;
        if (this.activeToasts >= this.maxConcurrentToasts) return;
        
        const nextToast = this.queue.shift();
        this.activeToasts++;
        this._show(nextToast);
    }
    
    /**
     * Muestra un toast (interno)
     */
    _show(options) {
        const {
            type = 'info',
            title,
            message,
            suggestion,
            duration = 4000
        } = options;
        
        const icons = {
            success: '✓',
            error: '⚠️',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;
        
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">${icons[type] || icons.info}</div>
                <div class="toast-message">
                    ${title ? `<strong>${this.escapeHtml(title)}</strong>` : ''}
                    <p>${this.escapeHtml(message)}</p>
                    ${suggestion ? `<small>💡 ${this.escapeHtml(suggestion)}</small>` : ''}
                </div>
                <button class="toast-close" aria-label="Cerrar">✕</button>
            </div>
            <div class="toast-progress">
                <div class="toast-progress-bar" style="background: ${this.getProgressColor(type)}"></div>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        const closeBtn = toast.querySelector('.toast-close');
        const progressBar = toast.querySelector('.toast-progress-bar');
        
        let timeoutId;
        
        const removeToast = () => {
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                    this.activeToasts--;
                    this.processQueue();
                }
            }, 300);
        };
        
        const startTimer = () => {
            timeoutId = setTimeout(removeToast, duration);
        };
        
        const pauseTimer = () => {
            clearTimeout(timeoutId);
            progressBar.style.animationPlayState = 'paused';
        };
        
        const resumeTimer = () => {
            startTimer();
            progressBar.style.animationPlayState = 'running';
        };
        
        closeBtn.addEventListener('click', removeToast);
        toast.addEventListener('mouseenter', pauseTimer);
        toast.addEventListener('mouseleave', resumeTimer);
        
        startTimer();
        
        this.toasts.push(toast);
    }
    
    /**
     * Muestra un toast (público con cola)
     */
    show(options) {
        this.queue.push(options);
        this.processQueue();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getProgressColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || '#3b82f6';
    }
    
    success(title, message, suggestion = null) {
        this.show({ type: 'success', title, message, suggestion, duration: 3500 });
    }
    
    error(title, message, suggestion = null) {
        this.show({ type: 'error', title, message, suggestion, duration: 5000 });
    }
    
    warning(title, message, suggestion = null) {
        this.show({ type: 'warning', title, message, suggestion, duration: 4000 });
    }
    
    info(title, message, suggestion = null) {
        this.show({ type: 'info', title, message, suggestion, duration: 3000 });
    }
    
    clear() {
        this.queue = [];
        this.toasts.forEach(toast => {
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 300);
        });
        this.toasts = [];
        this.activeToasts = 0;
    }
}

// Exportar instancia única
export const toast = new ToastManager();
