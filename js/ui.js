// Manejo de Interfaz de Usuario, tablas dinámicas, modales y renderizado SPA

class ObraUI {
    constructor() {
        this.activeTab = 'dashboard';
        this.currentChart = null;
        this.budgetBuilderItems = []; // Almacena ítems en edición de presupuesto
        this.apuBuilderMateriales = []; // Almacena materiales en edición de APU
        this.apuBuilderManoObra = []; // Almacena mano de obra en edición de APU
    }

    // --- ENRUTADOR LOCAL (TAB SWITCHING) ---
    switchTab(tabId) {
        this.activeTab = tabId;
        
        // Destruir gráfico activo preventivamente si cambiamos de pestaña para evitar observers huérfanos
        if (tabId !== 'dashboard' && this.currentChart) {
            try {
                this.currentChart.destroy();
                this.currentChart = null;
            } catch (e) {
                console.error("Error al destruir el gráfico al cambiar de pestaña:", e);
            }
        }
        
        // Actualizar UI del menú lateral
        document.querySelectorAll('.nav-item').forEach(item => {
            if (item.dataset.tab === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Renderizar vista correspondiente
        const contentContainer = document.getElementById('view-content');
        contentContainer.innerHTML = '<div class="loading">Cargando...</div>';

        setTimeout(() => {
            switch(tabId) {
                case 'dashboard':
                    this.renderDashboard(contentContainer);
                    break;
                case 'budgets':
                    this.renderBudgets(contentContainer);
                    break;
                case 'apu':
                    this.renderApu(contentContainer);
                    break;
                case 'materials':
                    this.renderMaterials(contentContainer);
                    break;
                case 'labor':
                    this.renderLabor(contentContainer);
                    break;
                case 'pdf-settings':
                    this.renderPdfSettings(contentContainer);
                    break;
                case 'settings':
                    this.renderSettings(contentContainer);
                    break;
            }
            lucide.createIcons();
        }, 50);
    }

    // --- RENDER DASHBOARD ---
    renderDashboard(container) {
        const budgets = window.db.getBudgets();
        const materials = window.db.getMaterials();
        const labor = window.db.getLabor();
        const apus = window.db.getApuItems();

        const totalPresupuestos = budgets.length;
        const totalAprobados = budgets.filter(b => b.estado === 'Aprobado').length;
        
        // Calcular volumen total presupuestado histórico
        const totalFacturadoHistorico = budgets
            .filter(b => b.estado === 'Aprobado' || b.estado === 'Enviado')
            .reduce((sum, b) => sum + b.total, 0);

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Panel de Control</h1>
                    <p class="view-subtitle">Resumen de tus bases de datos y presupuestación</p>
                </div>
                <button class="btn btn-primary" onclick="window.ui.openNewBudgetWizard()">
                    <i data-lucide="plus-circle"></i> Nuevo Presupuesto
                </button>
            </div>

            <!-- Métricas Grid -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon indigo">
                        <i data-lucide="file-text"></i>
                    </div>
                    <div class="metric-info">
                        <div class="metric-label">Presupuestos</div>
                        <div class="metric-value">${totalPresupuestos}</div>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon emerald">
                        <i data-lucide="check-circle-2"></i>
                    </div>
                    <div class="metric-info">
                        <div class="metric-label">Aprobados</div>
                        <div class="metric-value">${totalAprobados}</div>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon emerald">
                        <i data-lucide="dollar-sign"></i>
                    </div>
                    <div class="metric-info">
                        <div class="metric-label">Total Cotizado</div>
                        <div class="metric-value">$${this.formatCurrency(totalFacturadoHistorico)}</div>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon amber">
                        <i data-lucide="layers"></i>
                    </div>
                    <div class="metric-info">
                        <div class="metric-label">Items APU</div>
                        <div class="metric-value">${apus.length}</div>
                    </div>
                </div>
            </div>

            <!-- Grid de Contenido Principal -->
            <div class="dashboard-grid">
                <!-- Presupuestos Recientes -->
                <div class="card">
                    <div class="card-title">
                        <span>Presupuestos Recientes</span>
                        <button class="btn btn-secondary btn-sm" onclick="window.ui.switchTab('budgets')">Ver Todos</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Cliente / Obra</th>
                                    <th>Fecha</th>
                                    <th>Total</th>
                                    <th>Estado</th>
                                    <th class="text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${budgets.slice(-5).reverse().map(b => `
                                    <tr>
                                        <td><strong>${b.codigo}</strong></td>
                                        <td>
                                            <div style="font-weight: 500;">${b.cliente}</div>
                                            <div style="font-size: 0.8rem; color: var(--text-muted);">${b.proyecto}</div>
                                        </td>
                                        <td>${b.fecha}</td>
                                        <td class="text-accent" style="font-weight:600;">$${this.formatCurrency(b.total)}</td>
                                        <td>
                                            <span class="badge ${this.getStatusBadgeClass(b.estado)}">${b.estado}</span>
                                        </td>
                                        <td class="text-right">
                                            <button class="btn btn-secondary btn-sm" onclick="window.ui.viewBudgetDetails('${b.id}')">
                                                <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No hay presupuestos creados aún.</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Resumen de Bases de Datos e Inventario -->
                <div class="card">
                    <div class="card-title">Inventario General</div>
                    <div class="chart-wrapper">
                        <canvas id="inventoryChart"></canvas>
                    </div>
                    <div class="apu-totals-block" style="border-top:none; padding-top:0; margin-top:20px;">
                        <div class="total-row">
                            <span>Materiales en Sistema:</span>
                            <strong>${materials.length} ítems</strong>
                        </div>
                        <div class="total-row">
                            <span>Mano de Obra en Sistema:</span>
                            <strong>${labor.length} roles</strong>
                        </div>
                        <div class="total-row">
                            <span>Relaciones APU Activas:</span>
                            <strong>${apus.length} rubros</strong>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderInventoryChart(materials, labor, apus);
    }

    renderInventoryChart(materials, labor, apus) {
        const ctx = document.getElementById('inventoryChart').getContext('2d');
        if (this.currentChart) {
            this.currentChart.destroy();
        }

        // Categorías de materiales más comunes
        const catMap = {};
        materials.forEach(m => {
            catMap[m.categoria] = (catMap[m.categoria] || 0) + 1;
        });

        const labels = ['M. Obra', ...Object.keys(catMap)];
        const data = [labor.length, ...Object.values(catMap)];

        this.currentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#6366f1', // Indigo
                        '#10b981', // Emerald
                        '#3b82f6', // Blue
                        '#f59e0b', // Amber
                        '#ec4899', // Pink
                        '#8b5cf6', // Violet
                        '#14b8a6'  // Teal
                    ],
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.05)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#9ca3af',
                            font: {
                                family: 'Plus Jakarta Sans',
                                size: 10
                            }
                        }
                    }
                }
            }
        });
    }

    // --- VIEW BUDGETS ---
    renderBudgets(container) {
        const budgets = window.db.getBudgets();

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Presupuestos</h1>
                    <p class="view-subtitle">Administra y crea ofertas comerciales para tus clientes</p>
                </div>
                <div class="flex-gap-12">
                    <button class="btn btn-secondary" onclick="window.ui.openImportBudgetWizard()">
                        <i data-lucide="upload"></i> Subir Presupuesto
                    </button>
                    <button class="btn btn-primary" onclick="window.ui.openNewBudgetWizard()">
                        <i data-lucide="plus"></i> Nuevo Presupuesto
                    </button>
                </div>
            </div>

            <!-- Filtros -->
            <div class="search-filter-row">
                <div class="search-input-wrapper">
                    <i data-lucide="search"></i>
                    <input type="text" id="budgetSearch" placeholder="Buscar por cliente, obra o código..." oninput="window.ui.filterBudgets()">
                </div>
                <select id="budgetStatusFilter" onchange="window.ui.filterBudgets()" style="width: 200px;">
                    <option value="">Todos los Estados</option>
                    <option value="Borrador">Borrador</option>
                    <option value="Enviado">Enviado</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="Rechazado">Rechazado</option>
                </select>
            </div>

            <div class="card">
                <div class="table-container">
                    <table id="budgetsTable">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Cliente</th>
                                <th>Proyecto / Obra</th>
                                <th>Fecha</th>
                                <th>Subtotal</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th class="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.getBudgetsTableRows(budgets)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getBudgetsTableRows(budgets) {
        return budgets.reverse().map(b => `
            <tr data-id="${b.id}" data-search="${(b.cliente + ' ' + b.proyecto + ' ' + b.codigo).toLowerCase()}" data-estado="${b.estado}">
                <td><strong>${b.codigo}</strong></td>
                <td style="font-weight: 600;">${b.cliente}</td>
                <td>${b.proyecto}</td>
                <td>${b.fecha}</td>
                <td>$${this.formatCurrency(b.subtotal)}</td>
                <td class="text-accent" style="font-weight: 700;">$${this.formatCurrency(b.total)}</td>
                <td>
                    <span class="badge ${this.getStatusBadgeClass(b.estado)}">${b.estado}</span>
                </td>
                <td class="text-right">
                    <div class="flex-gap-12" style="justify-content: flex-end;">
                        <button class="btn btn-secondary btn-sm" title="Ver Detalle / Imprimir" onclick="window.ui.viewBudgetDetails('${b.id}')">
                            <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" title="Eliminar" onclick="window.ui.deleteBudget('${b.id}')">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('') || '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No se encontraron presupuestos.</td></tr>';
    }

    filterBudgets() {
        const query = document.getElementById('budgetSearch').value.toLowerCase();
        const status = document.getElementById('budgetStatusFilter').value;
        const rows = document.querySelectorAll('#budgetsTable tbody tr');

        rows.forEach(row => {
            if (row.cells.length === 1) return; // skip row of empty items
            const searchData = row.dataset.search || '';
            const rowStatus = row.dataset.estado || '';
            
            const matchesSearch = searchData.includes(query);
            const matchesStatus = !status || rowStatus === status;

            if (matchesSearch && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    deleteBudget(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este presupuesto? Esta acción no se puede deshacer.')) {
            window.db.deleteBudget(id);
            this.switchTab('budgets');
        }
    }

    // --- VER DETALLES DE PRESUPUESTO & PDF PREVIEW ---
    viewBudgetDetails(id) {
        const budgets = window.db.getBudgets();
        const budget = budgets.find(b => b.id === id);
        if (!budget) return;

        const comp = window.db.getCompanySettings();
        const colorPdf = comp.colorPdf || '#6366f1';
        const hasLogo = !!comp.logo;
        const logoPos = comp.logoPos || 'left';
        
        // Estilo del Logo
        const logoHtml = hasLogo ? `<img src="${comp.logo}" alt="Logo" style="max-height:55px; max-width:130px; object-fit:contain; border-radius:4px;">` : '';

        // Estructura de información de empresa
        const companyInfoHtml = `
            <div style="text-align: left;">
                <div style="font-size:1.3rem; font-weight:700; color:${colorPdf};">${comp.nombre}</div>
                <div style="font-size:0.8rem; color:var(--text-muted); font-weight:500;">${comp.subtitulo}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
                    ${comp.direccion ? `📍 ${comp.direccion}` : ''}
                    ${comp.telefono ? ` | 📞 ${comp.telefono}` : ''}
                    ${comp.email ? ` | ✉️ ${comp.email}` : ''}
                </div>
            </div>
        `;

        let headerLeftHtml = '';
        let headerRightHtml = '';

        if (logoPos === 'right') {
            headerLeftHtml = companyInfoHtml;
            headerRightHtml = `
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
                    ${logoHtml}
                    <div style="text-align:right;">
                        <h3 style="font-family:var(--font-heading); font-size:1.2rem; color:${colorPdf};">${budget.codigo}</h3>
                        <p style="font-size:0.85rem; color:var(--text-muted);">Fecha: ${budget.fecha}</p>
                    </div>
                </div>
            `;
        } else {
            headerLeftHtml = `
                <div style="display:flex; align-items:center; gap:16px;">
                    ${logoHtml}
                    ${companyInfoHtml}
                </div>
            `;
            headerRightHtml = `
                <div style="text-align:right;">
                    <h3 style="font-family:var(--font-heading); font-size:1.2rem; color:${colorPdf};">${budget.codigo}</h3>
                    <p style="font-size:0.85rem; color:var(--text-muted);">Fecha: ${budget.fecha}</p>
                </div>
            `;
        }

        // Construir contenido modal
        const bodyHtml = `
            <div id="printable-area" style="--pdf-primary-color: ${colorPdf};">
                <!-- Encabezado del Presupuesto (Dinámico) -->
                <div style="display:flex; justify-content:space-between; border-bottom:2px solid ${colorPdf}; padding-bottom:16px; margin-bottom:20px; align-items:center;">
                    ${headerLeftHtml}
                    ${headerRightHtml}
                </div>

                <!-- Detalles Cliente -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                    <div style="padding:12px 16px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-md);">
                        <h4 style="font-family:var(--font-heading); color:${colorPdf}; margin-bottom:4px; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px;">Información del Cliente</h4>
                        <p style="font-weight:600; font-size:1rem; color:var(--text-main);">${budget.cliente}</p>
                        <p style="color:var(--text-muted); font-size:0.85rem; margin-top:2px;">Proyecto: ${budget.proyecto}</p>
                    </div>
                    <div style="padding:12px 16px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:var(--radius-md); display:flex; flex-direction:column; justify-content:center;">
                        <p style="font-size:0.85rem; color:var(--text-muted);">Presupuesto N°: <strong style="color:var(--text-main);">${budget.codigo}</strong></p>
                        <p style="font-size:0.85rem; color:var(--text-muted); margin-top:2px;">Fecha de Emisión: <strong style="color:var(--text-main);">${budget.fecha}</strong></p>
                    </div>
                </div>

                <!-- Tabla de Ítems del Presupuesto -->
                <div class="card" style="padding:0; overflow:hidden; border-radius:var(--radius-md); margin-bottom:20px;">
                    <table style="width:100%;">
                        <thead>
                            <tr style="background:rgba(255,255,255,0.01); border-bottom:1.5px solid ${colorPdf};">
                                <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-muted);">Item / Rubro</th>
                                <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-muted);">Unidad</th>
                                <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-muted); text-align:right;">Cantidad</th>
                                <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-muted); text-align:right;">P. Unitario (APU)</th>
                                <th style="padding:12px 16px; font-size:0.8rem; color:var(--text-muted); text-align:right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${budget.items.map(item => `
                                <tr>
                                    <td style="padding:12px 16px;">
                                        <div style="font-weight:600; color:var(--text-main);">${item.nombre}</div>
                                        <div style="font-size:0.75rem; color:var(--text-muted);" class="no-print">
                                            Composición: ${item.materialesCopia ? item.materialesCopia.length : 0} materiales, ${item.manoObraCopia ? item.manoObraCopia.length : 0} mano de obra.
                                        </div>
                                    </td>
                                    <td style="padding:12px 16px;">${item.unidad}</td>
                                    <td style="padding:12px 16px; text-align:right;">${item.cantidad}</td>
                                    <td style="padding:12px 16px; text-align:right;">$${this.formatCurrency(item.precioUnitarioHistorico)}</td>
                                    <td style="padding:12px 16px; text-align:right; font-weight:600; color:var(--text-main);">$${this.formatCurrency(item.cantidad * item.precioUnitarioHistorico)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Totales del Presupuesto -->
                <div style="display:flex; justify-content:flex-end; margin-top:20px; margin-bottom:24px;">
                    <div style="width:300px; display:flex; flex-direction:column; gap:10px; padding:16px; background:rgba(255,255,255,0.01); border:1px solid var(--border-color); border-radius:var(--radius-md);">
                        <div class="total-row" style="font-size:0.85rem;">
                            <span style="color:var(--text-muted);">Costo Base:</span>
                            <span style="color:var(--text-main); font-weight:500;">$${this.formatCurrency(budget.subtotal)}</span>
                        </div>
                        <div class="total-row" style="font-size:0.85rem;">
                            <span style="color:var(--text-muted);">Margen Comercial (${budget.margenGanancia}%):</span>
                            <span style="color:var(--text-main); font-weight:500;">$${this.formatCurrency(budget.subtotal * (budget.margenGanancia / 100))}</span>
                        </div>
                        <div class="total-row" style="border-bottom:1px solid var(--border-color); padding-bottom:8px; font-size:0.85rem;">
                            <span style="color:var(--text-muted);">Impuestos (${budget.impuestos}%):</span>
                            <span style="color:var(--text-main); font-weight:500;">$${this.formatCurrency((budget.subtotal + (budget.subtotal * (budget.margenGanancia / 100))) * (budget.impuestos / 100))}</span>
                        </div>
                        <div class="total-row grand-total" style="border-top:none; padding-top:0; font-size:1.2rem;">
                            <span>Total Final:</span>
                            <span style="color:${colorPdf}; font-weight:bold;">$${this.formatCurrency(budget.total)}</span>
                        </div>
                    </div>
                </div>

                <!-- Notas de Condiciones Comerciales (Dinámicas) -->
                ${comp.notasPie ? `
                    <div style="border-top:1px dashed var(--border-color); padding-top:12px; font-size:0.8rem; color:var(--text-muted);">
                        <h4 style="font-family:var(--font-heading); color:${colorPdf}; font-size:0.85rem; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Condiciones del Presupuesto</h4>
                        <div style="white-space:pre-wrap; line-height:1.4;">${comp.notasPie}</div>
                    </div>
                ` : ''}

                <!-- Desglose de Análisis de Precios Unitarios (APU) adjuntos (Solo pantalla, ayuda a poner precios) -->
                <div class="no-print" style="margin-top:40px; border-top:1px solid var(--border-color); padding-top:24px;">
                    <h3 style="font-family:var(--font-heading); font-size:1.15rem; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
                        <i data-lucide="info" style="color:var(--color-primary); width:18px;"></i> Desglose Técnico del Presupuesto (APU Histórico)
                    </h3>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:16px;">
                        A continuación se muestra el desglose exacto de materiales y mano de obra con el que se cotizó este presupuesto originalmente. Esto sirve de guía de precios unitarios.
                    </p>
                    
                    ${budget.items.map(item => `
                        <div class="card" style="margin-bottom:16px; padding:16px; background:rgba(0,0,0,0.15);">
                            <div style="display:flex; justify-content:space-between; margin-bottom:12px; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                                <span style="font-weight:600;">${item.nombre} (por ${item.unidad})</span>
                                <span style="color:${colorPdf}; font-weight:600;">P.U. Histórico: $${this.formatCurrency(item.precioUnitarioHistorico)}</span>
                            </div>
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; font-size:0.8rem;">
                                <div>
                                    <div style="font-weight:600; color:var(--color-accent); margin-bottom:6px;">Materiales</div>
                                    ${item.materialesCopia ? item.materialesCopia.map(m => `
                                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                            <span>• ${m.nombre} (${m.rendimiento} ${m.unidad})</span>
                                            <span style="color:var(--text-muted);">$${this.formatCurrency(m.precioUnitario)}/u</span>
                                        </div>
                                    `).join('') : '<span style="color:var(--text-muted);">Sin materiales</span>'}
                                </div>
                                <div>
                                    <div style="font-weight:600; color:var(--color-primary); margin-bottom:6px;">Mano de Obra</div>
                                    ${item.manoObraCopia ? item.manoObraCopia.map(l => `
                                        <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                                            <span>• ${l.nombre} (${l.rendimiento} ${l.unidad})</span>
                                            <span style="color:var(--text-muted);">$${this.formatCurrency(l.precioUnitario)}/u</span>
                                        </div>
                                    `).join('') : '<span style="color:var(--text-muted);">Sin mano de obra</span>'}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        const footerHtml = `
            <div style="display:flex; justify-content:space-between; width:100%;">
                <div>
                    <select id="updateStatusSelect" onchange="window.ui.updateBudgetStatus('${budget.id}', this.value)" style="width:160px; padding:6px 12px; font-size:0.85rem;">
                        <option value="Borrador" ${budget.estado === 'Borrador' ? 'selected' : ''}>Borrador</option>
                        <option value="Enviado" ${budget.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
                        <option value="Aprobado" ${budget.estado === 'Aprobado' ? 'selected' : ''}>Aprobado</option>
                        <option value="Rechazado" ${budget.estado === 'Rechazado' ? 'selected' : ''}>Rechazado</option>
                    </select>
                </div>
                <div class="flex-gap-12">
                    <button class="btn btn-secondary" onclick="window.ui.printBudget()">
                        <i data-lucide="printer"></i> Imprimir / Guardar PDF
                    </button>
                    <button class="btn btn-primary" onclick="window.ui.hideModal()">Cerrar</button>
                </div>
            </div>
        `;

        this.showModal(`Detalle de Presupuesto - ${budget.codigo}`, bodyHtml, footerHtml, true);
        lucide.createIcons();
    }

    updateBudgetStatus(id, newStatus) {
        const budgets = window.db.getBudgets();
        const budget = budgets.find(b => b.id === id);
        if (budget) {
            budget.estado = newStatus;
            window.db.saveBudget(budget);
            
            // Refrescar tabla en el fondo
            if (this.activeTab === 'budgets') {
                this.renderBudgets(document.getElementById('view-content'));
            } else if (this.activeTab === 'dashboard') {
                this.renderDashboard(document.getElementById('view-content'));
            }
            lucide.createIcons();
        }
    }

    printBudget() {
        const printableArea = document.getElementById('printable-area');
        const printContainer = document.getElementById('print-container');
        if (printableArea && printContainer) {
            // Guardar el estado del modal antes de imprimir para poder restaurarlo después
            this.wasModalOpenBeforePrint = true;
            this.modalTitleBeforePrint = document.getElementById('modal-title').innerText;
            this.modalBodyBeforePrint = document.getElementById('modal-body').innerHTML;
            this.modalFooterBeforePrint = document.getElementById('modal-footer').innerHTML;
            this.modalIsLargeBeforePrint = document.querySelector('.modal-container').classList.contains('large-modal');

            // Copiar el contenido al contenedor aislado de impresión
            printContainer.innerHTML = printableArea.innerHTML;
            
            // Ocultar modal para limpiar el DOM de backdrop-filters y transiciones que cuelgan a Chromium
            this.hideModal();
            
            // Esperar a que la transición de cierre del modal termine (300ms) antes de abrir el diálogo de impresión
            setTimeout(() => {
                window.print();
            }, 300);
        } else {
            window.print();
        }
    }

    // --- WIZARD / BUILDER DE PRESUPUESTOS ---
    openNewBudgetWizard() {
        const apus = window.db.getApuItems();
        const materials = window.db.getMaterials();
        const labor = window.db.getLabor();

        this.budgetBuilderItems = []; // Resetear ítems

        const bodyHtml = `
            <div class="budget-builder-layout">
                <!-- Formulario General e Ítems -->
                <div>
                    <div class="card" style="margin-bottom:16px;">
                        <h4 style="margin-bottom:16px; font-family:var(--font-heading);">Información General</h4>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="bldClient">Cliente</label>
                                <input type="text" id="bldClient" placeholder="e.g. Juan Pérez o Empresa S.A." required>
                            </div>
                            <div class="form-group">
                                <label for="bldProject">Obra / Proyecto</label>
                                <input type="text" id="bldProject" placeholder="e.g. Remodelación Baño" required>
                            </div>
                            <div class="form-group">
                                <label for="bldDate">Fecha</label>
                                <input type="date" id="bldDate" value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h4 style="margin-bottom:16px; font-family:var(--font-heading); display:flex; justify-content:space-between; align-items:center;">
                            <span>Ítems a Presupuestar</span>
                            <button class="btn btn-secondary btn-sm" onclick="window.ui.addEmptyBuilderItemRow()">
                                <i data-lucide="plus"></i> Agregar Fila
                            </button>
                        </h4>
                        
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:40%;">Rubro APU</th>
                                        <th style="width:10%;">Unidad</th>
                                        <th style="width:15%; text-align:right;">Cantidad</th>
                                        <th style="width:20%; text-align:right;">Precio Unitario APU</th>
                                        <th style="width:15%; text-align:right;">Subtotal</th>
                                        <th style="width:10%;"></th>
                                    </tr>
                                </thead>
                                <tbody id="builderItemsTableBody">
                                    <!-- Filas dinámicas -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Totales y Precios de Referencia -->
                <div>
                    <div class="card budget-totals-card">
                        <h4 style="margin-bottom:16px; font-family:var(--font-heading);">Cálculo del Total</h4>
                        
                        <div class="form-group">
                            <label for="bldMargin">Margen Comercial / Ganancia (%)</label>
                            <input type="number" id="bldMargin" value="20" min="0" oninput="window.ui.calculateBuilderTotals()">
                        </div>
                        <div class="form-group">
                            <label for="bldTaxes">Impuestos / IVA (%)</label>
                            <input type="number" id="bldTaxes" value="21" min="0" oninput="window.ui.calculateBuilderTotals()">
                        </div>

                        <div class="apu-totals-block" style="margin-top:20px;">
                            <div class="total-row">
                                <span style="color:var(--text-muted);">Costo Base:</span>
                                <span id="bldSubtotalVal">$0.00</span>
                            </div>
                            <div class="total-row">
                                <span style="color:var(--text-muted);">Ganancia:</span>
                                <span id="bldMarginVal">$0.00</span>
                            </div>
                            <div class="total-row" style="border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                                <span style="color:var(--text-muted);">Impuestos:</span>
                                <span id="bldTaxesVal">$0.00</span>
                            </div>
                            <div class="total-row grand-total" style="border-top:none; padding-top:0;">
                                <span>Total Final:</span>
                                <span id="bldTotalVal" style="color:var(--color-accent); font-weight:bold;">$0.00</span>
                            </div>
                        </div>
                    </div>

                    <!-- Panel de Ayuda Unitarios -->
                    <div class="card" style="margin-top:16px; padding:16px;">
                        <h4 style="font-size:0.9rem; font-family:var(--font-heading); margin-bottom:10px; color:var(--color-primary); display:flex; align-items:center; gap:6px;">
                            <i data-lucide="help-circle" style="width:16px;"></i> Guía de Precios Históricos
                        </h4>
                        <div id="historicalPriceHelper" style="font-size:0.8rem; color:var(--text-muted);">
                            Selecciona un rubro APU en la tabla para ver el historial de precios unitarios con los que has facturado ese ítem anteriormente.
                        </div>
                    </div>
                </div>
            </div>
        `;

        const footerHtml = `
            <div class="flex-gap-12">
                <button class="btn btn-secondary" onclick="window.ui.hideModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="window.ui.saveNewBudget()">Guardar Presupuesto</button>
            </div>
        `;

        this.showModal('Nuevo Presupuesto de Obra', bodyHtml, footerHtml, true);
        this.addEmptyBuilderItemRow(); // Iniciar con una fila vacía
        lucide.createIcons();
    }

    addEmptyBuilderItemRow() {
        const tableBody = document.getElementById('builderItemsTableBody');
        const apus = window.db.getApuItems();
        const materials = window.db.getMaterials();
        const labor = window.db.getLabor();

        const rowIndex = this.budgetBuilderItems.length;
        this.budgetBuilderItems.push({
            itemApuId: '',
            cantidad: 1,
            precioUnitario: 0
        });

        const tr = document.createElement('tr');
        tr.id = `bldRow-${rowIndex}`;
        tr.innerHTML = `
            <td>
                <select class="bld-item-select" onchange="window.ui.onBuilderItemChange(${rowIndex}, this.value)" style="width:100%;">
                    <option value="">-- Seleccionar Rubro --</option>
                    ${apus.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
                </select>
            </td>
            <td>
                <span class="bld-item-unit badge badge-secondary" id="bldUnit-${rowIndex}">-</span>
            </td>
            <td>
                <input type="number" class="bld-item-qty text-right" value="1" min="0.01" step="any" oninput="window.ui.onBuilderQtyChange(${rowIndex}, this.value)" style="padding:8px;">
            </td>
            <td>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="color:var(--text-muted); font-size:0.9rem;">$</span>
                    <input type="number" class="bld-item-price text-right" value="0" min="0" step="any" oninput="window.ui.onBuilderPriceChange(${rowIndex}, this.value)" style="padding:8px;">
                </div>
            </td>
            <td class="text-right" style="font-weight:600; padding:12px 16px;">
                <span id="bldSubtotal-${rowIndex}">$0.00</span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="window.ui.removeBuilderRow(${rowIndex})" style="padding:4px 8px;">
                    <i data-lucide="x" style="width:14px;"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
        lucide.createIcons();
    }

    removeBuilderRow(index) {
        const tr = document.getElementById(`bldRow-${index}`);
        if (tr) {
            tr.remove();
            this.budgetBuilderItems[index] = null; // Marcar como nulo
            this.calculateBuilderTotals();
        }
    }

    onBuilderItemChange(index, apuId) {
        if (!apuId) {
            this.budgetBuilderItems[index].itemApuId = '';
            this.budgetBuilderItems[index].precioUnitario = 0;
            document.getElementById(`bldUnit-${index}`).innerText = '-';
            document.getElementById(`bldSubtotal-${index}`).innerText = '$0.00';
            this.calculateBuilderTotals();
            return;
        }

        const apus = window.db.getApuItems();
        const apu = apus.find(a => a.id === apuId);
        if (!apu) return;

        // Calcular precio unitario actual usando el APU Engine
        const materials = window.db.getMaterials();
        const labor = window.db.getLabor();
        const apuPriceDetails = window.apuEngine.calculateItemPrice(apu, materials, labor);

        this.budgetBuilderItems[index].itemApuId = apuId;
        this.budgetBuilderItems[index].precioUnitario = apuPriceDetails.precioUnitario;

        // Actualizar UI
        document.getElementById(`bldUnit-${index}`).innerText = apu.unidad;
        const priceInput = document.querySelector(`#bldRow-${index} .bld-item-price`);
        priceInput.value = Math.round(apuPriceDetails.precioUnitario * 100) / 100;

        // Calcular subtotal de fila
        const qty = parseFloat(document.querySelector(`#bldRow-${index} .bld-item-qty`).value) || 0;
        const rowSubtotal = qty * apuPriceDetails.precioUnitario;
        document.getElementById(`bldSubtotal-${index}`).innerText = `$${this.formatCurrency(rowSubtotal)}`;

        // Mostrar Guía de Precios Históricos para este rubro
        this.showHistoricalPriceHelper(apuId, apuPriceDetails.precioUnitario);

        this.calculateBuilderTotals();
    }

    onBuilderQtyChange(index, value) {
        const qty = parseFloat(value) || 0;
        this.budgetBuilderItems[index].cantidad = qty;
        
        const price = this.budgetBuilderItems[index].precioUnitario;
        const subtotal = qty * price;
        document.getElementById(`bldSubtotal-${index}`).innerText = `$${this.formatCurrency(subtotal)}`;

        this.calculateBuilderTotals();
    }

    onBuilderPriceChange(index, value) {
        const price = parseFloat(value) || 0;
        this.budgetBuilderItems[index].precioUnitario = price;

        const qty = this.budgetBuilderItems[index].cantidad;
        const subtotal = qty * price;
        document.getElementById(`bldSubtotal-${index}`).innerText = `$${this.formatCurrency(subtotal)}`;

        this.calculateBuilderTotals();
    }

    showHistoricalPriceHelper(apuId, currentCalculatedPrice) {
        const budgets = window.db.getBudgets();
        const priceGuide = window.apuEngine.getPriceGuide(apuId, currentCalculatedPrice, budgets);

        const container = document.getElementById('historicalPriceHelper');
        
        if (priceGuide.historial.length === 0) {
            container.innerHTML = `
                <div style="background:rgba(99,102,241,0.05); padding:8px; border-radius:4px; border-left:3px solid var(--color-primary);">
                    <p style="font-weight:600; color:var(--text-main); margin-bottom:4px;">Sin historial de cobro</p>
                    <p>Es la primera vez que presupuestas este ítem. Se sugiere usar el precio calculado de APU: <strong>$${this.formatCurrency(currentCalculatedPrice)}</strong>.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div style="background:rgba(16,185,129,0.05); padding:8px; border-radius:4px; border-left:3px solid var(--color-accent);">
                    <span style="font-weight:600; color:var(--text-main);">Sugerido: $${this.formatCurrency(priceGuide.sugerido)}</span>
                    <span style="font-size:0.75rem; display:block; color:var(--text-muted); margin-top:2px;">(Basado en inflación / último cobro)</span>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:0.75rem; border-top:1px solid var(--border-color); padding-top:8px;">
                    <div>Mínimo: <strong>$${this.formatCurrency(priceGuide.historicoMin)}</strong></div>
                    <div>Máximo: <strong>$${this.formatCurrency(priceGuide.historicoMax)}</strong></div>
                    <div style="grid-column: span 2;">Promedio Histórico: <strong>$${this.formatCurrency(priceGuide.historicoPromedio)}</strong></div>
                </div>
                
                <div style="font-weight:600; margin-top:6px; font-size:0.75rem; text-transform:uppercase; color:var(--text-muted);">Últimos Presupuestos:</div>
                <div style="max-height:120px; overflow-y:auto; display:flex; flex-direction:column; gap:4px;">
                    ${priceGuide.historial.slice(0, 3).map(h => `
                        <div class="history-item" style="font-size:0.75rem; border-bottom:1px dashed var(--border-color); padding:4px 0;">
                            <span>${h.codigo} (${h.fecha})</span>
                            <strong style="color:var(--text-main);">$${this.formatCurrency(h.precioUnitario)}</strong>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    calculateBuilderTotals() {
        let subtotal = 0;
        this.budgetBuilderItems.forEach(item => {
            if (item) {
                subtotal += item.cantidad * item.precioUnitario;
            }
        });

        const margin = parseFloat(document.getElementById('bldMargin').value) || 0;
        const taxes = parseFloat(document.getElementById('bldTaxes').value) || 0;

        const marginVal = subtotal * (margin / 100);
        const subtotalConMargin = subtotal + marginVal;
        const taxesVal = subtotalConMargin * (taxes / 100);
        const total = subtotalConMargin + taxesVal;

        document.getElementById('bldSubtotalVal').innerText = `$${this.formatCurrency(subtotal)}`;
        document.getElementById('bldMarginVal').innerText = `$${this.formatCurrency(marginVal)}`;
        document.getElementById('bldTaxesVal').innerText = `$${this.formatCurrency(taxesVal)}`;
        document.getElementById('bldTotalVal').innerText = `$${this.formatCurrency(total)}`;
    }

    saveNewBudget() {
        const client = document.getElementById('bldClient').value.trim();
        const project = document.getElementById('bldProject').value.trim();
        const date = document.getElementById('bldDate').value;
        const margin = parseFloat(document.getElementById('bldMargin').value) || 0;
        const taxes = parseFloat(document.getElementById('bldTaxes').value) || 0;

        if (!client || !project || !date) {
            alert('Por favor completa todos los campos del encabezado (Cliente, Proyecto y Fecha).');
            return;
        }

        // Filtrar ítems vacíos y armar lista final con copia del APU
        const apus = window.db.getApuItems();
        const materials = window.db.getMaterials();
        const labor = window.db.getLabor();

        const itemsFinal = [];
        
        for (let item of this.budgetBuilderItems) {
            if (item && item.itemApuId) {
                const apu = apus.find(a => a.id === item.itemApuId);
                if (!apu) continue;

                // Crear copia detallada del desglose de este APU en este momento
                const priceDetails = window.apuEngine.calculateItemPrice(apu, materials, labor);
                
                const materialesCopia = priceDetails.materiales.map(m => ({
                    nombre: m.nombre,
                    unidad: m.unidad,
                    rendimiento: m.rendimiento,
                    precioUnitario: m.precioUnitario
                }));

                const manoObraCopia = priceDetails.manoDeObra.map(l => ({
                    nombre: l.nombre,
                    unidad: l.unidad,
                    rendimiento: l.rendimiento,
                    precioUnitario: l.precioUnitario
                }));

                itemsFinal.push({
                    id: 'item-bld-' + Date.now() + Math.random().toString(36).substr(2, 5),
                    itemApuId: item.itemApuId,
                    nombre: apu.nombre,
                    unidad: apu.unidad,
                    cantidad: item.cantidad,
                    precioUnitarioHistorico: item.precioUnitario, // Guardar el precio final de cotización
                    materialesCopia,
                    manoObraCopia,
                    costoAdicionalPorcentaje: apu.costoAdicionalPorcentaje
                });
            }
        }

        if (itemsFinal.length === 0) {
            alert('Por favor agrega al menos un ítem / rubro válido con su precio.');
            return;
        }

        // Calcular totales finales
        const totals = window.apuEngine.calculateBudgetTotals(itemsFinal, margin, taxes);

        const newBudget = {
            cliente: client,
            proyecto: project,
            fecha: date,
            estado: 'Borrador',
            items: itemsFinal,
            subtotal: totals.subtotal,
            margenGanancia: margin,
            impuestos: taxes,
            total: totals.total
        };

        window.db.saveBudget(newBudget);
        this.hideModal();
        this.switchTab('budgets');
    }

    // --- WIZARD PARA SUBIR / IMPORTAR PRESUPUESTO ---
    openImportBudgetWizard() {
        const bodyHtml = `
            <div class="card" style="margin-bottom:16px;">
                <h4 style="font-family:var(--font-heading); margin-bottom:12px;">Sube o pega un Presupuesto existente</h4>
                <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
                    Puedes subir un archivo de respaldo en formato JSON o pegar una lista de ítems en texto simple (separados por comas o tabuladores) para agregarlos automáticamente a la base de datos.
                </p>

                <div class="form-group">
                    <label style="font-weight:600;">Opción A: Cargar Archivo JSON de Base de Datos / Presupuesto</label>
                    <input type="file" id="importFile" accept=".json" onchange="window.ui.handleJsonUpload(event)" style="background:none; border:none; padding:0;">
                </div>

                <div style="border-top:1px solid var(--border-color); padding-top:16px; margin-top:16px;">
                    <label style="font-weight:600; margin-bottom:8px;">Opción B: Pegar ítems de una planilla (Excel/Sheets)</label>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:10px;">
                        Formato esperado por línea: <code>Nombre del Ítem, Cantidad, Unidad, Precio Unitario</code>
                    </p>
                    <textarea id="importPasteArea" placeholder="e.g.&#10;Contrapiso de hormigón, 50, m2, 18500&#10;Revoque fino interior, 120, m2, 9800" style="min-height:120px; font-family:monospace; font-size:0.85rem;"></textarea>
                </div>

                <div class="form-row" style="margin-top:16px;">
                    <div class="form-group">
                        <label for="impClient">Cliente para estos ítems</label>
                        <input type="text" id="impClient" placeholder="e.g. Cliente Importado">
                    </div>
                    <div class="form-group">
                        <label for="impProject">Proyecto / Obra</label>
                        <input type="text" id="impProject" placeholder="e.g. Obra Carga Rápida">
                    </div>
                </div>
            </div>
        `;

        const footerHtml = `
            <div class="flex-gap-12">
                <button class="btn btn-secondary" onclick="window.ui.hideModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="window.ui.parseAndImportTextBudget()">Procesar e Importar</button>
            </div>
        `;

        this.showModal('Subir e Importar Presupuesto', bodyHtml, footerHtml);
        lucide.createIcons();
    }

    handleJsonUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const success = window.db.importData(content);
            if (success) {
                alert('¡Base de datos y presupuestos importados con éxito!');
                this.hideModal();
                this.switchTab('dashboard');
            } else {
                alert('Error: El archivo JSON no tiene un formato válido para este sistema.');
            }
        };
        reader.readAsText(file);
    }

    parseAndImportTextBudget() {
        const text = document.getElementById('importPasteArea').value.trim();
        const client = document.getElementById('impClient').value.trim() || 'Cliente Importado';
        const project = document.getElementById('impProject').value.trim() || 'Obra Importada';

        if (!text) {
            alert('Por favor pega algunos ítems o carga un archivo JSON.');
            return;
        }

        const lines = text.split('\n');
        const items = [];
        const apuList = window.db.getApuItems();

        lines.forEach((line, idx) => {
            if (!line.trim()) return;

            // Separar por comas o tabuladores
            const parts = line.split(/,|\t/).map(p => p.trim());
            if (parts.length < 2) return;

            const nombre = parts[0];
            const cantidad = parseFloat(parts[1]) || 1;
            const unidad = parts[2] || 'u';
            const precioUnitario = parseFloat(parts[3]) || 1000; // Valor por defecto

            // Verificar si el ítem APU ya existe, si no, crear uno genérico para guardarlo en la DB
            let apu = apuList.find(a => a.nombre.toLowerCase() === nombre.toLowerCase());
            
            if (!apu) {
                // Crear ítem APU base sin composición detallada para poblar la DB
                apu = window.db.saveApuItem({
                    nombre: nombre,
                    unidad: unidad,
                    categoria: 'Importados',
                    materiales: [],
                    manoDeObra: [],
                    costoAdicionalPorcentaje: 0
                });
            }

            items.push({
                id: 'item-imp-' + Date.now() + Math.random().toString(36).substr(2, 5),
                itemApuId: apu.id,
                nombre: apu.nombre,
                unidad: apu.unidad,
                cantidad: cantidad,
                precioUnitarioHistorico: precioUnitario,
                materialesCopia: [],
                manoObraCopia: [],
                costoAdicionalPorcentaje: 0
            });
        });

        if (items.length === 0) {
            alert('No se pudo procesar ninguna línea. Revisa el formato.');
            return;
        }

        // Crear presupuesto
        const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitarioHistorico), 0);
        const newBudget = {
            cliente: client,
            proyecto: project,
            fecha: new Date().toISOString().split('T')[0],
            estado: 'Borrador',
            items: items,
            subtotal: subtotal,
            margenGanancia: 0,
            impuestos: 0,
            total: subtotal
        };

        window.db.saveBudget(newBudget);
        alert(`¡Presupuesto importado con éxito con ${items.length} ítems! Se han agregado los nuevos ítems a tu catálogo APU.`);
        this.hideModal();
        this.switchTab('budgets');
    }

    // --- RENDER ANALISIS DE PRECIOS UNITARIOS (APU) ---
    renderApu(container) {
        const apus = window.db.getApuItems();
        const materials = window.db.getMaterials();
        const labor = window.db.getLabor();

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Análisis de Precios Unitarios (APU)</h1>
                    <p class="view-subtitle">Estructura y calcula el costo por unidad de cada tarea de construcción</p>
                </div>
                <button class="btn btn-primary" onclick="window.ui.openNewApuWizard()">
                    <i data-lucide="plus"></i> Crear Nuevo Ítem/APU
                </button>
            </div>

            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre del Ítem / Rubro</th>
                                <th>Categoría</th>
                                <th>Unidad</th>
                                <th>Costo Materiales</th>
                                <th>Costo Mano Obra</th>
                                <th>Costo Adicional</th>
                                <th class="text-accent">Precio Unitario Calculado</th>
                                <th class="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${apus.map(apu => {
                                const details = window.apuEngine.calculateItemPrice(apu, materials, labor);
                                return `
                                    <tr>
                                        <td><strong>${apu.nombre}</strong></td>
                                        <td><span class="badge badge-indigo">${apu.categoria}</span></td>
                                        <td><span class="badge badge-secondary">${apu.unidad}</span></td>
                                        <td>$${this.formatCurrency(details.costoMateriales)}</td>
                                        <td>$${this.formatCurrency(details.costoManoObra)}</td>
                                        <td>${details.costoAdicionalPorcentaje}% ($${this.formatCurrency(details.costoAdicional)})</td>
                                        <td class="text-accent" style="font-weight: 700;">$${this.formatCurrency(details.precioUnitario)}</td>
                                        <td class="text-right">
                                            <div class="flex-gap-12" style="justify-content: flex-end;">
                                                <button class="btn btn-secondary btn-sm" onclick="window.ui.openEditApuWizard('${apu.id}')">
                                                    <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                                                </button>
                                                <button class="btn btn-danger btn-sm" onclick="window.ui.deleteApuItem('${apu.id}')">
                                                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('') || '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No hay ítems APU creados.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    deleteApuItem(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este ítem APU?')) {
            window.db.deleteApuItem(id);
            this.switchTab('apu');
        }
    }

    openNewApuWizard() {
        this.apuBuilderMateriales = [];
        this.apuBuilderManoObra = [];
        this.renderApuFormModal('Nuevo Análisis de Precio Unitario (APU)');
    }

    openEditApuWizard(id) {
        const apus = window.db.getApuItems();
        const apu = apus.find(a => a.id === id);
        if (!apu) return;

        this.apuBuilderMateriales = (apu.materiales || []).map(m => ({ ...m }));
        this.apuBuilderManoObra = (apu.manoDeObra || []).map(l => ({ ...l }));
        
        this.renderApuFormModal('Editar Análisis de Precio Unitario (APU)', apu);
    }

    renderApuFormModal(title, apu = null) {
        const materials = window.db.getMaterials();
        const labor = window.db.getLabor();

        const bodyHtml = `
            <div class="apu-editor-layout">
                <!-- Estructura APU -->
                <div>
                    <div class="card" style="margin-bottom:16px;">
                        <h4 style="margin-bottom:16px; font-family:var(--font-heading);">Propiedades del Ítem</h4>
                        <input type="hidden" id="apuId" value="${apu ? apu.id : ''}">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="apuName">Nombre del Ítem / Rubro</label>
                                <input type="text" id="apuName" value="${apu ? apu.nombre : ''}" placeholder="e.g. Contrapiso de Cascotes" required>
                            </div>
                            <div class="form-group">
                                <label for="apuCategory">Categoría</label>
                                <input type="text" id="apuCategory" value="${apu ? apu.categoria : 'Albañilería'}" placeholder="e.g. Estructuras, Acabados" required>
                            </div>
                            <div class="form-group">
                                <label for="apuUnit">Unidad de Medida</label>
                                <input type="text" id="apuUnit" value="${apu ? apu.unidad : 'm2'}" placeholder="e.g. m2, m3, m, u" required>
                            </div>
                        </div>
                    </div>

                    <!-- Materiales Composición -->
                    <div class="card" style="margin-bottom:16px;">
                        <h4 style="margin-bottom:16px; font-family:var(--font-heading); display:flex; justify-content:space-between; align-items:center;">
                            <span>Materiales</span>
                            <button class="btn btn-secondary btn-sm" onclick="window.ui.addApuMaterialRow()">
                                <i data-lucide="plus"></i> Agregar Material
                            </button>
                        </h4>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:50%;">Material</th>
                                        <th style="width:15%;">Rendimiento</th>
                                        <th style="width:15%; text-align:right;">P. Unitario</th>
                                        <th style="width:15%; text-align:right;">Subtotal</th>
                                        <th style="width:5%;"></th>
                                    </tr>
                                </thead>
                                <tbody id="apuMaterialTableBody">
                                    <!-- Carga dinámica -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Mano de Obra Composición -->
                    <div class="card">
                        <h4 style="margin-bottom:16px; font-family:var(--font-heading); display:flex; justify-content:space-between; align-items:center;">
                            <span>Mano de Obra</span>
                            <button class="btn btn-secondary btn-sm" onclick="window.ui.addApuLaborRow()">
                                <i data-lucide="plus"></i> Agregar Mano de Obra
                            </button>
                        </h4>
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width:50%;">Rol Mano Obra</th>
                                        <th style="width:15%;">Rendimiento (horas)</th>
                                        <th style="width:15%; text-align:right;">P. Hora</th>
                                        <th style="width:15%; text-align:right;">Subtotal</th>
                                        <th style="width:5%;"></th>
                                    </tr>
                                </thead>
                                <tbody id="apuLaborTableBody">
                                    <!-- Carga dinámica -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Resumen en Tiempo Real de Costos -->
                <div>
                    <div class="card apu-summary-panel">
                        <h4 style="margin-bottom:16px; font-family:var(--font-heading);">Costo Unitario Proyectado</h4>
                        
                        <div class="form-group">
                            <label for="apuExtraPorcent">Herramientas y Desperdicio (%)</label>
                            <input type="number" id="apuExtraPorcent" value="${apu ? apu.costoAdicionalPorcentaje : 5}" min="0" oninput="window.ui.calculateApuTotals()">
                        </div>

                        <div class="apu-totals-block">
                            <div class="total-row">
                                <span style="color:var(--text-muted);">Costo Materiales:</span>
                                <span id="apuSubMaterial">$0.00</span>
                            </div>
                            <div class="total-row">
                                <span style="color:var(--text-muted);">Costo Mano Obra:</span>
                                <span id="apuSubLabor">$0.00</span>
                            </div>
                            <div class="total-row">
                                <span style="color:var(--text-muted);">Costo Directo:</span>
                                <span id="apuCostoDirecto">$0.00</span>
                            </div>
                            <div class="total-row" style="border-bottom:1px solid var(--border-color); padding-bottom:8px;">
                                <span style="color:var(--text-muted);">Herramientas / Adic.:</span>
                                <span id="apuCostoExtra">$0.00</span>
                            </div>
                            <div class="total-row grand-total" style="border-top:none; padding-top:0;">
                                <span>Precio Unitario:</span>
                                <span id="apuFinalPriceVal" style="color:var(--color-accent); font-weight:bold;">$0.00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const footerHtml = `
            <div class="flex-gap-12">
                <button class="btn btn-secondary" onclick="window.ui.hideModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="window.ui.saveApuItem()">Guardar Cambios</button>
            </div>
        `;

        this.showModal(title, bodyHtml, footerHtml, true);

        // Poblar tablas con datos iniciales si es edición
        if (apu) {
            this.apuBuilderMateriales.forEach((m, idx) => this.renderApuMaterialRow(idx, m));
            this.apuBuilderManoObra.forEach((l, idx) => this.renderApuLaborRow(idx, l));
        } else {
            this.addApuMaterialRow();
            this.addApuLaborRow();
        }

        this.calculateApuTotals();
        lucide.createIcons();
    }

    addApuMaterialRow() {
        const idx = this.apuBuilderMateriales.length;
        const defaultRow = { materialId: '', rendimiento: 1 };
        this.apuBuilderMateriales.push(defaultRow);
        this.renderApuMaterialRow(idx, defaultRow);
        lucide.createIcons();
    }

    renderApuMaterialRow(index, data) {
        const tableBody = document.getElementById('apuMaterialTableBody');
        const materials = window.db.getMaterials();

        const tr = document.createElement('tr');
        tr.id = `apuMatRow-${index}`;
        tr.innerHTML = `
            <td>
                <select class="apu-mat-select" onchange="window.ui.onApuMaterialChange(${index}, this.value)" style="width:100%;">
                    <option value="">-- Seleccionar Material --</option>
                    ${materials.map(m => `<option value="${m.id}" ${m.id === data.materialId ? 'selected' : ''}>${m.nombre} (${m.unidad})</option>`).join('')}
                </select>
            </td>
            <td>
                <input type="number" class="apu-mat-qty text-right" value="${data.rendimiento}" min="0.0001" step="any" oninput="window.ui.onApuMaterialQtyChange(${index}, this.value)" style="padding:8px;">
            </td>
            <td class="text-right" style="padding:12px 16px; color:var(--text-muted);">
                <span id="apuMatPrice-${index}">$0.00</span>
            </td>
            <td class="text-right" style="font-weight:600; padding:12px 16px;">
                <span id="apuMatSub-${index}">$0.00</span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="window.ui.removeApuMaterialRow(${index})" style="padding:4px 8px;">
                    <i data-lucide="x" style="width:14px;"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(tr);
        
        // Cargar precios iniciales si ya tiene id asignado
        if (data.materialId) {
            this.onApuMaterialChange(index, data.materialId, false);
        }
    }

    removeApuMaterialRow(index) {
        const tr = document.getElementById(`apuMatRow-${index}`);
        if (tr) {
            tr.remove();
            this.apuBuilderMateriales[index] = null;
            this.calculateApuTotals();
        }
    }

    onApuMaterialChange(index, materialId, triggerCalculate = true) {
        if (!materialId) {
            this.apuBuilderMateriales[index].materialId = '';
            document.getElementById(`apuMatPrice-${index}`).innerText = '$0.00';
            document.getElementById(`apuMatSub-${index}`).innerText = '$0.00';
            if (triggerCalculate) this.calculateApuTotals();
            return;
        }

        const materials = window.db.getMaterials();
        const material = materials.find(m => m.id === materialId);
        if (!material) return;

        this.apuBuilderMateriales[index].materialId = materialId;
        
        document.getElementById(`apuMatPrice-${index}`).innerText = `$${this.formatCurrency(material.precioUnitario)}`;
        
        const qty = parseFloat(document.querySelector(`#apuMatRow-${index} .apu-mat-qty`).value) || 0;
        const subtotal = qty * material.precioUnitario;
        document.getElementById(`apuMatSub-${index}`).innerText = `$${this.formatCurrency(subtotal)}`;

        if (triggerCalculate) this.calculateApuTotals();
    }

    onApuMaterialQtyChange(index, value) {
        const qty = parseFloat(value) || 0;
        this.apuBuilderMateriales[index].rendimiento = qty;

        const materialId = this.apuBuilderMateriales[index].materialId;
        if (materialId) {
            const materials = window.db.getMaterials();
            const material = materials.find(m => m.id === materialId);
            const subtotal = qty * (material ? material.precioUnitario : 0);
            document.getElementById(`apuMatSub-${index}`).innerText = `$${this.formatCurrency(subtotal)}`;
        }

        this.calculateApuTotals();
    }

    // Mano de Obra APU
    addApuLaborRow() {
        const idx = this.apuBuilderManoObra.length;
        const defaultRow = { manoObraId: '', rendimiento: 1 };
        this.apuBuilderManoObra.push(defaultRow);
        this.renderApuLaborRow(idx, defaultRow);
        lucide.createIcons();
    }

    renderApuLaborRow(index, data) {
        const tableBody = document.getElementById('apuLaborTableBody');
        const labor = window.db.getLabor();

        const tr = document.createElement('tr');
        tr.id = `apuLabRow-${index}`;
        tr.innerHTML = `
            <td>
                <select class="apu-lab-select" onchange="window.ui.onApuLaborChange(${index}, this.value)" style="width:100%;">
                    <option value="">-- Seleccionar Rol --</option>
                    ${labor.map(l => `<option value="${l.id}" ${l.id === data.manoObraId ? 'selected' : ''}>${l.nombre} (${l.unidad})</option>`).join('')}
                </select>
            </td>
            <td>
                <input type="number" class="apu-lab-qty text-right" value="${data.rendimiento}" min="0.0001" step="any" oninput="window.ui.onApuLaborQtyChange(${index}, this.value)" style="padding:8px;">
            </td>
            <td class="text-right" style="padding:12px 16px; color:var(--text-muted);">
                <span id="apuLabPrice-${index}">$0.00</span>
            </td>
            <td class="text-right" style="font-weight:600; padding:12px 16px;">
                <span id="apuLabSub-${index}">$0.00</span>
            </td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="window.ui.removeApuLaborRow(${index})" style="padding:4px 8px;">
                    <i data-lucide="x" style="width:14px;"></i>
                </button>
            </td>
        `;

        tableBody.appendChild(tr);

        if (data.manoObraId) {
            this.onApuLaborChange(index, data.manoObraId, false);
        }
    }

    removeApuLaborRow(index) {
        const tr = document.getElementById(`apuLabRow-${index}`);
        if (tr) {
            tr.remove();
            this.apuBuilderManoObra[index] = null;
            this.calculateApuTotals();
        }
    }

    onApuLaborChange(index, laborId, triggerCalculate = true) {
        if (!laborId) {
            this.apuBuilderManoObra[index].manoObraId = '';
            document.getElementById(`apuLabPrice-${index}`).innerText = '$0.00';
            document.getElementById(`apuLabSub-${index}`).innerText = '$0.00';
            if (triggerCalculate) this.calculateApuTotals();
            return;
        }

        const labor = window.db.getLabor();
        const role = labor.find(l => l.id === laborId);
        if (!role) return;

        this.apuBuilderManoObra[index].manoObraId = laborId;

        document.getElementById(`apuLabPrice-${index}`).innerText = `$${this.formatCurrency(role.precioUnitario)}`;

        const qty = parseFloat(document.querySelector(`#apuLabRow-${index} .apu-lab-qty`).value) || 0;
        const subtotal = qty * role.precioUnitario;
        document.getElementById(`apuLabSub-${index}`).innerText = `$${this.formatCurrency(subtotal)}`;

        if (triggerCalculate) this.calculateApuTotals();
    }

    onApuLaborQtyChange(index, value) {
        const qty = parseFloat(value) || 0;
        this.apuBuilderManoObra[index].rendimiento = qty;

        const laborId = this.apuBuilderManoObra[index].manoObraId;
        if (laborId) {
            const labor = window.db.getLabor();
            const role = labor.find(l => l.id === laborId);
            const subtotal = qty * (role ? role.precioUnitario : 0);
            document.getElementById(`apuLabSub-${index}`).innerText = `$${this.formatCurrency(subtotal)}`;
        }

        this.calculateApuTotals();
    }

    calculateApuTotals() {
        let matCost = 0;
        let labCost = 0;

        const materials = window.db.getMaterials();
        const labor = window.db.getLabor();

        this.apuBuilderMateriales.forEach(m => {
            if (m && m.materialId) {
                const material = materials.find(x => x.id === m.materialId);
                if (material) {
                    matCost += m.rendimiento * material.precioUnitario;
                }
            }
        });

        this.apuBuilderManoObra.forEach(l => {
            if (l && l.manoObraId) {
                const role = labor.find(x => x.id === l.manoObraId);
                if (role) {
                    labCost += l.rendimiento * role.precioUnitario;
                }
            }
        });

        const extraPercent = parseFloat(document.getElementById('apuExtraPorcent').value) || 0;
        const directCost = matCost + labCost;
        const extraCost = directCost * (extraPercent / 100);
        const finalPrice = directCost + extraCost;

        document.getElementById('apuSubMaterial').innerText = `$${this.formatCurrency(matCost)}`;
        document.getElementById('apuSubLabor').innerText = `$${this.formatCurrency(labCost)}`;
        document.getElementById('apuCostoDirecto').innerText = `$${this.formatCurrency(directCost)}`;
        document.getElementById('apuCostoExtra').innerText = `$${this.formatCurrency(extraCost)}`;
        document.getElementById('apuFinalPriceVal').innerText = `$${this.formatCurrency(finalPrice)}`;
    }

    saveApuItem() {
        const id = document.getElementById('apuId').value;
        const nombre = document.getElementById('apuName').value.trim();
        const categoria = document.getElementById('apuCategory').value.trim();
        const unidad = document.getElementById('apuUnit').value.trim();
        const extraPorcent = parseFloat(document.getElementById('apuExtraPorcent').value) || 0;

        if (!nombre || !categoria || !unidad) {
            alert('Por favor completa las propiedades base del ítem (Nombre, Categoría y Unidad).');
            return;
        }

        // Filtrar nulos
        const materiales = this.apuBuilderMateriales.filter(m => m && m.materialId);
        const manoDeObra = this.apuBuilderManoObra.filter(l => l && l.manoObraId);

        const apuData = {
            nombre,
            categoria,
            unidad,
            materiales,
            manoDeObra,
            costoAdicionalPorcentaje: extraPorcent
        };

        if (id) apuData.id = id;

        window.db.saveApuItem(apuData);
        this.hideModal();
        this.switchTab('apu');
    }

    // --- RENDER MATERIALES ---
    renderMaterials(container) {
        const materials = window.db.getMaterials();

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Base de Datos de Materiales</h1>
                    <p class="view-subtitle">Gestiona los materiales base de tu catálogo de construcción</p>
                </div>
                <button class="btn btn-primary" onclick="window.ui.openMaterialModal()">
                    <i data-lucide="plus"></i> Agregar Material
                </button>
            </div>

            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre del Material</th>
                                <th>Categoría</th>
                                <th>Unidad de Compra</th>
                                <th class="text-accent">Precio Unitario Base</th>
                                <th>Última Actualización</th>
                                <th class="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${materials.map(m => `
                                <tr>
                                    <td><strong>${m.nombre}</strong></td>
                                    <td><span class="badge badge-indigo">${m.categoria}</span></td>
                                    <td><span class="badge badge-secondary">${m.unidad}</span></td>
                                    <td class="text-accent" style="font-weight: 700;">$${this.formatCurrency(m.precioUnitario)}</td>
                                    <td>${m.fechaActualizacion}</td>
                                    <td class="text-right">
                                        <div class="flex-gap-12" style="justify-content: flex-end;">
                                            <button class="btn btn-secondary btn-sm" onclick="window.ui.openMaterialModal('${m.id}')">
                                                <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick="window.ui.deleteMaterial('${m.id}')">
                                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No hay materiales agregados.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    deleteMaterial(id) {
        if (confirm('¿Deseas eliminar este material? Si está asignado a un APU, los costos de ese APU podrían recalcularse como cero.')) {
            window.db.deleteMaterial(id);
            this.switchTab('materials');
        }
    }

    openMaterialModal(id = null) {
        let material = null;
        if (id) {
            const list = window.db.getMaterials();
            material = list.find(m => m.id === id);
        }

        const bodyHtml = `
            <input type="hidden" id="matId" value="${material ? material.id : ''}">
            <div class="form-group">
                <label for="matName">Nombre del Material</label>
                <input type="text" id="matName" value="${material ? material.nombre : ''}" placeholder="e.g. Bolsa Cemento Portland 50kg" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="matCategory">Categoría</label>
                    <input type="text" id="matCategory" value="${material ? material.categoria : 'Áridos'}" placeholder="e.g. Aceros, Maderas, Aglomerantes" required>
                </div>
                <div class="form-group">
                    <label for="matUnit">Unidad de Compra</label>
                    <input type="text" id="matUnit" value="${material ? material.unidad : 'bolsa'}" placeholder="e.g. m3, kg, barra, bolsa" required>
                </div>
            </div>
            <div class="form-group">
                <label for="matPrice">Precio Unitario Actual ($)</label>
                <input type="number" id="matPrice" value="${material ? material.precioUnitario : ''}" placeholder="e.g. 8500" step="any" required>
            </div>
        `;

        const footerHtml = `
            <div class="flex-gap-12">
                <button class="btn btn-secondary" onclick="window.ui.hideModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="window.ui.saveMaterial()">Guardar Material</button>
            </div>
        `;

        this.showModal(material ? 'Editar Material' : 'Nuevo Material', bodyHtml, footerHtml);
        lucide.createIcons();
    }

    saveMaterial() {
        const id = document.getElementById('matId').value;
        const nombre = document.getElementById('matName').value.trim();
        const categoria = document.getElementById('matCategory').value.trim();
        const unidad = document.getElementById('matUnit').value.trim();
        const precioUnitario = parseFloat(document.getElementById('matPrice').value) || 0;

        if (!nombre || !categoria || !unidad || isNaN(precioUnitario)) {
            alert('Por favor, completa todos los campos del formulario.');
            return;
        }

        window.db.saveMaterial({
            id: id || undefined,
            nombre,
            categoria,
            unidad,
            precioUnitario
        });

        this.hideModal();
        this.switchTab('materials');
    }

    // --- RENDER MANO DE OBRA ---
    renderLabor(container) {
        const labor = window.db.getLabor();

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Base de Datos de Mano de Obra</h1>
                    <p class="view-subtitle">Define categorías de trabajo, oficios y precios de jornada u hora</p>
                </div>
                <button class="btn btn-primary" onclick="window.ui.openLaborModal()">
                    <i data-lucide="plus"></i> Registrar Mano de Obra
                </button>
            </div>

            <div class="card">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre del Puesto / Rol</th>
                                <th>Categoría / Especialidad</th>
                                <th>Unidad de Cobro</th>
                                <th class="text-accent">Precio por Unidad (Hora/Jornada)</th>
                                <th>Última Actualización</th>
                                <th class="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${labor.map(l => `
                                <tr>
                                    <td><strong>${l.nombre}</strong></td>
                                    <td><span class="badge badge-indigo">${l.categoria}</span></td>
                                    <td><span class="badge badge-secondary">${l.unidad}</span></td>
                                    <td class="text-accent" style="font-weight: 700;">$${this.formatCurrency(l.precioUnitario)}</td>
                                    <td>${l.fechaActualizacion}</td>
                                    <td class="text-right">
                                        <div class="flex-gap-12" style="justify-content: flex-end;">
                                            <button class="btn btn-secondary btn-sm" onclick="window.ui.openLaborModal('${l.id}')">
                                                <i data-lucide="edit" style="width: 14px; height: 14px;"></i>
                                            </button>
                                            <button class="btn btn-danger btn-sm" onclick="window.ui.deleteLabor('${l.id}')">
                                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No hay roles registrados.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    deleteLabor(id) {
        if (confirm('¿Deseas eliminar este rol de mano de obra? Si está asignado a un APU, los costos de ese APU podrían recalcularse como cero.')) {
            window.db.deleteLabor(id);
            this.switchTab('labor');
        }
    }

    openLaborModal(id = null) {
        let labor = null;
        if (id) {
            const list = window.db.getLabor();
            labor = list.find(l => l.id === id);
        }

        const bodyHtml = `
            <input type="hidden" id="labId" value="${labor ? labor.id : ''}">
            <div class="form-group">
                <label for="labName">Nombre del Rol / Puesto</label>
                <input type="text" id="labName" value="${labor ? labor.nombre : ''}" placeholder="e.g. Oficial Albañil o Electricista Matriculado" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="labCategory">Especialidad / Categoría</label>
                    <input type="text" id="labCategory" value="${labor ? labor.categoria : 'Albañilería'}" placeholder="e.g. Instalaciones, Albañilería, Pintura" required>
                </div>
                <div class="form-group">
                    <label for="labUnit">Unidad de Cobro</label>
                    <input type="text" id="labUnit" value="${labor ? labor.unidad : 'hora'}" placeholder="e.g. hora, jornada, mes" required>
                </div>
            </div>
            <div class="form-group">
                <label for="labPrice">Valor Unitario ($)</label>
                <input type="number" id="labPrice" value="${labor ? labor.precioUnitario : ''}" placeholder="e.g. 3500" step="any" required>
            </div>
        `;

        const footerHtml = `
            <div class="flex-gap-12">
                <button class="btn btn-secondary" onclick="window.ui.hideModal()">Cancelar</button>
                <button class="btn btn-primary" onclick="window.ui.saveLabor()">Guardar Rol</button>
            </div>
        `;

        this.showModal(labor ? 'Editar Mano de Obra' : 'Nueva Mano de Obra', bodyHtml, footerHtml);
        lucide.createIcons();
    }

    saveLabor() {
        const id = document.getElementById('labId').value;
        const nombre = document.getElementById('labName').value.trim();
        const categoria = document.getElementById('labCategory').value.trim();
        const unidad = document.getElementById('labUnit').value.trim();
        const precioUnitario = parseFloat(document.getElementById('labPrice').value) || 0;

        if (!nombre || !categoria || !unidad || isNaN(precioUnitario)) {
            alert('Por favor, completa todos los campos del formulario.');
            return;
        }

        window.db.saveLabor({
            id: id || undefined,
            nombre,
            categoria,
            unidad,
            precioUnitario
        });

        this.hideModal();
        this.switchTab('labor');
    }

    // --- RENDER SETTINGS & HERRAMIENTAS ---
    renderSettings(container) {
        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Configuración e Importación/Exportación</h1>
                    <p class="view-subtitle">Realiza respaldos de tus bases de datos o reinicia los valores de fábrica</p>
                </div>
            </div>

            <div class="card" style="margin-bottom:24px;">
                <h4 style="font-family:var(--font-heading); margin-bottom:16px;">Exportar Base de Datos Completa</h4>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;">
                    Puedes descargar un archivo de respaldo en formato JSON que contiene todas tus bases de datos de materiales, mano de obra, análisis de precios unitarios (APU) y presupuestos guardados.
                </p>
                <button class="btn btn-accent" onclick="window.ui.exportDatabaseFile()">
                    <i data-lucide="download"></i> Descargar Respaldo JSON
                </button>
            </div>

            <div class="card" style="margin-bottom:24px;">
                <h4 style="font-family:var(--font-heading); margin-bottom:16px;">Importar Base de Datos Completa</h4>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;">
                    Sube un archivo de respaldo JSON descargado previamente para restaurar tu base de datos.
                    <strong>Advertencia:</strong> Esto reemplazará los datos locales actuales.
                </p>
                <input type="file" id="settingsImportFile" accept=".json" onchange="window.ui.handleJsonUpload(event)" style="margin-bottom:16px; display:block;">
            </div>

            <div class="card" style="border:1px solid rgba(239, 68, 68, 0.3);">
                <h4 style="font-family:var(--font-heading); margin-bottom:16px; color:var(--color-danger);">Herramientas de Desarrollador / Peligro</h4>
                <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:16px;">
                    Si deseas borrar todos los cambios realizados y restaurar la base de datos con los datos semilla realistas por defecto (materiales de construcción estándar, operarios y rubros ejemplo), presiona el siguiente botón:
                </p>
                <button class="btn btn-danger" onclick="window.ui.resetDatabaseToDefaults()">
                    <i data-lucide="refresh-cw"></i> Resetear Base de Datos
                </button>
            </div>
        `;
    }

    exportDatabaseFile() {
        const dataStr = window.db.exportData();
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `obra_db_respaldo_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    resetDatabaseToDefaults() {
        if (confirm('¿Estás seguro de reiniciar la base de datos? Esto eliminará todos los presupuestos y materiales que hayas creado y restablecerá los ejemplos de fábrica.')) {
            window.db.resetDatabase();
            alert('Base de datos restablecida.');
            this.switchTab('dashboard');
        }
    }

    // --- NUEVA PESTAÑA: PERSONALIZACIÓN DE PDF EN VIVO ---
    renderPdfSettings(container) {
        const comp = window.db.getCompanySettings();

        container.innerHTML = `
            <div class="view-header">
                <div>
                    <h1 class="view-title">Personalización de PDF e Impresión</h1>
                    <p class="view-subtitle">Diseña la plantilla de tus presupuestos con tus colores, logo y condiciones</p>
                </div>
                <button class="btn btn-primary" onclick="window.ui.saveCompanyProfile()">
                    <i data-lucide="save"></i> Guardar Cambios
                </button>
            </div>

            <div class="apu-editor-layout" style="grid-template-columns: 1fr 1.2fr;">
                <!-- Panel de Configuración -->
                <div class="card" style="display:flex; flex-direction:column; gap:16px;">
                    <h4 style="font-family:var(--font-heading); margin-bottom:8px;">Datos de la Empresa / Emisor</h4>
                    
                    <div class="form-group">
                        <label for="compName">Nombre Comercial</label>
                        <input type="text" id="compName" value="${comp.nombre}" oninput="window.ui.updateLivePdfPreview()" placeholder="e.g. Alvaro Reformas">
                    </div>
                    
                    <div class="form-group">
                        <label for="compSub">Subtítulo / Actividad</label>
                        <input type="text" id="compSub" value="${comp.subtitulo}" oninput="window.ui.updateLivePdfPreview()" placeholder="e.g. Construcción y Arquitectura">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="compPhone">Teléfono</label>
                            <input type="text" id="compPhone" value="${comp.telefono}" oninput="window.ui.updateLivePdfPreview()" placeholder="e.g. +54 9 11 ...">
                        </div>
                        <div class="form-group">
                            <label for="compEmail">Email de Contacto</label>
                            <input type="text" id="compEmail" value="${comp.email}" oninput="window.ui.updateLivePdfPreview()" placeholder="e.g. info@tudominio.com">
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="compAddress">Dirección Física</label>
                        <input type="text" id="compAddress" value="${comp.direccion}" oninput="window.ui.updateLivePdfPreview()" placeholder="e.g. Av. de las Ciencias 456">
                    </div>

                    <div style="border-top:1px solid var(--border-color); padding-top:16px;">
                        <h4 style="font-family:var(--font-heading); margin-bottom:12px;">Identidad Visual y Diseño</h4>
                        
                        <div class="form-group">
                            <label>Logotipo Comercial (PNG, JPG)</label>
                            <div style="display:flex; gap:12px; align-items:center;">
                                <input type="file" id="compLogoFile" accept="image/*" onchange="window.ui.handleLogoUpload(event)" style="flex:1;">
                                <button class="btn btn-danger btn-sm" onclick="window.ui.clearCompanyLogo()">Quitar Logo</button>
                            </div>
                            <input type="hidden" id="compLogoBase64" value="${comp.logo || ''}">
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="compLogoPos">Posición del Logo</label>
                                <select id="compLogoPos" onchange="window.ui.updateLivePdfPreview()">
                                    <option value="left" ${comp.logoPos === 'left' ? 'selected' : ''}>Izquierda</option>
                                    <option value="right" ${comp.logoPos === 'right' ? 'selected' : ''}>Derecha</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="compColor">Color Temático PDF</label>
                                <div style="display:flex; gap:8px; align-items:center;">
                                    <input type="color" id="compColor" value="${comp.colorPdf || '#6366f1'}" oninput="window.ui.updateLivePdfPreview()" style="width:45px; height:45px; padding:0; border:none; cursor:pointer;">
                                    <span style="font-size:0.8rem; color:var(--text-muted);">Color principal de encabezados</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="border-top:1px solid var(--border-color); padding-top:16px;">
                        <h4 style="font-family:var(--font-heading); margin-bottom:12px;">Términos y Condiciones (Pie de Página)</h4>
                        <div class="form-group">
                            <textarea id="compFootnotes" rows="4" oninput="window.ui.updateLivePdfPreview()" style="font-size:0.85rem;" placeholder="e.g. Validez del presupuesto, formas de pago, plazos de obra...">${comp.notasPie}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Simulación Hoja Impresa A4 (Live Preview) -->
                <div>
                    <div class="card" style="padding:0; overflow:hidden; border:none; box-shadow:0 15px 35px rgba(0,0,0,0.3); border-radius:var(--radius-lg); position:sticky; top:20px;">
                        <div style="background:var(--bg-surface-hover); padding:12px 20px; font-size:0.8rem; font-weight:600; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color);">
                            <span>Vista Previa en Vivo (Hoja de Cliente)</span>
                            <span class="badge badge-emerald">A4 Imprimible</span>
                        </div>
                        
                        <!-- Simulación del Papel Blanco A4 -->
                        <div id="pdfLivePreviewSheet" style="background:#ffffff; color:#1f2937; padding:30px; font-family:'Plus Jakarta Sans', sans-serif; font-size:0.75rem; min-height:600px; display:flex; flex-direction:column; justify-content:space-between;">
                            
                            <div>
                                <!-- Encabezado Hoja -->
                                <div id="preHeader" style="display:flex; justify-content:space-between; border-bottom:2px solid #e5e7eb; padding-bottom:12px; margin-bottom:16px; align-items:center; min-height:65px;">
                                    <!-- Dinámico por JS -->
                                </div>

                                <!-- Datos Cliente Mock -->
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                                    <div style="padding:10px; border:1px solid #e5e7eb; border-radius:6px; background:#f9fafb;">
                                        <div style="font-weight:700; color:#4b5563; font-size:0.7rem; text-transform:uppercase; margin-bottom:4px;">Información del Cliente</div>
                                        <div style="font-weight:600; font-size:0.85rem; color:#111827;">Cliente Ejemplo S.A.</div>
                                        <div style="color:#6b7280; font-size:0.75rem; margin-top:2px;">Proyecto: Construcción de Muro Divisorio</div>
                                    </div>
                                    <div style="padding:10px; border:1px solid #e5e7eb; border-radius:6px; background:#f9fafb; display:flex; flex-direction:column; justify-content:center;">
                                        <div>Presupuesto: <strong>PRE-2026-042</strong></div>
                                        <div>Fecha de Emisión: <strong>2026-05-25</strong></div>
                                    </div>
                                </div>

                                <!-- Tabla Mock -->
                                <table style="width:100%; border-collapse:collapse; text-align:left; color:#1f2937; margin-bottom:16px;">
                                    <thead>
                                        <tr style="border-bottom:1.5px solid #111827;" id="preTableHeader">
                                            <th style="padding:6px 8px; font-size:0.7rem; font-weight:700; color:#374151; text-transform:uppercase;">Descripción del Rubro</th>
                                            <th style="padding:6px 8px; font-size:0.7rem; font-weight:700; color:#374151; text-transform:uppercase; text-align:right;">Cantidad</th>
                                            <th style="padding:6px 8px; font-size:0.7rem; font-weight:700; color:#374151; text-transform:uppercase; text-align:right;">P. Unitario</th>
                                            <th style="padding:6px 8px; font-size:0.7rem; font-weight:700; color:#374151; text-transform:uppercase; text-align:right;">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style="border-bottom:1px solid #e5e7eb;">
                                            <td style="padding:6px 8px; font-weight:600;">Mampostería de Ladrillo Común e=15cm</td>
                                            <td style="padding:6px 8px; text-align:right;">50.00 m2</td>
                                            <td style="padding:6px 8px; text-align:right;">$21.500,00</td>
                                            <td style="padding:6px 8px; text-align:right; font-weight:600;">$1.075.000,00</td>
                                        </tr>
                                        <tr style="border-bottom:1px solid #e5e7eb;">
                                            <td style="padding:6px 8px; font-weight:600;">Cimiento de Hormigón Armado para Vigas</td>
                                            <td style="padding:6px 8px; text-align:right;">5.00 m3</td>
                                            <td style="padding:6px 8px; text-align:right;">$125.000,00</td>
                                            <td style="padding:6px 8px; text-align:right; font-weight:600;">$625.000,00</td>
                                        </tr>
                                    </tbody>
                                </table>

                                <!-- Totales Mock -->
                                <div style="display:flex; justify-content:flex-end;">
                                    <div style="width:180px; display:flex; flex-direction:column; gap:6px; font-size:0.7rem;">
                                        <div style="display:flex; justify-content:space-between;">
                                            <span style="color:#4b5563;">Costo Base:</span>
                                            <span>$1.700.000,00</span>
                                        </div>
                                        <div style="display:flex; justify-content:space-between;">
                                            <span style="color:#4b5563;">Gastos + Ganancia (20%):</span>
                                            <span>$340.000,00</span>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #e5e7eb; padding-bottom:4px;">
                                            <span style="color:#4b5563;">Impuestos (21%):</span>
                                            <span>$428.400,00</span>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.8rem; margin-top:2px;" id="preGrandTotalRow">
                                            <span>Total Final:</span>
                                            <span id="preTotalFinal">$2.468.400,00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Notas al Pie Mock -->
                            <div style="border-top:1px dashed #d1d5db; padding-top:10px; margin-top:20px; font-size:0.65rem; color:#6b7280;">
                                <div style="font-weight:700; color:#4b5563; margin-bottom:4px; text-transform:uppercase;">Condiciones Comerciales:</div>
                                <div id="preNotes" style="white-space:pre-wrap;">
                                    <!-- Dinámico por JS -->
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateLivePdfPreview();
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('compLogoBase64').value = e.target.result;
            this.updateLivePdfPreview();
        };
        reader.readAsDataURL(file);
    }

    clearCompanyLogo() {
        document.getElementById('compLogoFile').value = '';
        document.getElementById('compLogoBase64').value = '';
        this.updateLivePdfPreview();
    }

    updateLivePdfPreview() {
        const nombre = document.getElementById('compName').value.trim() || 'Mi Empresa';
        const subtitulo = document.getElementById('compSub').value.trim() || 'Actividad Comercial';
        const telefono = document.getElementById('compPhone').value.trim();
        const email = document.getElementById('compEmail').value.trim();
        const direccion = document.getElementById('compAddress').value.trim();
        const color = document.getElementById('compColor').value || '#6366f1';
        const logo = document.getElementById('compLogoBase64').value;
        const logoPos = document.getElementById('compLogoPos').value;
        const notasPie = document.getElementById('compFootnotes').value;

        // 1. Armar información de la empresa HTML
        const companyInfoHtml = `
            <div style="text-align: left;">
                <div style="font-size: 1.1rem; font-weight: 700; color: ${color};">${nombre}</div>
                <div style="font-size: 0.75rem; color: #4b5563; font-weight: 500;">${subtitulo}</div>
                <div style="font-size: 0.7rem; color: #6b7280; margin-top: 3px;">
                    ${direccion ? `📍 ${direccion}` : ''} 
                    ${telefono ? ` | 📞 ${telefono}` : ''}
                    ${email ? ` | ✉️ ${email}` : ''}
                </div>
            </div>
        `;

        const logoHtml = logo ? `<img src="${logo}" style="max-height: 45px; max-width: 120px; object-fit: contain; border-radius:3px;">` : `<div style="width:40px; height:40px; background:#e5e7eb; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:0.6rem; font-weight:bold;">LOGO</div>`;

        const preHeader = document.getElementById('preHeader');
        if (logoPos === 'right') {
            preHeader.innerHTML = `
                ${companyInfoHtml}
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    ${logoHtml}
                </div>
            `;
        } else {
            preHeader.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    ${logoHtml}
                    ${companyInfoHtml}
                </div>
            `;
        }

        // Aplicar color en la cabecera de la tabla y total
        const tableHeader = document.getElementById('preTableHeader');
        tableHeader.style.borderBottom = `2px solid ${color}`;
        
        const totalRow = document.getElementById('preGrandTotalRow');
        totalRow.style.color = color;

        // Notas de condiciones
        document.getElementById('preNotes').innerText = notasPie || 'Sin condiciones particulares.';
    }

    saveCompanyProfile() {
        const nombre = document.getElementById('compName').value.trim();
        const subtitulo = document.getElementById('compSub').value.trim();
        const telefono = document.getElementById('compPhone').value.trim();
        const email = document.getElementById('compEmail').value.trim();
        const direccion = document.getElementById('compAddress').value.trim();
        const color = document.getElementById('compColor').value;
        const logo = document.getElementById('compLogoBase64').value;
        const logoPos = document.getElementById('compLogoPos').value;
        const notasPie = document.getElementById('compFootnotes').value;

        if (!nombre) {
            alert('Por favor, ingresa al menos el Nombre Comercial de tu empresa.');
            return;
        }

        const settings = {
            nombre,
            subtitulo,
            telefono,
            email,
            direccion,
            colorPdf: color,
            logo,
            logoPos,
            notesPie: notasPie, // compatible con variables antiguas
            notasPie
        };

        window.db.saveCompanySettings(settings);
        alert('¡Configuración de diseño de PDF guardada con éxito!');
        this.switchTab('dashboard');
    }

    // --- MODALES HELPERS ---
    showModal(title, bodyHtml, footerHtml = '', isLarge = false) {
        const overlay = document.getElementById('modal-overlay');
        const container = document.querySelector('.modal-container');
        
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = bodyHtml;
        document.getElementById('modal-footer').innerHTML = footerHtml;

        if (isLarge) {
            container.classList.add('large-modal');
        } else {
            container.classList.remove('large-modal');
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Evitar scroll de fondo
    }

    hideModal() {
        const overlay = document.getElementById('modal-overlay');
        const container = document.querySelector('.modal-container');
        overlay.classList.remove('active');
        container.classList.remove('large-modal');
        document.body.style.overflow = ''; // Restaurar scroll
    }

    // --- HELPERS GENERALES ---
    formatCurrency(value) {
        return Number(value).toLocaleString('es-AR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    getStatusBadgeClass(status) {
        switch(status) {
            case 'Borrador': return 'badge-secondary';
            case 'Enviado': return 'badge-indigo';
            case 'Aprobado': return 'badge-emerald';
            case 'Rechazado': return 'badge-danger';
            default: return 'badge-secondary';
        }
    }
}

const ui = new ObraUI();
window.ui = ui;
