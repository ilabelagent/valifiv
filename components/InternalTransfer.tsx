import React, { useState, useMemo } from 'react';
import type { Portfolio, Transaction } from '../types';
import { SendIcon, ClockIcon, UserIcon, CheckCircleIcon, CloseIcon } from './icons';
import { useCurrency } from './CurrencyContext';

// Mock list of valid usernames/emails on the platform
const mockValidRecipients = [
    'alice', 'bob', 'charlie', 'david', 'eve', 'frank', 'grace',
    'alice@valifi.com', 'bob@valifi.com', 'cryptoking', 'naijatrader',
    'eurohodler', 'wisechoice', 'africagateway', 'indiacrypto'
];
// Mock current user's identifiers to prevent self-transfer
const currentUserIdentifiers = ['demo user', 'demo@valifi.com'];

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-slate-900/50 backdrop-blur-lg border border-slate-300/10 rounded-2xl shadow-2xl shadow-black/20 ${className}`}>
        {children}
    </div>
);

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button onClick={onClick} className={`px-6 py-3 text-md font-semibold rounded-t-lg transition-colors border-b-2 ${isActive ? 'text-sky-400 border-sky-400' : 'text-slate-400 border-transparent hover:text-white hover:border-slate-600'}`}>
        {label}
    </button>
);


interface InternalTransferProps {
    portfolio: Portfolio;
    onInternalTransfer: (recipient: string, amount: number, note: string) => void;
}

const InternalTransfer: React.FC<InternalTransferProps> = ({ portfolio, onInternalTransfer }) => {
    const [activeTab, setActiveTab] = useState('send');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');
    const [isConfirmationOpen, setConfirmationOpen] = useState(false);
    const [lastTransfer, setLastTransfer] = useState<{ recipient: string; amount: number; note: string } | null>(null);
    const { formatCurrency } = useCurrency();
    const inputClass = "w-full bg-slate-800/70 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors";

    const cashAsset = portfolio.assets.find(a => a.ticker === 'USD');
    const cashBalance = cashAsset ? cashAsset.balance : 0;
    
    const internalTransferHistory = useMemo(() => {
        return portfolio.transactions
            .filter(tx => tx.type === 'Sent')
            .map(tx => {
                const parts = tx.description.replace('Transfer to ', '').split(' - Note: ');
                return {
                    ...tx,
                    recipient: parts[0],
                    note: parts[1] || 'N/A'
                };
            });
    }, [portfolio.transactions]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numericAmount = parseFloat(amount);
        const recipientTrimmed = recipient.trim();

        if (!recipientTrimmed) {
            setError('Recipient is required.');
            return;
        }
        if (currentUserIdentifiers.includes(recipientTrimmed.toLowerCase())) {
            setError('You cannot send funds to yourself.');
            return;
        }
        if (!mockValidRecipients.includes(recipientTrimmed.toLowerCase())) {
            setError(`User "${recipientTrimmed}" not found. Please check the username or email.`);
            return;
        }
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Please enter a valid positive amount.');
            return;
        }
        if (numericAmount > cashBalance) {
            setError('Insufficient balance for this transfer.');
            return;
        }

        const transferNote = note.trim();
        onInternalTransfer(recipientTrimmed, numericAmount, transferNote);
        setLastTransfer({ recipient: recipientTrimmed, amount: numericAmount, note: transferNote });
        setConfirmationOpen(true);
        
        setRecipient('');
        setAmount('');
        setNote('');
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 view-container">
            <div className="flex items-center gap-4">
                <div className="bg-sky-500/10 p-3 rounded-full border border-sky-500/20">
                    <SendIcon className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Internal Transfer</h1>
                    <p className="text-slate-400 mt-1">Send funds instantly and for free to other Valifi users.</p>
                </div>
            </div>

            <Card className="max-w-4xl mx-auto">
                <div className="border-b border-slate-300/10 px-4">
                    <TabButton label="Send" isActive={activeTab === 'send'} onClick={() => setActiveTab('send')} />
                    <TabButton label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                </div>

                {activeTab === 'send' && (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div>
                            <label htmlFor="recipient" className="block text-sm font-medium text-slate-300 mb-1.5">Recipient</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
                                <input type="text" id="recipient" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Enter username or email" className={`${inputClass} pl-11`} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between items-baseline">
                                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1.5">Amount (USD)</label>
                                <span className="text-sm text-slate-400">Available: <span className="blur-balance">{formatCurrency(cashBalance)}</span></span>
                            </div>
                            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className={inputClass} step="0.01" min="0" />
                        </div>
                        <div>
                            <label htmlFor="note" className="block text-sm font-medium text-slate-300 mb-1.5">Note (Optional)</label>
                            <textarea id="note" value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="For dinner, concert tickets, etc." className={inputClass} />
                        </div>
                        {error && <p className="text-sm text-red-400 bg-red-900/30 p-3 rounded-md border border-red-500/30">{error}</p>}
                        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors text-lg disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 disabled:shadow-none" disabled={!recipient || !amount}>
                            <SendIcon className="w-5 h-5" />
                            <span>Send Funds</span>
                        </button>
                    </form>
                )}

                {activeTab === 'history' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-900/40">
                                <tr>
                                    {['Date', 'Recipient', 'Note', 'Amount', 'Status'].map(h => <th key={h} className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">{h}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-300/10">
                                {internalTransferHistory.map(tx => (
                                    <tr key={tx.id} className="hover:bg-slate-800/40">
                                        <td className="p-4 text-slate-300">{new Date(tx.date).toLocaleDateString()}</td>
                                        <td className="p-4 text-white font-semibold">{tx.recipient}</td>
                                        <td className="p-4 text-slate-400 italic max-w-xs truncate">{tx.note}</td>
                                        <td className="p-4 text-red-400 font-semibold font-mono"><span className="blur-balance">{formatCurrency(tx.amountUSD)}</span></td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400">{tx.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {internalTransferHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-slate-400">No internal transfer history.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {isConfirmationOpen && lastTransfer && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4 motion-safe:animate-slide-in-fade" onClick={() => setConfirmationOpen(false)}>
                    <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-500/10 w-full max-w-md m-4 text-white p-8 text-center" onClick={e => e.stopPropagation()}>
                        <CheckCircleIcon className="w-20 h-20 text-emerald-400 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold text-white">Transfer Successful!</h2>
                        <p className="mt-4 text-lg text-slate-300">
                            You have sent <span className="font-bold text-white blur-balance">{formatCurrency(lastTransfer.amount)}</span> to <span className="font-bold text-white">{lastTransfer.recipient}</span>.
                        </p>
                        {lastTransfer.note && <p className="mt-2 text-slate-400 italic">Note: "{lastTransfer.note}"</p>}
                        <button onClick={() => setConfirmationOpen(false)} className="mt-8 w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternalTransfer;