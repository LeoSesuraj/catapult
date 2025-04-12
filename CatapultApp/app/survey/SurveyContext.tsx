import React, { createContext, useContext, useState } from 'react';

type TripType = 'business' | 'personal' | null;
type Budget = 'high' | 'low' | null;

interface SurveyData {
    tripType: TripType;
    location: string | null;
    duration: number | null;
    budget: Budget;
}

interface SurveyContextType {
    surveyData: SurveyData;
    updateSurveyData: (field: keyof SurveyData, value: any) => void;
    resetSurvey: () => void;
}

const initialSurveyData: SurveyData = {
    tripType: null,
    location: null,
    duration: null,
    budget: null,
};

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export function SurveyProvider({ children }: { children: React.ReactNode }) {
    const [surveyData, setSurveyData] = useState<SurveyData>(initialSurveyData);

    const updateSurveyData = (field: keyof SurveyData, value: any) => {
        setSurveyData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const resetSurvey = () => {
        setSurveyData(initialSurveyData);
    };

    return (
        <SurveyContext.Provider value={{ surveyData, updateSurveyData, resetSurvey }}>
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