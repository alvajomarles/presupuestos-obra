// Capa de base de datos local usando LocalStorage
// Proveedor de persistencia y datos iniciales (semilla)

const STORAGE_KEYS = {
    MATERIALS: 'obra_db_materials',
    LABOR: 'obra_db_labor',
    APU: 'obra_db_apu',
    BUDGETS: 'obra_db_budgets',
    COMPANY: 'obra_db_company'
};

// Datos Semilla Iniciales
const DEFAULT_MATERIALS = [
    { id: 'mat-1', nombre: 'Cemento Portland (bolsa 50kg)', unidad: 'bolsa', precioUnitario: 8500, categoria: 'Aglomerantes', fechaActualizacion: '2026-05-25' },
    { id: 'mat-2', nombre: 'Arena gruesa', unidad: 'm3', precioUnitario: 12000, categoria: 'Áridos', fechaActualizacion: '2026-05-25' },
    { id: 'mat-3', nombre: 'Piedra partida 1-3', unidad: 'm3', precioUnitario: 15000, categoria: 'Áridos', fechaActualizacion: '2026-05-25' },
    { id: 'mat-4', nombre: 'Ladrillo común (x 1000)', unidad: 'millar', precioUnitario: 95000, categoria: 'Mampuestos', fechaActualizacion: '2026-05-25' },
    { id: 'mat-5', nombre: 'Hierro aledado ø 8mm (12m)', unidad: 'barra', precioUnitario: 6500, categoria: 'Aceros', fechaActualizacion: '2026-05-25' },
    { id: 'mat-6', nombre: 'Madera para encofrado (Pino)', unidad: 'pie2', precioUnitario: 1200, categoria: 'Maderas', fechaActualizacion: '2026-05-25' },
    { id: 'mat-7', nombre: 'Cable unipolar 2.5 mm2', unidad: 'm', precioUnitario: 450, categoria: 'Electricidad', fechaActualizacion: '2026-05-25' },
    { id: 'mat-8', nombre: 'Pintura Látex Exterior (20L)', unidad: 'lata', precioUnitario: 65000, categoria: 'Pinturas', fechaActualizacion: '2026-05-25' }
];

const DEFAULT_LABOR = [
    { id: 'lab-1', nombre: 'Oficial Albañil', unidad: 'hora', precioUnitario: 3500, categoria: 'Albañilería', fechaActualizacion: '2026-05-25' },
    { id: 'lab-2', nombre: 'Ayudante de Albañilería', unidad: 'hora', precioUnitario: 2600, categoria: 'Albañilería', fechaActualizacion: '2026-05-25' },
    { id: 'lab-3', nombre: 'Oficial Electricista', unidad: 'hora', precioUnitario: 4000, categoria: 'Instalaciones', fechaActualizacion: '2026-05-25' },
    { id: 'lab-4', nombre: 'Oficial Pintor', unidad: 'hora', precioUnitario: 3200, categoria: 'Acabados', fechaActualizacion: '2026-05-25' }
];

const DEFAULT_APU = [
    {
        id: 'apu-1',
        nombre: 'Mampostería de Ladrillo Común e=15cm',
        unidad: 'm2',
        categoria: 'Albañilería',
        materiales: [
            { materialId: 'mat-1', rendimiento: 0.3 },  // Cemento (bolsa)
            { materialId: 'mat-2', rendimiento: 0.04 }, // Arena (m3)
            { materialId: 'mat-4', rendimiento: 0.06 }  // Ladrillos (millar = 60 unidades)
        ],
        manoDeObra: [
            { manoObraId: 'lab-1', rendimiento: 1.5 }, // Oficial albañil (horas)
            { manoObraId: 'lab-2', rendimiento: 1.5 }  // Ayudante (horas)
        ],
        costoAdicionalPorcentaje: 5 // 5% para herramientas y desperdicio
    },
    {
        id: 'apu-2',
        nombre: 'Cimiento de Hormigón Armado para Vigas',
        unidad: 'm3',
        categoria: 'Estructuras',
        materiales: [
            { materialId: 'mat-1', rendimiento: 7.0 },  // Cemento (bolsa)
            { materialId: 'mat-2', rendimiento: 0.5 },  // Arena (m3)
            { materialId: 'mat-3', rendimiento: 0.75 }, // Piedra partida (m3)
            { materialId: 'mat-5', rendimiento: 4.5 },  // Hierro ø 8mm (barras)
            { materialId: 'mat-6', rendimiento: 8.0 }   // Madera encofrado (pie2)
        ],
        manoDeObra: [
            { manoObraId: 'lab-1', rendimiento: 8.0 },  // Oficial (horas)
            { manoObraId: 'lab-2', rendimiento: 12.0 }  // Ayudante (horas)
        ],
        costoAdicionalPorcentaje: 8 // 8% de desperdicio/encofrado/herramientas
    },
    {
        id: 'apu-3',
        nombre: 'Instalación de Punto y Tomacorriente Eléctrico',
        unidad: 'u',
        categoria: 'Instalaciones',
        materiales: [
            { materialId: 'mat-7', rendimiento: 15.0 }  // Cable 2.5mm (m)
        ],
        manoDeObra: [
            { manoObraId: 'lab-3', rendimiento: 2.0 }   // Oficial electricista (horas)
        ],
        costoAdicionalPorcentaje: 10
    }
];

const DEFAULT_BUDGETS = [
    {
        id: 'bud-1',
        codigo: 'PRE-2026-001',
        cliente: 'Constructora del Plata S.A.',
        proyecto: 'Ampliación Oficina Planta Baja',
        fecha: '2026-05-20',
        estado: 'Aprobado',
        items: [
            {
                id: 'item-b1',
                itemApuId: 'apu-2',
                nombre: 'Cimiento de Hormigón Armado para Vigas',
                unidad: 'm3',
                cantidad: 8,
                precioUnitarioHistorico: 125000,
                // Copia histórica del APU
                materialesCopia: [
                    { nombre: 'Cemento Portland (bolsa 50kg)', unidad: 'bolsa', rendimiento: 7.0, precioUnitario: 8500 },
                    { nombre: 'Arena gruesa', unidad: 'm3', rendimiento: 0.5, precioUnitario: 12000 },
                    { nombre: 'Piedra partida 1-3', unidad: 'm3', rendimiento: 0.75, precioUnitario: 15000 },
                    { nombre: 'Hierro aledado ø 8mm (12m)', unidad: 'barra', rendimiento: 4.5, precioUnitario: 6500 },
                    { nombre: 'Madera para encofrado (Pino)', unidad: 'pie2', rendimiento: 8.0, precioUnitario: 1200 }
                ],
                manoObraCopia: [
                    { nombre: 'Oficial Albañil', unidad: 'hora', rendimiento: 8.0, precioUnitario: 3500 },
                    { nombre: 'Ayudante de Albañilería', unidad: 'hora', rendimiento: 12.0, precioUnitario: 2600 }
                ],
                costoAdicionalPorcentaje: 8
            },
            {
                id: 'item-b2',
                itemApuId: 'apu-1',
                nombre: 'Mampostería de Ladrillo Común e=15cm',
                unidad: 'm2',
                cantidad: 45,
                precioUnitarioHistorico: 21500,
                materialesCopia: [
                    { nombre: 'Cemento Portland (bolsa 50kg)', unidad: 'bolsa', rendimiento: 0.3, precioUnitario: 8500 },
                    { nombre: 'Arena gruesa', unidad: 'm3', rendimiento: 0.04, precioUnitario: 12000 },
                    { nombre: 'Ladrillo común (x 1000)', unidad: 'millar', rendimiento: 0.06, precioUnitario: 95000 }
                ],
                manoObraCopia: [
                    { nombre: 'Oficial Albañil', unidad: 'hora', rendimiento: 1.5, precioUnitario: 3500 },
                    { nombre: 'Ayudante de Albañilería', unidad: 'hora', rendimiento: 1.5, precioUnitario: 2600 }
                ],
                costoAdicionalPorcentaje: 5
            }
        ],
        subtotal: 1967500,
        margenGanancia: 15,
        impuestos: 21,
        total: 2737777.5
    }
];

const DEFAULT_COMPANY = {
    nombre: 'Construcciones Alvaro',
    subtitulo: 'Reformas Generales y Obras Civiles',
    email: 'info@construccionesalvaro.com',
    telefono: '+54 9 11 9876-5432',
    direccion: 'Calle Falsa 123, Buenos Aires',
    notasPie: '• Validez del presupuesto: 15 días.\n• El precio incluye materiales y mano de obra detallados.\n• Forma de pago: 50% de anticipo y 50% contra entrega o avance certificado.',
    colorPdf: '#6366f1',
    logo: '',
    logoPos: 'left'
};

class ObraDatabase {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        if (!localStorage.getItem(STORAGE_KEYS.MATERIALS)) {
            localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(DEFAULT_MATERIALS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.LABOR)) {
            localStorage.setItem(STORAGE_KEYS.LABOR, JSON.stringify(DEFAULT_LABOR));
        }
        if (!localStorage.getItem(STORAGE_KEYS.APU)) {
            localStorage.setItem(STORAGE_KEYS.APU, JSON.stringify(DEFAULT_APU));
        }
        if (!localStorage.getItem(STORAGE_KEYS.BUDGETS)) {
            localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.COMPANY)) {
            localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(DEFAULT_COMPANY));
        }
    }

    getCompanySettings() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.COMPANY)) || DEFAULT_COMPANY;
    }

    saveCompanySettings(settings) {
        localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(settings));
        return settings;
    }

    // --- MATERIALES ---
    getMaterials() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.MATERIALS)) || [];
    }

    saveMaterial(material) {
        const materials = this.getMaterials();
        if (material.id) {
            const index = materials.findIndex(m => m.id === material.id);
            if (index !== -1) {
                materials[index] = { ...materials[index], ...material, fechaActualizacion: new Date().toISOString().split('T')[0] };
            }
        } else {
            material.id = 'mat-' + Date.now();
            material.fechaActualizacion = new Date().toISOString().split('T')[0];
            materials.push(material);
        }
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
        return material;
    }

    deleteMaterial(id) {
        let materials = this.getMaterials();
        materials = materials.filter(m => m.id !== id);
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
    }

    // --- MANO DE OBRA ---
    getLabor() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.LABOR)) || [];
    }

    saveLabor(labor) {
        const laborList = this.getLabor();
        if (labor.id) {
            const index = laborList.findIndex(l => l.id === labor.id);
            if (index !== -1) {
                laborList[index] = { ...laborList[index], ...labor, fechaActualizacion: new Date().toISOString().split('T')[0] };
            }
        } else {
            labor.id = 'lab-' + Date.now();
            labor.fechaActualizacion = new Date().toISOString().split('T')[0];
            laborList.push(labor);
        }
        localStorage.setItem(STORAGE_KEYS.LABOR, JSON.stringify(laborList));
        return labor;
    }

    deleteLabor(id) {
        let laborList = this.getLabor();
        laborList = laborList.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEYS.LABOR, JSON.stringify(laborList));
    }

    // --- ANALISIS DE PRECIOS UNITARIOS (APU) ---
    getApuItems() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.APU)) || [];
    }

    saveApuItem(apu) {
        const apuList = this.getApuItems();
        if (apu.id) {
            const index = apuList.findIndex(a => a.id === apu.id);
            if (index !== -1) {
                apuList[index] = { ...apuList[index], ...apu };
            }
        } else {
            apu.id = 'apu-' + Date.now();
            apuList.push(apu);
        }
        localStorage.setItem(STORAGE_KEYS.APU, JSON.stringify(apuList));
        return apu;
    }

    deleteApuItem(id) {
        let apuList = this.getApuItems();
        apuList = apuList.filter(a => a.id !== id);
        localStorage.setItem(STORAGE_KEYS.APU, JSON.stringify(apuList));
    }

    // --- PRESUPUESTOS ---
    getBudgets() {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGETS)) || [];
    }

    saveBudget(budget) {
        const budgets = this.getBudgets();
        if (budget.id) {
            const index = budgets.findIndex(b => b.id === budget.id);
            if (index !== -1) {
                budgets[index] = { ...budgets[index], ...budget };
            }
        } else {
            budget.id = 'bud-' + Date.now();
            // Auto generate code if not present
            if (!budget.codigo) {
                const year = new Date().getFullYear();
                const count = budgets.length + 1;
                budget.codigo = `PRE-${year}-${String(count).padStart(3, '0')}`;
            }
            budgets.push(budget);
        }
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
        return budget;
    }

    deleteBudget(id) {
        let budgets = this.getBudgets();
        budgets = budgets.filter(b => b.id !== id);
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    }

    // --- GESTIÓN GENERAL DE DATOS ---
    exportData() {
        const data = {
            materials: this.getMaterials(),
            labor: this.getLabor(),
            apu: this.getApuItems(),
            budgets: this.getBudgets(),
            company: this.getCompanySettings(),
            version: '1.1',
            exportedAt: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.materials) localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(data.materials));
            if (data.labor) localStorage.setItem(STORAGE_KEYS.LABOR, JSON.stringify(data.labor));
            if (data.apu) localStorage.setItem(STORAGE_KEYS.APU, JSON.stringify(data.apu));
            if (data.budgets) localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(data.budgets));
            if (data.company) localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(data.company));
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }

    resetDatabase() {
        localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(DEFAULT_MATERIALS));
        localStorage.setItem(STORAGE_KEYS.LABOR, JSON.stringify(DEFAULT_LABOR));
        localStorage.setItem(STORAGE_KEYS.APU, JSON.stringify(DEFAULT_APU));
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(DEFAULT_BUDGETS));
        localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(DEFAULT_COMPANY));
    }
}

// Exportar instancia global
const db = new ObraDatabase();
window.db = db;
