// validators/passwordValidator.js

/**
 * Configuración de validación de contraseña
 */
const PASSWORD_CONFIG = {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false // Opcional, se puede activar si se desea
};

/**
 * Valida la contraseña según las reglas
 */
export function validatePassword(password) {
    if (!password) {
        return {
            isValid: false,
            error: 'La contraseña no puede estar vacía.'
        };
    }
    
    if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
        return {
            isValid: false,
            error: `❌ La contraseña debe tener al menos ${PASSWORD_CONFIG.MIN_LENGTH} caracteres.`
        };
    }
    
    if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
        return {
            isValid: false,
            error: `❌ La contraseña no puede exceder los ${PASSWORD_CONFIG.MAX_LENGTH} caracteres.`
        };
    }
    
    if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
        return {
            isValid: false,
            error: '❌ La contraseña debe contener al menos una letra mayúscula.'
        };
    }
    
    if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
        return {
            isValid: false,
            error: '❌ La contraseña debe contener al menos una letra minúscula.'
        };
    }
    
    if (PASSWORD_CONFIG.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
        return {
            isValid: false,
            error: '❌ La contraseña debe contener al menos un número.'
        };
    }
    
    if (PASSWORD_CONFIG.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return {
            isValid: false,
            error: '❌ La contraseña debe contener al menos un carácter especial.'
        };
    }
    
    return {
        isValid: true,
        error: null
    };
}

/**
 * Valida que las contraseñas coincidan
 */
export function validatePasswordMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
        return {
            isValid: false,
            error: '❌ Las contraseñas no coinciden.'
        };
    }
    
    return {
        isValid: true,
        error: null
    };
}
