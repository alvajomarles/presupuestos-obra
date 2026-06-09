// Funciones y configuraciones dedicadas a la generación de PDF e impresión

interface ObraUI {
    wasModalOpenBeforePrint: boolean;
    modalTitleBeforePrint: string;
    modalBodyBeforePrint: string;
    modalFooterBeforePrint: string;
    modalIsLargeBeforePrint: boolean;

    printBudget(): void;
    renderPdfSettings(container: HTMLElement): void;
    updateLivePdfPreview(): void;
    saveCompanyProfile(): void;
    handleLogoUpload(event: any): void;
    clearCompanyLogo(): void;
}

// Inicializar propiedades del prototipo para evitar errores de undefined
ObraUI.prototype.wasModalOpenBeforePrint = false;
ObraUI.prototype.modalTitleBeforePrint = '';
ObraUI.prototype.modalBodyBeforePrint = '';
ObraUI.prototype.modalFooterBeforePrint = '';
ObraUI.prototype.modalIsLargeBeforePrint = false;

ObraUI.prototype.printBudget = function(this: ObraUI) {
    const printableArea = document.getElementById('printable-area');
    const printContainer = document.getElementById('print-container');
    if (printableArea && printContainer) {
        // Guardar el estado del modal antes de imprimir para poder restaurarlo después
        this.wasModalOpenBeforePrint = true;
        this.modalTitleBeforePrint = document.getElementById('modal-title')!.innerText;
        this.modalBodyBeforePrint = document.getElementById('modal-body')!.innerHTML;
        this.modalFooterBeforePrint = document.getElementById('modal-footer')!.innerHTML;
        this.modalIsLargeBeforePrint = document.querySelector('.modal-container')!.classList.contains('large-modal');

        // Copiar el contenido al contenedor aislado de impresión.
        // Importante: clonamos nodos en vez de innerHTML para reducir carga.
        while (printContainer.firstChild) printContainer.removeChild(printContainer.firstChild);
        const clone = printableArea.cloneNode(true) as HTMLElement;
        printContainer.appendChild(clone);

        // En vez de mostrar/usar la vista previa (que puede colgar el hilo al renderizar),
        // intentamos disparar la descarga/impresión directamente.
        // Ocultamos modal solo si existe para no romper la app.
        try {
            this.hideModal();
        } catch (_) {
            // no bloqueamos el flujo si hideModal falla
        }

        // Disparar impresión directo y de forma segura.
        // Evitamos esperas por transiciones para reducir probabilidad de freeze.
        try {
            window.print();
        } catch (e) {
            console.error('window.print() failed', e);
        }


    } else {
        window.print();
    }
};

ObraUI.prototype.renderPdfSettings = function(this: ObraUI, container: HTMLElement) {
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
                    <h4 style="font-family:var(--font-heading); margin-bottom:12px;">Plantilla y Planificación</h4>
                    
                    <div class="form-group">
                        <label for="compTemplate">Diseño de Plantilla Impresa (PDF)</label>
                        <select id="compTemplate" onchange="window.ui.updateLivePdfPreview()">
                            <option value="clasico" ${comp.templatePdf === 'clasico' ? 'selected' : ''}>Planilla Clásica Excel (Estilo Ingenio)</option>
                            <option value="moderno" ${comp.templatePdf === 'moderno' ? 'selected' : ''}>Premium Moderno</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="compWorkers">Obreros por Defecto</label>
                            <input type="number" id="compWorkers" value="${comp.obrerosPorDefecto || 2}" min="1" oninput="window.ui.updateLivePdfPreview()">
                        </div>
                        <div class="form-group">
                            <label for="compValidity">Validez por Defecto</label>
                            <input type="text" id="compValidity" value="${comp.validezPorDefecto || '15 días'}" oninput="window.ui.updateLivePdfPreview()">
                        </div>
                    </div>
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
                                <input type="color" id="compColor" value="${comp.colorPdf || '#5b9bd5'}" oninput="window.ui.updateLivePdfPreview()" style="width:45px; height:45px; padding:0; border:none; cursor:pointer;">
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
                        <!-- El contenido se renderiza dinámicamente según la plantilla elegida -->
                    </div>
                </div>
            </div>
        </div>
    `;

    this.updateLivePdfPreview();
};

ObraUI.prototype.handleLogoUpload = function(this: ObraUI, event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('compLogoBase64')!.setAttribute('value', e.target!.result as string);
        this.updateLivePdfPreview();
    };
    reader.readAsDataURL(file);
};

ObraUI.prototype.clearCompanyLogo = function(this: ObraUI) {
    (document.getElementById('compLogoFile') as HTMLInputElement).value = '';
    (document.getElementById('compLogoBase64') as HTMLInputElement).value = '';
    document.getElementById('compLogoBase64')!.setAttribute('value', '');
    this.updateLivePdfPreview();
};

ObraUI.prototype.updateLivePdfPreview = function(this: ObraUI) {
    const nombre = (document.getElementById('compName') as HTMLInputElement).value.trim() || 'Mi Empresa';
    const subtitulo = (document.getElementById('compSub') as HTMLInputElement).value.trim() || 'Actividad Comercial';
    const telefono = (document.getElementById('compPhone') as HTMLInputElement).value.trim();
    const email = (document.getElementById('compEmail') as HTMLInputElement).value.trim();
    const direccion = (document.getElementById('compAddress') as HTMLInputElement).value.trim();
    const color = (document.getElementById('compColor') as HTMLInputElement).value || '#5b9bd5';
    const logo = (document.getElementById('compLogoBase64') as HTMLInputElement).value;
    const logoPos = (document.getElementById('compLogoPos') as HTMLInputElement).value;
    const notasPie = (document.getElementById('compFootnotes') as HTMLTextAreaElement).value;
    
    const templatePdf = (document.getElementById('compTemplate') as HTMLSelectElement).value;
    const obreros = parseInt((document.getElementById('compWorkers') as HTMLInputElement).value) || 2;
    const validez = (document.getElementById('compValidity') as HTMLInputElement).value || '15 días';

    const logoHtml = logo ? `<img src="${logo}" style="max-height: 45px; max-width: 120px; object-fit: contain; border-radius:3px;">` : `<div style="width:40px; height:40px; background:#e5e7eb; border-radius:4px; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:0.6rem; font-weight:bold;">LOGO</div>`;

    if (templatePdf === 'clasico') {
        // Calcular días con base en 150 hs de mano de obra
        const totalHorasTrabajo = 150;
        const totalDias = Math.round((totalHorasTrabajo / (obreros * 8)) * 2) / 2;
        
        const previewHtml = `
            <div style="background:#ffffff; color:#000000; font-family:'Outfit', 'Plus Jakarta Sans', Arial, sans-serif; font-size:0.75rem; display:flex; flex-direction:column; justify-content:space-between; height:100%; min-height:580px;">
                <div>
                    <!-- Cabecera de Dos Columnas -->
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px; align-items:center; border-bottom:1.5px solid ${color}; padding-bottom:8px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            ${logo ? `<img src="${logo}" style="max-height: 45px; max-width: 110px; object-fit: contain; border-radius:3px;">` : ''}
                            <div>
                                <h3 style="font-size:1.05rem; font-weight:800; color:${color}; margin:0; line-height:1.2;">${nombre}</h3>
                                <p style="font-size:0.65rem; color:#4b5563; margin:2px 0 0 0; font-weight:500;">${subtitulo}</p>
                                <p style="font-size:0.6rem; color:#6b7280; margin:3px 0 0 0;">
                                    ${direccion ? `📍 ${direccion}` : ''}
                                    ${telefono ? ` | 📞 ${telefono}` : ''}
                                    ${email ? ` | ✉️ ${email}` : ''}
                                </p>
                            </div>
                        </div>
                        <div style="text-align:right;">
                            <h4 style="font-size:0.9rem; font-weight:bold; color:${color}; margin:0;">Presupuesto N° PRE-2026-042</h4>
                        </div>
                    </div>

                    <!-- Datos del Cliente (Banner Excel) -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
                        <tr>
                            <td style="background-color: ${color} !important; color: #ffffff !important; font-weight: bold !important; padding: 5px 8px !important; font-size: 0.75rem !important; text-transform: uppercase; border: 1px solid #d1d5db !important; text-align: left;">Datos del cliente</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px !important; background: #f9fafb !important; color: #000000 !important; border: 1px solid #d1d5db !important; font-size:0.7rem !important;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                                    <div>
                                        <table style="width:100%; border:none;">
                                            <tr style="border:none;"><td style="border:none; padding:1px 0; font-weight:bold; width:50px; font-size:0.7rem; color:#4b5563;">Nombre:</td><td style="border:none; padding:1px 0; font-size:0.7rem;">Cliente Ejemplo S.A.</td></tr>
                                            <tr style="border:none;"><td style="border:none; padding:1px 0; font-weight:bold; font-size:0.7rem; color:#4b5563;">Obra:</td><td style="border:none; padding:1px 0; font-size:0.7rem;">Construcción de Muro Divisorio</td></tr>
                                        </table>
                                    </div>
                                    <div>
                                        <table style="width:100%; border:none;">
                                            <tr style="border:none;"><td style="border:none; padding:1px 0; font-weight:bold; width:50px; font-size:0.7rem; color:#4b5563;">CUIT:</td><td style="border:none; padding:1px 0; font-size:0.7rem;">30-12345678-9</td></tr>
                                            <tr style="border:none;"><td style="border:none; padding:1px 0; font-weight:bold; font-size:0.7rem; color:#4b5563;">E-mail:</td><td style="border:none; padding:1px 0; font-size:0.7rem;">contacto@ejemplo.com</td></tr>
                                        </table>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <!-- Tabla de Fecha / Validez -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom:10px; border: 1px solid #d1d5db !important;">
                        <tr style="background:#f9fafb;">
                            <td style="font-weight:bold; width:20%; color:${color}; font-size:0.7rem; padding:6px; border: 1px solid #d1d5db !important;">Fecha presupuesto</td>
                            <td style="width:30%; font-size:0.7rem; padding:6px; border: 1px solid #d1d5db !important;">25/05/2026</td>
                            <td style="font-weight:bold; width:20%; color:${color}; font-size:0.7rem; padding:6px; border: 1px solid #d1d5db !important;">Validez:</td>
                            <td style="width:30%; font-size:0.7rem; padding:6px; border: 1px solid #d1d5db !important;">${validez}</td>
                        </tr>
                    </table>

                    <!-- Tabla General de Ítems (Excel Style) -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #d1d5db !important;">
                        <thead>
                            <tr style="background-color: #f3f4f6 !important; font-weight: bold; text-transform: uppercase;">
                                <th style="padding:5px 6px; font-size:0.65rem; border: 1px solid #d1d5db !important;">Categoría</th>
                                <th style="padding:5px 6px; font-size:0.65rem; border: 1px solid #d1d5db !important;">Rubro</th>
                                <th style="padding:5px 6px; font-size:0.65rem; border: 1px solid #d1d5db !important; text-align:right; width:60px;">Cant.</th>
                                <th style="padding:5px 6px; font-size:0.65rem; border: 1px solid #d1d5db !important; width:40px;">Unid.</th>
                                <th style="padding:5px 6px; font-size:0.65rem; border: 1px solid #d1d5db !important; text-align:right; width:80px;">P. Unit</th>
                                <th style="padding:5px 6px; font-size:0.65rem; border: 1px solid #d1d5db !important; text-align:right; width:90px;">Subtotal</th>
                                <th style="padding:5px 6px; font-size:0.65rem; border: 1px solid #d1d5db !important; text-align:right; width:50px;">Horas</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style="font-weight:bold; color:${color}; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">[MANO DE OBRA]</td>
                                <td style="padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">Mampostería de Ladrillo Común e=15cm</td>
                                <td style="text-align: right; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">50</td>
                                <td style="padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">m2</td>
                                <td style="text-align: right; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">$21.500,00</td>
                                <td style="text-align: right; font-weight:bold; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">$1.075.000,00</td>
                                <td style="text-align: right; font-weight:500; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">150</td>
                            </tr>
                            <tr>
                                <td style="font-weight:bold; color:#10b981; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">[MATERIALES]</td>
                                <td style="padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">Hierro y Cemento Estructurales (Lote)</td>
                                <td style="text-align: right; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">5</td>
                                <td style="padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">u</td>
                                <td style="text-align: right; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">$125.000,00</td>
                                <td style="text-align: right; font-weight:bold; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">$625.000,00</td>
                                <td style="text-align: right; padding:5px 6px; border: 1px solid #d1d5db !important; font-size:0.65rem;">-</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Bloque de Totales Side-by-Side -->
                    <div style="display:flex; justify-content:space-between; gap:20px; align-items:flex-start;">
                        <!-- Planificación (Izquierda) -->
                        <div style="flex:1;">
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db !important;">
                                <tr>
                                    <td style="font-weight:bold; background:#f9fafb; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">SUB-TOTAL HS TRABAJO</td>
                                    <td style="text-align: right; font-weight:bold; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">150 hs</td>
                                </tr>
                                <tr>
                                    <td style="font-weight:bold; background:#f9fafb; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">Obreros</td>
                                    <td style="text-align: right; font-weight:bold; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">${obreros}</td>
                                </tr>
                                <tr style="color:${color}; font-weight:bold;">
                                    <td style="font-weight:bold; background:#f9fafb; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">TOTAL DIAS</td>
                                    <td style="text-align: right; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">${totalDias} días</td>
                                </tr>
                            </table>
                        </div>

                        <!-- Totales Económicos (Derecha) -->
                        <div style="width:180px;">
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db !important;">
                                <tr>
                                    <td style="font-weight:bold; background:#f9fafb; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem; width:55%;">S.T. MANO OBRA</td>
                                    <td style="text-align: right; font-weight:bold; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">$1.075.000,00</td>
                                </tr>
                                <tr>
                                    <td style="font-weight:bold; background:#f9fafb; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">S.T. MATERIALES</td>
                                    <td style="text-align: right; font-weight:bold; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">$625.000,00</td>
                                </tr>
                                <tr>
                                    <td style="font-weight:bold; background:#f9fafb; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">IVA (21%)</td>
                                    <td style="text-align: right; font-weight:bold; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">$357.000,00</td>
                                </tr>
                                <tr style="color:${color}; font-weight:bold; border-top:1.5px solid ${color};">
                                    <td style="font-weight:bold; background:#f9fafb; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">TOTAL FINAL</td>
                                    <td style="text-align: right; padding:5px; border: 1px solid #d1d5db !important; font-size:0.65rem;">$2.057.000,00</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Condiciones y Firmas -->
                <div>
                    ${notasPie ? `
                        <div style="border-top:1px dashed #d1d5db; padding-top:6px; margin-top:12px; font-size:0.6rem; color:#4b5563;">
                            <div style="font-weight:700; color:${color}; margin-bottom:2px; text-transform:uppercase;">Condiciones:</div>
                            <div style="white-space:pre-wrap; line-height:1.3;">${notasPie}</div>
                        </div>
                    ` : ''}

                    <!-- Firmas de Conformidad -->
                    <div style="margin-top:25px; display:flex; justify-content:space-between; font-size:0.6rem; color:#4b5563;">
                        <div style="width:45%; text-align:center; border-top:1px solid #d1d5db; padding-top:4px; font-weight:bold;">
                            Firma Confeccionador
                        </div>
                        <div style="width:45%; text-align:center; border-top:1px solid #d1d5db; padding-top:4px; font-weight:bold;">
                            Firma Aceptación Cliente
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('pdfLivePreviewSheet')!.innerHTML = previewHtml;
    } else {
        // Estructura moderna (diseño premium original)
        let headerLeftHtml = '';
        let headerRightHtml = '';

        if (logoPos === 'right') {
            headerLeftHtml = `
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
            headerRightHtml = `
                <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px;">
                    ${logoHtml}
                </div>
            `;
        } else {
            headerLeftHtml = `
                <div style="display:flex; align-items:center; gap:12px;">
                    ${logoHtml}
                    <div style="text-align: left;">
                        <div style="font-size: 1.1rem; font-weight: 700; color: ${color};">${nombre}</div>
                        <div style="font-size: 0.75rem; color: #4b5563; font-weight: 500;">${subtitulo}</div>
                        <div style="font-size: 0.7rem; color: #6b7280; margin-top: 3px;">
                            ${direccion ? `📍 ${direccion}` : ''}
                            ${telefono ? ` | 📞 ${telefono}` : ''}
                            ${email ? ` | ✉️ ${email}` : ''}
                        </div>
                    </div>
                </div>
            `;
            headerRightHtml = `
                <div style="text-align:right;">
                    <div style="font-weight:700; font-size:0.9rem; color:${color};">PRE-2026-042</div>
                    <div style="font-size:0.75rem; color:#6b7280; margin-top:2px;">Fecha: 2026-05-25</div>
                </div>
            `;
        }

        const previewHtml = `
            <div style="background:#ffffff; color:#1f2937; font-family:'Plus Jakarta Sans', sans-serif; font-size:0.75rem; display:flex; flex-direction:column; justify-content:space-between; height:100%; min-height:580px;">
                <div>
                    <!-- Encabezado Hoja -->
                    <div style="display:flex; justify-content:space-between; border-bottom:2px solid ${color}; padding-bottom:12px; margin-bottom:16px; align-items:center; min-height:65px;">
                        ${headerLeftHtml}
                        ${headerRightHtml}
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
                            <tr style="border-bottom:2px solid ${color};">
                                <th style="padding:6px 8px; font-size:0.7rem; font-weight:700; color:#374151; text-transform:uppercase;">Descripción del Rubro</th>
                                <th style="padding:6px 8px; font-size:0.7rem; font-weight:700; color:#374151; text-transform:uppercase; text-align:right; width:70px;">Cantidad</th>
                                <th style="padding:6px 8px; font-size:0.7rem; font-weight:700; color:#374151; text-transform:uppercase; text-align:right; width:90px;">P. Unitario</th>
                                <th style="padding:6px 8px; font-size:0.7rem; font-weight:700; color:#374151; text-transform:uppercase; text-align:right; width:100px;">Subtotal</th>
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
                                <span style="color:#4b5563;">IVA (21%):</span>
                                <span>$357.000,00</span>
                            </div>
                            <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.8rem; margin-top:2px; border-top:1px solid #e5e7eb; padding-top:4px; color:${color};">
                                <span>Total Final:</span>
                                <span>$2.057.000,00</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Notas al Pie Mock -->
                <div style="border-top:1px dashed #d1d5db; padding-top:10px; margin-top:20px; font-size:0.65rem; color:#6b7280;">
                    <div style="font-weight:700; color:#4b5563; margin-bottom:4px; text-transform:uppercase;">Condiciones Comerciales:</div>
                    <div style="white-space:pre-wrap;">${notasPie || 'Sin condiciones particulares.'}</div>
                </div>
            </div>
        `;
        document.getElementById('pdfLivePreviewSheet')!.innerHTML = previewHtml;
    }
};

ObraUI.prototype.saveCompanyProfile = function(this: ObraUI) {
    const nombre = (document.getElementById('compName') as HTMLInputElement).value.trim();
    const subtitulo = (document.getElementById('compSub') as HTMLInputElement).value.trim();
    const telefono = (document.getElementById('compPhone') as HTMLInputElement).value.trim();
    const email = (document.getElementById('compEmail') as HTMLInputElement).value.trim();
    const direccion = (document.getElementById('compAddress') as HTMLInputElement).value.trim();
    const color = (document.getElementById('compColor') as HTMLInputElement).value;
    const logo = (document.getElementById('compLogoBase64') as HTMLInputElement).value;
    const logoPos = (document.getElementById('compLogoPos') as HTMLSelectElement).value as 'left' | 'right';
    const notasPie = (document.getElementById('compFootnotes') as HTMLTextAreaElement).value;
    
    const templatePdf = (document.getElementById('compTemplate') as HTMLSelectElement).value as 'clasico' | 'moderno';
    const obrerosPorDefecto = parseInt((document.getElementById('compWorkers') as HTMLInputElement).value) || 2;
    const validezPorDefecto = (document.getElementById('compValidity') as HTMLInputElement).value.trim() || '15 días';

    if (!nombre) {
        alert('Por favor, ingresa al menos el Nombre Comercial de tu empresa.');
        return;
    }

    const settings: CompanySettings = {
        nombre,
        subtitulo,
        telefono,
        email,
        direccion,
        colorPdf: color,
        logo,
        logoPos,
        notesPie: notasPie, // compatible con variables antiguas
        notasPie,
        templatePdf,
        obrerosPorDefecto,
        validezPorDefecto
    };

    window.db.saveCompanySettings(settings);
    alert('¡Configuración de diseño de PDF guardada con éxito!');
    this.switchTab('dashboard');
};
