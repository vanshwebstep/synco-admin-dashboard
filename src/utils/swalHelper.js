import Swal from 'sweetalert2';

// --- Toast Configuration (Success) ---
const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#000', // Black background for toast
    color: '#fff',      // White text
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

/**
 * Show a Success Toast Notification
 * @param {string} title - The title of the alert
 * @param {string} [text] - Optional text description
 */
export const showSuccess = (title, text = '') => {
    return Toast.fire({
        icon: 'success',
        title: title,
        text: text,
        customClass: {
            popup: 'swal-toast-custom'
        }
    });
};

// --- Modal Configuration (Error, Warning, Confirm) ---
const Modal = Swal.mixin({
    customClass: {
        confirmButton: 'swal-confirm-btn',
        cancelButton: 'swal-cancel-btn',
        popup: 'swal-popup-custom',
        title: 'swal-title-custom',
        htmlContainer: 'swal-text-custom'
    },
    buttonsStyling: false,
    background: '#fff', // White modal background
    color: '#000'       // Black text default
});

/**
 * Export the configured mixin for custom usages (e.g. 3-button modals)
 */
export const ThemeSwal = Modal;

/**
 * Show an Error Modal
 * @param {string} title 
 * @param {string} text 
 */
export const showError = (title, text) => {
    return Modal.fire({
        icon: 'error',
        title: title,
        text: text,
        confirmButtonText: 'OK'
    });
};

/**
 * Show a Warning Modal
 * @param {string} title 
 * @param {string} text 
 */
export const showWarning = (title, text) => {
    return Modal.fire({
        icon: 'warning',
        title: title,
        text: text,
        confirmButtonText: 'OK'
    });
};

/**
 * Show a Confirmation Modal
 * @param {string} title 
 * @param {string} textOrHtml - Text or HTML content
 * @param {string} confirmText 
 * @param {boolean} isHtml - If true, treats second arg as HTML
 * @returns {Promise} - Resolves if confirmed
 */
export const showConfirm = (title, textOrHtml, confirmText = 'Yes, delete it!', isHtml = false) => {
    return Modal.fire({
        title: title,
        [isHtml ? 'html' : 'text']: textOrHtml,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel',
        reverseButtons: true
    });
};

/**
 * Show a Loading Modal
 * @param {string} title 
 * @param {string} html 
 */
export const showLoading = (title, html) => {
    return Modal.fire({
        title: title,
        html: html,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
};

export default {
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    showLoading,
    ThemeSwal
};
