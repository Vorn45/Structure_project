export interface PhoneGpsLocation {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number | null;
    timestamp: number;
    formattedAddress?: string;
}

