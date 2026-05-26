// Punto de entrada de la aplicación y asignación de eventos principales

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar navegación por pestañas en la barra lateral
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;
            if (tabId) {
                window.ui.switchTab(tabId);
            }
        });
    });

    // Evento para cerrar modal al hacer clic en la X
    const modalCloseBtn = document.querySelector('.modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            window.ui.hideModal();
        });
    }

    // Evento para cerrar modal haciendo clic fuera de la ventana del modal
    const modalOverlay = document.getElementById('modal-overlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                window.ui.hideModal();
            }
        });
    }

    // Cargar la pestaña por defecto (Dashboard)
    window.ui.switchTab('dashboard');
});
