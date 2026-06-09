interface CompanySettings {
    nombre: string;
    subtitulo: string;
    email: string;
    telefono: string;
    direccion: string;
    notasPie: string;
    notesPie?: string; // compatible con variables antiguas
    colorPdf: string;
    logo: string;
    logoPos: 'left' | 'right';
    templatePdf: 'clasico' | 'moderno';
    obrerosPorDefecto: number;
    validezPorDefecto: string;
}

interface Material {
    id: string;
    nombre: string;
    unidad: string;
    precioUnitario: number;
    categoria: string;
    fechaActualizacion: string;
}

interface Labor {
    id: string;
    nombre: string;
    unidad: string;
    precioUnitario: number;
    categoria: string;
    fechaActualizacion: string;
}

interface ApuMaterial {
    materialId: string;
    rendimiento: number;
}

interface ApuLabor {
    manoObraId: string;
    rendimiento: number;
}

interface ApuItem {
    id: string;
    nombre: string;
    unidad: string;
    categoria: string;
    materiales: ApuMaterial[];
    manoDeObra: ApuLabor[];
    costoAdicionalPorcentaje: number;
}

interface MaterialCopia {
    nombre: string;
    unidad: string;
    rendimiento: number;
    precioUnitario: number;
}

interface LaborCopia {
    nombre: string;
    unidad: string;
    rendimiento: number;
    precioUnitario: number;
}

interface BudgetItem {
    id: string;
    itemApuId: string;
    nombre: string;
    unidad: string;
    cantidad: number;
    precioUnitarioHistorico: number;
    materialesCopia: MaterialCopia[];
    manoObraCopia: LaborCopia[];
    costoAdicionalPorcentaje: number;
}

interface Budget {
    id?: string;
    codigo?: string;
    cliente: string;
    proyecto: string;
    fecha: string;
    estado: 'Borrador' | 'Enviado' | 'Aprobado' | 'Rechazado';
    items: BudgetItem[];
    validez: string;
    obreros: number;
    subtotal: number;
    margenGanancia: number;
    impuestos: number;
    total: number;
}
