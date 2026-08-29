import { Injectable } from '@angular/core';
import { HelperDrawerComponent } from 'helper/components/drawer/drawer.component';

@Injectable({ providedIn: 'root' })
export class HelperDrawerService {
    private _componentRegistry: Map<string, HelperDrawerComponent> = new Map<
        string,
        HelperDrawerComponent
    >();

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register drawer component
     *
     * @param name
     * @param component
     */
    registerComponent(name: string, component: HelperDrawerComponent): void {
        this._componentRegistry.set(name, component);
    }

    /**
     * Deregister drawer component
     *
     * @param name
     */
    deregisterComponent(name: string): void {
        this._componentRegistry.delete(name);
    }

    /**
     * Get drawer component from the registry
     *
     * @param name
     */
    getComponent(name: string): HelperDrawerComponent | undefined {
        return this._componentRegistry.get(name);
    }
}
