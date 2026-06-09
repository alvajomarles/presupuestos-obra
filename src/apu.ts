// Motor de cálculo de Análisis de Precios Unitarios (APU) y desgloses de presupuestos

class ApuEngine {
    /**
     * Calcula el precio unitario detallado de un ítem APU basado en los precios actuales del inventario.
     * @param {ApuItem} apuItem - El ítem APU a calcular.
     * @param {Material[]} materialsList - Lista actual de materiales.
     * @param {Labor[]} laborList - Lista actual de mano de obra.
     * @returns {Object} Desglose completo de costos y precio unitario final.
     */
    calculateItemPrice(apuItem: ApuItem, materialsList: Material[], laborList: Labor[]) {
        let costoMateriales = 0;
        let costoManoObra = 0;

        const materialesDetalle = (apuItem.materiales || []).map(item => {
            const material = materialsList.find(m => m.id === item.materialId);
            const precioUnitario = material ? material.precioUnitario : 0;
            const nombre = material ? material.nombre : 'Material no encontrado';
            const unidad = material ? material.unidad : '';
            const subtotal = item.rendimiento * precioUnitario;
            
            costoMateriales += subtotal;

            return {
                materialId: item.materialId,
                nombre,
                unidad,
                rendimiento: item.rendimiento,
                precioUnitario,
                subtotal
            };
        });

        const manoObraDetalle = (apuItem.manoDeObra || []).map(item => {
            const labor = laborList.find(l => l.id === item.manoObraId);
            const precioUnitario = labor ? labor.precioUnitario : 0;
            const nombre = labor ? labor.nombre : 'Rol no encontrado';
            const unidad = labor ? labor.unidad : '';
            const subtotal = item.rendimiento * precioUnitario;

            costoManoObra += subtotal;

            return {
                manoObraId: item.manoObraId,
                nombre,
                unidad,
                rendimiento: item.rendimiento,
                precioUnitario,
                subtotal
            };
        });

        const costoDirecto = costoMateriales + costoManoObra;
        const porcentajeAdicional = apuItem.costoAdicionalPorcentaje || 0;
        const costoAdicional = costoDirecto * (porcentajeAdicional / 100);
        const precioUnitarioFinal = costoDirecto + costoAdicional;

        return {
            id: apuItem.id,
            nombre: apuItem.nombre,
            unidad: apuItem.unidad,
            categoria: apuItem.categoria,
            materiales: materialesDetalle,
            manoDeObra: manoObraDetalle,
            costoMateriales,
            costoManoObra,
            costoDirecto,
            costoAdicionalPorcentaje: porcentajeAdicional,
            costoAdicional,
            precioUnitario: precioUnitarioFinal
        };
    }

    /**
     * Calcula los totales de un presupuesto.
     * @param {BudgetItem[]} itemsPresupuesto - Ítems cargados en el presupuesto con cantidad y precio unitario.
     * @param {number} margenGanancia - Porcentaje de ganancia.
     * @param {number} impuestos - Porcentaje de impuestos (IVA, etc.).
     * @returns {Object} Subtotal, margen de ganancia, impuestos y total.
     */
    calculateBudgetTotals(itemsPresupuesto: BudgetItem[], margenGanancia = 0, impuestos = 0) {
        // El subtotal es la suma de (cantidad * precioUnitario) de cada ítem
        const subtotal = itemsPresupuesto.reduce((sum, item) => sum + (item.cantidad * item.precioUnitarioHistorico), 0);
        const montoGanancia = subtotal * (margenGanancia / 100);
        const subtotalConGanancia = subtotal + montoGanancia;
        const montoImpuestos = subtotalConGanancia * (impuestos / 100);
        const total = subtotalConGanancia + montoImpuestos;

        return {
            subtotal,
            margenGananciaPercent: margenGanancia,
            margenGananciaMonto: montoGanancia,
            impuestosPercent: impuestos,
            impuestosMonto: montoImpuestos,
            total
        };
    }

    /**
     * Obtiene el historial de precios sugeridos para un ítem APU específico.
     * @param {string} apuId - ID del ítem APU.
     * @param {Budget[]} budgets - Lista de presupuestos guardados.
     * @returns {Array} Lista ordenada por fecha con los precios unitarios históricos asignados.
     */
    getHistoricalPrices(apuId: string, budgets: Budget[]) {
        const history: any[] = [];

        budgets.forEach(budget => {
            const item = budget.items.find(i => i.itemApuId === apuId);
            if (item) {
                history.push({
                    presupuestoId: budget.id,
                    codigo: budget.codigo,
                    cliente: budget.cliente,
                    proyecto: budget.proyecto,
                    fecha: budget.fecha,
                    cantidad: item.cantidad,
                    precioUnitario: item.precioUnitarioHistorico,
                    estado: budget.estado
                });
            }
        });

        // Ordenar por fecha descendente (más recientes primero)
        return history.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }

    /**
     * Estima el precio sugerido de un APU basándose en el historial y el precio de mercado actual.
     * Devuelve estadísticas útiles para la toma de decisiones.
     * @param {string} apuId - ID del ítem APU.
     * @param {number} currentCalculatedPrice - Precio unitario calculado actual.
     * @param {Budget[]} budgets - Lista de presupuestos guardados.
     * @returns {Object} Estadísticas históricas y sugerencia de precio.
     */
    getPriceGuide(apuId: string, currentCalculatedPrice: number, budgets: Budget[]) {
        const history = this.getHistoricalPrices(apuId, budgets);
        if (history.length === 0) {
            return {
                precioActualCalculado: currentCalculatedPrice,
                historicoMin: null,
                historicoMax: null,
                historicoPromedio: null,
                ultimoPrecio: null,
                sugerido: currentCalculatedPrice,
                historial: [] as any[]
            };
        }

        const preciosValidos = history.map(h => h.precioUnitario);
        const min = Math.min(...preciosValidos);
        const max = Math.max(...preciosValidos);
        const promedio = preciosValidos.reduce((sum, val) => sum + val, 0) / preciosValidos.length;
        const ultimo = history[0].precioUnitario;

        // El sugerido prioriza el precio calculado actual, pero si el histórico es mayor por inflación,
        // da una advertencia o sugerencia promedio
        return {
            precioActualCalculado: currentCalculatedPrice,
            historicoMin: min,
            historicoMax: max,
            historicoPromedio: promedio,
            ultimoPrecio: ultimo,
            sugerido: Math.max(currentCalculatedPrice, ultimo),
            historial: history
        };
    }
}

const apuEngine = new ApuEngine();
window.apuEngine = apuEngine;
