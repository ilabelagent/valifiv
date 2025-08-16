import React, { useState, useMemo } from 'react';
import type { Transaction, TaxDocument } from '../types';
import { DownloadIcon, SparklesIcon, TaxIcon, IrisIcon } from './icons';
import { useCurrency } from './CurrencyContext';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-slate-900/50 backdrop-blur-lg border border-slate-300/10 rounded-2xl shadow-2xl shadow-black/20 ${className}`}>
      {children}
    </div>
);

const StatCard: React.FC<{ title: string; value: string; isPositive?: boolean }> = ({ title, value, isPositive }) => (
    <Card className="p-6">
        <p className="text-sm text-slate-400">{title}</p>
        <p className={`text-3xl font-bold mt-1 tracking-tight ${isPositive === undefined ? 'text-white' : isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            <span className="blur-balance">{value}</span>
        </p>
    </Card>
);

const mockTaxDocs: TaxDocument[] = [
    { id: 'doc1', year: 2024, name: 'Form 8949', description: 'Sales and Other Dispositions of Capital Assets' },
    { id: 'doc2', year: 2024, name: 'Transaction History', description: 'Complete record of all trades and transfers' },
    { id: 'doc3', year: 2024, name: 'Gains & Losses', description: 'Detailed report on capital gains and losses' },
];

interface TaxViewProps {
    transactions: Transaction[];
    api: (prompt: string) => Promise<{ text: string }>;
}

const TaxView: React.FC<TaxViewProps> = ({ transactions, api }) => {
    const [aiQuestion, setAiQuestion] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { formatCurrency } = useCurrency();

    const taxSummary = useMemo(() => {
        const trades = transactions.filter(tx => tx.type === 'Trade');
        const gains = trades.filter(tx => tx.amountUSD > 0).reduce((sum, tx) => sum + tx.amountUSD, 0);
        const losses = trades.filter(tx => tx.amountUSD < 0).reduce((sum, tx) => sum + tx.amountUSD, 0);
        return {
            realizedGains: gains,
            realizedLosses: losses,
            netResult: gains + losses,
        };
    }, [transactions]);
    
    const handleAskAI = async () => {
        if (!aiQuestion.trim()) return;
        setIsLoading(true);
        setAiResponse('');

        const transactionSummary = transactions
            .map(tx => `- ${tx.date}: ${tx.description}, Amount: $${tx.amountUSD.toFixed(2)}, Type: ${tx.type}`)
            .join('\n');

        const prompt = `
            As Valifi's AI Tax Advisor, please answer the following user question based on their transaction history provided below.
            Valifi is partnered with a tax service called Iris. Frame your advice in a way that suggests using a professional service like Iris is a good idea for complex situations.
            Your response should be clear, informative, and provide actionable tax guidance. Do not give financial advice, but explain tax implications and potential strategies. Use markdown for formatting.

            User Question: "${aiQuestion}"

            Transaction History Summary:
            ${transactionSummary}
        `;
        
        try {
            const result = await api(prompt);
            setAiResponse(result.text);
        } catch (error) {
            console.error("AI Tax assistant error:", error);
            setAiResponse("Sorry, I was unable to process your request at this time. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="p-6 lg:p-8 space-y-8 view-container">
            <div className="flex items-center gap-4">
                <div className="bg-sky-500/10 p-3 rounded-full border border-sky-500/20">
                    <TaxIcon className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Tax Center</h1>
                    <p className="text-slate-400 mt-1">Valifi has partnered with Iris to streamline your tax filing process.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Realized Capital Gains" value={formatCurrency(taxSummary.realizedGains)} isPositive={true} />
                <StatCard title="Realized Capital Losses" value={formatCurrency(taxSummary.realizedLosses)} isPositive={false}/>
                <StatCard title="Net Result" value={`${taxSummary.netResult >= 0 ? '+' : ''}${formatCurrency(taxSummary.netResult)}`} isPositive={taxSummary.netResult >= 0} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-3 space-y-8">
                    <Card className="p-8 bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border-indigo-700/50">
                        <div className="flex flex-col items-center text-center">
                            <IrisIcon className="w-20 h-20 mb-4" />
                            <h2 className="text-2xl font-bold text-white">File with confidence through Iris</h2>
                            <p className="text-slate-300 mt-2 max-w-md mx-auto">
                               We've partnered with Iris, a leading tax preparation service, to offer you a seamless filing experience. Directly import your Valifi transaction data and get expert assistance.
                            </p>
                            
                            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
                                <span className="bg-slate-700/50 text-indigo-300 px-3 py-1 rounded-full">Direct Data Import</span>
                                <span className="bg-slate-700/50 text-indigo-300 px-3 py-1 rounded-full">Expert CPA Review</span>
                                 <span className="bg-slate-700/50 text-indigo-300 px-3 py-1 rounded-full">Maximum Refund Guarantee</span>
                            </div>

                            <button className="mt-8 w-full max-w-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-indigo-500/20">
                                Get Started with Iris
                            </button>
                        </div>
                    </Card>

                    <Card>
                        <h3 className="text-lg font-semibold text-white p-6 border-b border-slate-300/10">Your Tax Documents</h3>
                        <ul className="divide-y divide-slate-300/10">
                            {mockTaxDocs.map(doc => (
                                <li key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors">
                                    <div>
                                        <p className="font-semibold text-white">{doc.name} ({doc.year})</p>

                                        <p className="text-sm text-slate-400">{doc.description}</p>
                                    </div>
                                    <button className="flex items-center gap-2 bg-slate-700/80 hover:bg-sky-600 text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm">
                                        <DownloadIcon className="w-4 h-4" />
                                        <span>Download</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
                
                <div className="lg:col-span-2">
                    <Card className="lg:sticky top-24">
                         <div className="flex items-center gap-3 p-6 border-b border-slate-300/10">
                            <SparklesIcon className="w-6 h-6 text-sky-400"/>
                            <h3 className="text-lg font-semibold text-white">AI Tax Assistant</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <textarea
                                value={aiQuestion}
                                onChange={(e) => setAiQuestion(e.target.value)}
                                placeholder="Ask about tax-loss harvesting, staking rewards, or other tax implications..."
                                className="w-full h-28 bg-slate-800/70 border border-slate-700 rounded-lg py-2 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                                disabled={isLoading}
                            />
                            <button 
                                onClick={handleAskAI}
                                className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Thinking...' : 'Ask AI'}
                            </button>
                        </div>
                        {(isLoading || aiResponse) && (
                            <div className="p-6 border-t border-slate-300/10">
                                 <h4 className="font-semibold text-white mb-2">AI Response:</h4>
                                 {isLoading ? (
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <span className="h-2 w-2 bg-sky-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-sky-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-sky-400 rounded-full animate-pulse"></span>
                                    </div>
                                 ) : (
                                    <div className="prose prose-sm prose-invert prose-p:text-slate-300 prose-headings:text-white max-w-none whitespace-pre-wrap bg-slate-800/70 p-4 rounded-md">
                                        {aiResponse}
                                    </div>
                                 )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default TaxView;