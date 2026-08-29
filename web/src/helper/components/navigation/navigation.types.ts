// ===========================================================================>> Core Library
import {


    IsActiveMatchOptions,
    Params,
    QueryParamsHandling,
} from '@angular/router';

// ======================================= >> Code Starts Here << ========================== //


export interface HelperNavigationItem {
    id?: string;
    title?: string;
    type: 'aside' | 'basic' | 'collapsable' | 'divider' | 'group';
    hidden?: (item: HelperNavigationItem) => boolean;
    active?: boolean;
    disabled?: boolean;
    tooltip?: string;
    link?: string;
    fragment?: string;
    preserveFragment?: boolean;
    queryParams?: Params | null;
    queryParamsHandling?: QueryParamsHandling | null;
    externalLink?: boolean;
    target?: '_blank' | '_self' | '_parent' | '_top' | string;
    exactMatch?: boolean;
    isActiveMatchOptions?: IsActiveMatchOptions;
    function?: (item: HelperNavigationItem) => void;
    classes?: {
        title?: string;
        subtitle?: string;
        icon?: string;
        wrapper?: string;
    };
    icon?: string;
    badge?: {
        title?: string;
        classes?: string;
    };
    children?: HelperNavigationItem[];
    meta?: any;
}

export type HelperNavigationAppearance =
    | 'default'
    | 'compact'
    | 'thin'

export type HelperNavigationMode = 'over' | 'side';

export type HelperNavigationPosition = 'left' | 'right';
