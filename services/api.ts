
import type { UserSettings, CardDetails, CardApplicationData, BankAccount, LoanApplication, P2POrder, P2POffer, PaymentMethod } from '../types';

// In a real app, this would come from an environment variable
const API_BASE_URL = '/api'; // Use relative path for same-origin requests

const getAuthHeaders = () => {
    const token = localStorage.getItem('valifi_token');
    // The mock backend uses the email as a token.
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Handles responses where data is nested under a `data` key
const handleDataResponse = async (response: Response) => {
    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.message || `HTTP error! status: ${response.status}`);
    }
    return json.data;
};

// Handles responses where data is at the root (like auth)
const handleRootResponse = async (response: Response) => {
    const json = await response.json();
    if (!response.ok) {
        throw new Error(json.message || `HTTP error! status: ${response.status}`);
    }
    return json;
};

// --- AUTH & USER ---

// This function is what's actually called from App.tsx's checkLoggedIn
export const getUserProfile = async (token: string): Promise<any> => {
     const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleDataResponse(response);
};

export const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; user?: any; }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const authData = await handleRootResponse(response);
        
        // After login, fetch the full user profile with the new token
        const user = await getUserProfile(authData.token);
        
        return { success: true, user: { ...user, token: authData.token } };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
};

export const register = async (fullName: string, username: string, email: string, password: string): Promise<{ success: boolean; message?: string; user?: any; }> => {
     try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, username, email, password }),
        });
        const authData = await handleRootResponse(response);
        
        const user = await getUserProfile(authData.token);

        return { success: true, user: { ...user, token: authData.token } };

    } catch (e: any) {
        return { success: false, message: e.message };
    }
};


export const updateUserSettings = async (userId: string, newSettings: UserSettings): Promise<{settings: UserSettings}> => {
     const response = await fetch(`${API_BASE_URL}/users/me/settings`, {
        method: 'PUT',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
    });
    return handleDataResponse(response);
};

// --- DATA FETCHING (called from App.tsx) ---
export const getCardDetails = async (userId: string): Promise<CardDetails> => handleDataResponse(await fetch(`${API_BASE_URL}/cards/details`, { headers: getAuthHeaders() }));
export const getBankAccounts = async (userId: string): Promise<BankAccount[]> => handleDataResponse(await fetch(`${API_BASE_URL}/banking/accounts`, { headers: getAuthHeaders() }));
export const getLoans = async (userId: string): Promise<LoanApplication[]> => handleDataResponse(await fetch(`${API_BASE_URL}/loans`, { headers: getAuthHeaders() }));
export const getP2POffers = async (): Promise<{ offers: P2POffer[] }> => handleDataResponse(await fetch(`${API_BASE_URL}/p2p/offers`, { headers: getAuthHeaders() }));
export const getMyP2POrders = async (userId: string): Promise<{ orders: P2POrder[] }> => handleDataResponse(await fetch(`${API_BASE_URL}/p2p/my-orders`, { headers: getAuthHeaders() }));
export const getPaymentMethods = async (userId: string): Promise<{ paymentMethods: PaymentMethod[] }> => handleDataResponse(await fetch(`${API_BASE_URL}/p2p/payment-methods`, { headers: getAuthHeaders() }));
export const getReitProperties = async (): Promise<{ reitProperties: any[] }> => handleDataResponse(await fetch(`${API_BASE_URL}/investments/reit-properties`, { headers: getAuthHeaders() }));
export const getStakableStocks = async (): Promise<{ stakableStocks: any[] }> => handleDataResponse(await fetch(`${API_BASE_URL}/investments/stakable-stocks`, { headers: getAuthHeaders() }));
export const getInvestableNfts = async (): Promise<{ investableNFTs: any[] }> => handleDataResponse(await fetch(`${API_BASE_URL}/investments/investable-nfts`, { headers: getAuthHeaders() }));

// --- AI & OTHER ACTIONS ---
export const callCoPilot = async (prompt: string, systemInstruction?: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/copilot`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, systemInstruction }),
    });
    return handleDataResponse(response);
};

export const callTaxAdvisor = async (prompt: string) => {
    const response = await fetch(`${API_BASE_URL}/ai/tax-advisor`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });
    return handleDataResponse(response);
};

export const onInitiateTrade = async (offerId: string, amount: number, paymentMethodId: string): Promise<P2POrder> => {
     const response = await fetch(`${API_BASE_URL}/p2p/orders`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, amount, paymentMethodId }),
    });
    const data = await handleDataResponse(response);
    return data.order;
};

// Note: Other action functions (like onSwap, onInvest) can be added here as needed.
// They are not included now to keep changes minimal, as they are not wired up in App.tsx.
