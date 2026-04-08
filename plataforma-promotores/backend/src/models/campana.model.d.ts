import { Campana } from '../types';
export declare class CampanaModel {
    findByDate(fecha: string): Campana | null;
    findById(id: string): Campana | null;
    getAll(): Campana[];
    getActive(): Campana[];
    create(data: {
        nombre: string;
        fecha: string;
        activa?: boolean;
    }): Campana;
    createForToday(): Campana;
    ensureTodayCampaign(): Campana;
    update(id: string, data: Partial<Omit<Campana, 'id' | 'createdAt'>>): Campana | null;
    delete(id: string): boolean;
    getWithStats(id: string): (Campana & {
        stats: any;
    }) | null;
    getWithTramites(idPromotor?: string): Campana[];
}
export declare const campanaModel: CampanaModel;
//# sourceMappingURL=campana.model.d.ts.map