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

// Solución preventiva para evitar que Chart.js ResizeObserver entre en bucles infinitos durante la impresión en Edge/Chrome
window.addEventListener('beforeprint', () => {
    try {
        if (window.ui && window.ui.currentChart) {
            window.ui.currentChart.destroy();
            window.ui.currentChart = null;
        }
    } catch (e) {
        console.error('Error al destruir gráfico antes de imprimir:', e);
    }
});

window.addEventListener('afterprint', () => {
    // Limpiar el contenedor de impresión
    const printContainer = document.getElementById('print-container');
    if (printContainer) {
        printContainer.innerHTML = '';
    }

    // Restaurar el modal si estaba abierto antes de imprimir
    if (window.ui && window.ui.wasModalOpenBeforePrint) {
        window.ui.wasModalOpenBeforePrint = false;
        window.ui.showModal(
            window.ui.modalTitleBeforePrint,
            window.ui.modalBodyBeforePrint,
            window.ui.modalFooterBeforePrint,
            window.ui.modalIsLargeBeforePrint
        );
    } else if (window.ui && window.ui.activeTab === 'dashboard') {
        const contentContainer = document.getElementById('view-content');
        if (contentContainer) {
            window.ui.renderDashboard(contentContainer);
        }
    }
});

