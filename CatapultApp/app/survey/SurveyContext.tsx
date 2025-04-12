import React, { createContext, useContext, useState } from 'react';

type TripType = 'business' | 'personal' | null;
type Budget = 'high' | 'low' | null;

interface SurveyData {
    tripType: TripType;
    location: string | null;
    duration: number | null;
    budget: Budget;
    budgetTier: 'budget' | 'comfort' | 'luxury';
    startDate?: string | null; // Add startDate
    endDate?: string | null;   // Add endDate
}

interface Trip {
    id: string;
    destination: string;
    image: string;
    dates: string;
    status: 'upcoming' | 'past' | 'draft';
}

interface SurveyContextType {
    surveyData: SurveyData;
    updateSurveyData: (field: keyof SurveyData, value: any) => void;
    resetSurvey: () => void;
    trips: Trip[];
    addTrip: (trip: Trip) => void;
}

const initialSurveyData: SurveyData = {
    tripType: null,
    location: null,
    duration: null,
    budget: null,
    budgetTier: 'budget',
    startDate: null,
    endDate: null,
};

const initialTrips: Trip[] = [
    {
        id: '5',
        destination: 'Chicago, USA',
        image: 'https://images.unsplash.com/photo-1494522358652-f30e61a60313?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        dates: 'April 20-25, 2025',
        status: 'upcoming',
    },
    {
        id: '1',
        destination: 'Paris, France',
        image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        dates: 'June 5-10, 2025',
        status: 'upcoming',
    },
    {
        id: '2',
        destination: 'Tokyo, Japan',
        image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        dates: 'August 12-22, 2025',
        status: 'upcoming',
    },
    {
        id: '3',
        destination: 'Barcelona, Spain',
        image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        dates: 'March 3-8, 2025',
        status: 'past',
    },
    {
        id: '4',
        destination: 'New York, USA',
        image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
        dates: 'Planning in progress',
        status: 'draft',
    },
];

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export function SurveyProvider({ children }: { children: React.ReactNode }) {
    const [surveyData, setSurveyData] = useState<SurveyData>(initialSurveyData);
    const [trips, setTrips] = useState<Trip[]>(initialTrips);

    const updateSurveyData = (field: keyof SurveyData, value: any) => {
        setSurveyData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const resetSurvey = () => {
        setSurveyData(initialSurveyData);
    };

    const addTrip = (trip: Trip) => {
        setTrips(prev => [trip, ...prev]);
    };

    return (
        <SurveyContext.Provider value={{ surveyData, updateSurveyData, resetSurvey, trips, addTrip }}>
            {children}
        </SurveyContext.Provider>
    );
}

export function useSurvey() {
    const context = useContext(SurveyContext);
    if (context === undefined) {
        throw new Error('useSurvey must be used within a SurveyProvider');
    }
    return context;
}

export default SurveyProvider;