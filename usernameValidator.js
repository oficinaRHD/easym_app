// validators/usernameValidator.js

/**
 * Configuración de validación de username
 * Debe coincidir exactamente con las reglas del backend
 */
const USERNAME_CONFIG = {
    MIN_LENGTH: 3,
    MAX_LENGTH: 12,
    ALLOWED_PATTERN: /^[a-zA-Z0-9_]+$/,
    RESERVED_NAMES: ['admin', 'administrador', 'root', 'system', 'superuser', 'easyadmin', 'easymarket'],
    
    // Diccionario de palabras prohibidas (coincide con el backend)
    FORBIDDEN_WORDS: {
        // Nivel DANG (palabras graves)
        DANG: [
            'dictadura', 'comunismo', 'fidel', 'fidelcastro', 'raulcastro',
            'revolucion', 'patriaomuerte', 'chivato', 'apuestas', 'violador',
            'pedofilo', 'ventadegasolina', 'droga', 'cocaina', 'marihuana',
            'armas', 'pistola', 'asalto', 'violar', 'porno', 'prostituta',
            'escort', 'asesinato', 'sicario', 'minint', 'mincom',
            'puta', 'puto', 'hijodeputa', 'singar', 'cojer', 'follar',
            'maricon', 'marica', 'pajero', 'pendejo', 'cabron', 'malparido'
        ],
        // Nivel WAR (palabras sensibles)
        WAR: [
            'enzona', 'transfermovil', 'gobierno', 'gobiernocubano',
            'nicolasmaduro', 'mesaredonda', 'mesatonta', 'noticiero',
            'menticiero', 'asere', 'fotingo', 'boludo', 'comemierda',
            'maldito', 'maldicion', 'descarado', 'estafador', 'jinetera',
            'etecsa', 'cubacel', 'nauta', 'cubava', 'revolico', 'porlalivre'
        ]
    }
};

/**
 * Normaliza el texto para detección de palabras prohibidas
 */
function normalizeText(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
        .replace(/[^a-z0-9]/g, ''); // Elimina caracteres no alfanuméricos
}

/**
 * Detecta palabras prohibidas en el username
 * @returns {Object} { hasForbidden: boolean, forbiddenWords: string[], level: 'DANG'|'WAR'|null }
 */
function detectForbiddenWords(username) {
    const normalized = normalizeText(username);
    const foundWords = [];
    let level = null;
    
    // Verificar palabras DANG (nivel grave)
    for (const word of USERNAME_CONFIG.FORBIDDEN_WORDS.DANG) {
        if (normalized.includes(word)) {
            foundWords.push(word);
            level = 'DANG';
            break; // Una palabra DANG es suficiente para rechazar
        }
    }
    
    // Si no hay DANG, verificar WAR
    if (!level) {
        for (const word of USERNAME_CONFIG.FORBIDDEN_WORDS.WAR) {
            if (normalized.includes(word)) {
                foundWords.push(word);
                level = 'WAR';
            }
        }
    }
    
    return {
        hasForbidden: foundWords.length > 0,
        forbiddenWords: foundWords,
        level: level
    };
}

/**
 * Genera una sugerencia de username válido
 */
function generateSuggestion(username) {
    let suggested = username
        .replace(/[^a-zA-Z0-9_]/g, '') // Elimina caracteres inválidos
        .substring(0, USERNAME_CONFIG.MAX_LENGTH);
    
    // Si quedó vacío o muy corto
    if (suggested.length < USERNAME_CONFIG.MIN_LENGTH) {
        suggested = `usuario_${Math.random().toString(36).substring(2, 5)}`;
    }
    
    // Si excede la longitud máxima
    if (suggested.length > USERNAME_CONFIG.MAX_LENGTH) {
        suggested = suggested.substring(0, USERNAME_CONFIG.MAX_LENGTH);
    }
    
    return suggested;
}

/**
 * Valida el username según todas las reglas
 * @param {string} username - El nombre de usuario a validar
 * @returns {Object} { isValid: boolean, error: string|null, suggestion: string|null }
 */
export function validateUsername(username) {
    // Validación 1: No vacío
    if (!username || username.trim() === '') {
        return {
            isValid: false,
            error: 'El nombre de usuario no puede estar vacío.',
            suggestion: 'Ingresa un nombre de usuario válido.'
        };
    }
    
    const trimmedUsername = username.trim();
    const length = trimmedUsername.length;
    
    // Validación 2: Longitud mínima
    if (length < USERNAME_CONFIG.MIN_LENGTH) {
        const suggestion = trimmedUsername + '123';
        return {
            isValid: false,
            error: `❌ El nombre de usuario debe tener al menos ${USERNAME_CONFIG.MIN_LENGTH} caracteres. Has ingresado "${trimmedUsername}" que tiene ${length} caracteres.`,
            suggestion: `Sugerencia: "${suggestion}"`
        };
    }
    
    // Validación 3: Longitud máxima
    if (length > USERNAME_CONFIG.MAX_LENGTH) {
        const suggestion = generateSuggestion(trimmedUsername);
        return {
            isValid: false,
            error: `❌ El nombre de usuario "${trimmedUsername}" excede el límite máximo de ${USERNAME_CONFIG.MAX_LENGTH} caracteres (tiene ${length} caracteres).`,
            suggestion: `Sugerencia: "${suggestion}"`
        };
    }
    
    // Validación 4: Caracteres permitidos
    if (!USERNAME_CONFIG.ALLOWED_PATTERN.test(trimmedUsername)) {
        return {
            isValid: false,
            error: `❌ El nombre de usuario "${trimmedUsername}" contiene caracteres no permitidos.`,
            suggestion: 'Solo se permiten letras (a-z, A-Z), números (0-9) y guión bajo (_). Ejemplo: "juan_perez123"'
        };
    }
    
    // Validación 5: Solo números
    if (/^[0-9]+$/.test(trimmedUsername)) {
        return {
            isValid: false,
            error: '❌ El nombre de usuario no puede ser solo números.',
            suggestion: 'Incluye al menos una letra. Ejemplo: "juan123"'
        };
    }
    
    // Validación 6: Guiones bajos consecutivos
    if (/_{2,}/.test(trimmedUsername)) {
        return {
            isValid: false,
            error: '❌ El nombre de usuario no puede tener guiones bajos consecutivos.',
            suggestion: 'Usa un solo guión bajo entre palabras. Ejemplo: "juan_perez"'
        };
    }
    
    // Validación 7: Nombres reservados
    if (USERNAME_CONFIG.RESERVED_NAMES.includes(trimmedUsername.toLowerCase())) {
        return {
            isValid: false,
            error: `❌ El nombre de usuario "${trimmedUsername}" está reservado para el sistema.`,
            suggestion: 'Por favor, elige otro nombre de usuario.'
        };
    }
    
    // Validación 8: Palabras prohibidas
    const forbiddenCheck = detectForbiddenWords(trimmedUsername);
    if (forbiddenCheck.hasForbidden) {
        const isDang = forbiddenCheck.level === 'DANG';
        const errorMessage = isDang
            ? `❌ El nombre de usuario "${trimmedUsername}" contiene palabras inapropiadas o prohibidas.`
            : `⚠️ El nombre de usuario "${trimmedUsername}" contiene términos sensibles no permitidos.`;
        
        const suggestion = isDang
            ? `Tu nombre de usuario contiene términos no permitidos: ${forbiddenCheck.forbiddenWords.join(', ')}. Por favor, elige un nombre diferente.`
            : `Tu nombre de usuario contiene: ${forbiddenCheck.forbiddenWords.join(', ')}. Por favor, elige un nombre más apropiado para la comunidad.`;
        
        return {
            isValid: false,
            error: errorMessage,
            suggestion: suggestion,
            forbiddenWords: forbiddenCheck.forbiddenWords,
            level: forbiddenCheck.level
        };
    }
    
    // Validación 9: Que no comience o termine con guión bajo (opcional)
    if (trimmedUsername.startsWith('_') || trimmedUsername.endsWith('_')) {
        return {
            isValid: false,
            error: '❌ El nombre de usuario no puede comenzar o terminar con guión bajo.',
            suggestion: 'Ejemplo: "juan_perez" (sin _ al inicio o final)'
        };
    }
    
    // Todas las validaciones pasaron
    return {
        isValid: true,
        error: null,
        suggestion: null
    };
}

/**
 * Valida el username asincrónicamente verificando si ya existe en la base de datos
 * @param {string} username - El nombre de usuario a verificar
 * @param {Object} supabase - Instancia de Supabase
 * @returns {Promise<Object>} { isValid: boolean, error: string|null, suggestion: string|null }
 */
export async function validateUsernameAvailability(username, supabase) {
    // Primero validar reglas básicas
    const basicValidation = validateUsername(username);
    if (!basicValidation.isValid) {
        return basicValidation;
    }
    
    try {
        // Verificar si el username ya existe en la base de datos
        const { data, error } = await supabase
            .from('usuarios')
            .select('username')
            .eq('username', username.trim())
            .maybeSingle();
        
        if (error) throw error;
        
        if (data) {
            const suggestion = generateSuggestion(username) + (Math.floor(Math.random() * 1000));
            return {
                isValid: false,
                error: `❌ El nombre de usuario "${username}" ya está en uso.`,
                suggestion: `Sugerencia: "${suggestion}"`
            };
        }
        
        return {
            isValid: true,
            error: null,
            suggestion: null
        };
        
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        return {
            isValid: false,
            error: 'Error al verificar disponibilidad del nombre de usuario',
            suggestion: 'Intenta nuevamente más tarde'
        };
    }
}

/**
 * Valida el username completo (reglas + disponibilidad)
 * @param {string} username - El nombre de usuario a validar
 * @param {Object} supabase - Instancia de Supabase
 * @returns {Promise<Object>} { isValid: boolean, error: string|null, suggestion: string|null }
 */
export async function validateUsernameComplete(username, supabase) {
    return await validateUsernameAvailability(username, supabase);
}

// Exportar configuración para uso externo
export { USERNAME_CONFIG, generateSuggestion, detectForbiddenWords };
