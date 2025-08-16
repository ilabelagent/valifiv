import React, { useState, useMemo, useEffect } from 'react';
import type { Portfolio, KYCStatus, LoanApplication, Asset, LoanStatus } from '../types';
import { AssetType } from '../types';
import { LoanIcon, LockIcon, UsdIcon, CheckCircleIcon, UploadCloudIcon, XCircleIcon, ClockIcon } from './icons';
import { useCurrency } from './CurrencyContext';

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

interface LoansViewProps {
    portfolio: Portfolio;
    kycStatus: KYCStatus;
    loanApplications: LoanApplication[];
    onApplyForLoan: (application: Omit<LoanApplication, 'id' | 'date' | 'status'>) => void;
    onLoanRepayment: (loanId: string, paymentAmount: number) => void;
}

const FileInput: React.FC<{
    label: string;
    file: File | null;
    setFile: (file: File | null) => void;
    acceptedFormats: string;
}> = ({ label, file, setFile, acceptedFormats }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
    };

    return (
        <div className="mt-4">
            <label className="block text-sm font-medium text-slate-400 mb-2">{label} <span className="text-red-400">*</span></label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-600 px-6 py-10 bg-slate-800/40 hover:border-sky-500/50 transition-colors">
                <div className="text-center">
                    {file ? (
                        <p className="text-emerald-400">{file.name}</p>
                    ) : (
                        <UploadCloudIcon className="mx-auto h-12 w-12 text-slate-500" aria-hidden="true" />
                    )}
                    <div className="mt-4 flex text-sm leading-6 text-slate-400">
                        <label
                            htmlFor="contact-file-upload"
                            className="relative cursor-pointer rounded-md bg-transparent font-semibold text-sky-400 focus-within:outline-none hover:text-sky-300"
                        >
                            <span>Upload a file</span>
                            <input id="contact-file-upload" name="contact-file-upload" type="file" className="sr-only" onChange={handleFileChange} accept={acceptedFormats} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const LoanStatusChip: React.FC<{ status: LoanStatus }> = ({ status }) => {
    const config = {
        Active: { text: 'Active', color: 'bg-sky-500/10 text-sky-400' },
        Late: { text: 'Late', color: 'bg-amber-500/10 text-amber-400' },
        Repaid: { text: 'Repaid', Icon: CheckCircleIcon, color: 'bg-emerald-500/10 text-emerald-400' },
        Defaulted: { text: 'Defaulted', Icon: XCircleIcon, color: 'bg-red-500/10 text-red-400' },
        Rejected: { text: 'Rejected', Icon: XCircleIcon, color: 'bg-red-500/10 text-red-400' },
        Pending: { text: 'Pending', Icon: ClockIcon, color: 'bg-slate-500/10 text-slate-400 animate-pulse' },
    }[status];

    if (!config) return null;

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${config.color}`}>
            {config.Icon && <config.Icon className="w-3.5 h-3.5" />}
            <span>{config.text}</span>
        </div>
    );
};


const LoansView: React.FC<LoansViewProps> = ({ portfolio, kycStatus, loanApplications, onApplyForLoan, onLoanRepayment }) => {
    const [activeTab, setActiveTab] = useState('apply');
    const [showApplicationForm, setShowApplicationForm] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const { formatCurrency } = useCurrency();

    // Form State
    const [loanAmount, setLoanAmount] = useState('');
    const [repaymentTerm, setRepaymentTerm] = useState('60');
    const [collateralAssetId, setCollateralAssetId] = useState('');
    const [reason, setReason] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [contactAccess, setContactAccess] = useState(false);
    const [contactsFile, setContactsFile] = useState<File | null>(null);
    const [formError, setFormError] = useState('');
    
    const hasActiveInvestments = useMemo(() => portfolio.assets.some(a => a.type !== AssetType.CASH && a.status === 'Active'), [portfolio.assets]);
    const isEligible = kycStatus === 'Approved' && hasActiveInvestments && portfolio.totalValueUSD >= 100000;
    const hasPendingApplication = useMemo(() => loanApplications.some(app => app.status === 'Pending'), [loanApplications]);
    const collateralOptions = useMemo(() => portfolio.assets.filter(a => a.status === 'Active' && a.type !== AssetType.CASH), [portfolio.assets]);
    const maxLoanAmount = useMemo(() => Math.min(1000000, portfolio.totalValueUSD * 0.5), [portfolio.totalValueUSD]);
    
    const activeLoans = useMemo(() => loanApplications.filter(l => l.status === 'Active' || l.status === 'Late'), [loanApplications]);
    const loanHistory = useMemo(() => loanApplications.filter(l => ['Repaid', 'Defaulted', 'Rejected'].includes(l.status)), [loanApplications]);


    useEffect(() => {
        if (collateralOptions.length > 0) {
            setCollateralAssetId(collateralOptions[0].id);
        }
    }, [collateralOptions]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        const amount = parseFloat(loanAmount);

        if (isNaN(amount) || amount < 50000 || amount > 1000000) {
            setFormError('Loan amount must be between $50,000 and $1,000,000.');
            return;
        }
        if (amount > maxLoanAmount) {
            setFormError(`Requested amount exceeds the maximum allowed of $${maxLoanAmount.toLocaleString()}.`);
            return;
        }
        if (!collateralAssetId) {
            setFormError('Please select an asset for collateral.');
            return;
        }
        if (!agreeToTerms) {
            setFormError('You must agree to the terms and policies.');
            return;
        }
        if (contactAccess && !contactsFile) {
            setFormError('Please upload your contacts file as you have authorized access.');
            return;
        }

        if (contactAccess && contactsFile) {
            console.log('--- ADMIN-ONLY ACTION ---');
            console.log('Uploading contact file to secure storage with loan application metadata:', contactsFile.name);
            console.log('-------------------------');
        }
        
        onApplyForLoan({
            amount,
            term: parseInt(repaymentTerm),
            interestRate: 5,
            collateralAssetId,
            reason,
        });

        setSubmissionSuccess(true);
        setShowApplicationForm(false);
        setContactAccess(false);
        setContactsFile(null);
    };

    const renderApplyContent = () => {
        if (!isEligible) {
            return (
                <Card className="p-8 text-center">
                    <LockIcon className="w-16 h-16 text-sky-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">Premium Financing is Locked</h2>
                    <p className="mt-2 max-w-lg mx-auto text-slate-400">You must have a fully KYC-verified account and an active Valifi investment portfolio of $100,000+ to qualify for premium financing.</p>
                </Card>
            );
        }
        if (hasPendingApplication || submissionSuccess) {
             return (
                <Card className="p-8 text-center">
                    <CheckCircleIcon className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white">Application Pending</h2>
                    <p className="mt-2 max-w-lg mx-auto text-slate-400">Your loan application has been submitted and is currently under review by our team. You will be notified of the decision shortly.</p>
                </Card>
            );
        }

        if (showApplicationForm) {
            const inputClass = "w-full bg-slate-800/70 border border-slate-700 rounded-lg py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500";
            return (
                <Card className="p-8">
                     <h2 className="text-2xl font-bold text-white mb-6">Loan Application Form</h2>
                     <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5">Loan Amount (USD)</label>
                            <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} min="50000" max={maxLoanAmount} className={inputClass}/>
                            <p className="text-xs text-slate-500 mt-1">Max available: ${maxLoanAmount.toLocaleString()}</p>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                               <label className="block text-sm text-slate-300 mb-1.5">Repayment Term</label>
                               <select value={repaymentTerm} onChange={e => setRepaymentTerm(e.target.value)} className={inputClass}>
                                   <option value="60">60 Days</option><option value="90">90 Days</option>
                                   <option value="180">180 Days</option><option value="365">365 Days</option>
                               </select>
                            </div>
                            <div>
                               <label className="block text-sm text-slate-300 mb-1.5">Collateral Asset</label>
                               <select value={collateralAssetId} onChange={e => setCollateralAssetId(e.target.value)} className={inputClass}>
                                   {collateralOptions.map(asset => <option key={asset.id} value={asset.id}>{asset.name} (${asset.valueUSD.toLocaleString()})</option>)}
                               </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300 mb-1.5">Reason for Loan (Optional)</label>
                            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className={inputClass}/>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={agreeToTerms} onChange={e => setAgreeToTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-700 text-sky-600 focus:ring-sky-500"/>
                                <span className="text-sm text-slate-400">I agree to the 5% interest, repayment schedule, and collateral policy.</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input type="checkbox" checked={contactAccess} onChange={e => setContactAccess(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-700 text-sky-600 focus:ring-sky-500"/>
                                <span className="text-sm text-slate-400">I authorize Valifi to access my contact list if I default.</span>
                            </label>
                            {contactAccess && (
                                <div className="motion-safe:animate-slide-in-fade pl-9">
                                    <FileInput
                                        label="Upload Contact File (.vcf, .csv, or .txt)"
                                        file={contactsFile}
                                        setFile={setContactsFile}
                                        acceptedFormats=".vcf,.csv,.txt"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        We recommend exporting from your phone contacts or address book to .csv format. Only used for recovery enforcement if default occurs.
                                    </p>
                                </div>
                            )}
                        </div>
                        {formError && <p className="text-sm text-red-400 text-center">{formError}</p>}
                        <div className="flex justify-end gap-4 pt-4 border-t border-slate-700">
                             <button type="button" onClick={() => setShowApplicationForm(false)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2.5 px-6 rounded-lg">Back</button>
                             <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 px-6 rounded-lg">💸 Submit Application</button>
                        </div>
                     </form>
                </Card>
            );
        }

        return (
             <Card className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                        <h2 className="text-2xl font-bold text-white">Premium Loan Terms</h2>
                        <ul className="mt-6 space-y-4">
                            {[
                                { label: 'Loan Range', value: '$50,000 – $1,000,000' },
                                { label: 'Interest Rate', value: '5% flat' },
                                { label: 'Repayment Terms', value: '60 to 365 days' },
                                { label: 'Overdue Penalty', value: '1.5% per missed period' },
                                { label: 'Disbursement', value: 'To Main Account Balance' }
                            ].map(item => (
                                <li key={item.label} className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                                    <span className="text-slate-400">{item.label}</span>
                                    <span className="font-semibold text-white">{item.value}</span>
                                </li>
                            ))}
                        </ul>
                     </div>
                      <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-700">
                        <h3 className="font-bold text-sky-300 text-lg">🏆 Instant Trust. Premium Funding.</h3>
                        <p className="mt-4 text-sm text-slate-300 space-y-3">
                            <span>This is a no-guarantor loan backed only by your trust and investment performance.</span>
                            <span>Valifi believes in your portfolio strength — no co-signer, no long wait.</span>
                            <span>Borrow up to $1,000,000 against your active investments and repay flexibly. Zero hassle. ✅</span>
                        </p>
                    </div>
                 </div>
                 <div className="mt-8 text-center">
                    <button onClick={() => setShowApplicationForm(true)} className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 px-8 rounded-lg text-lg">
                        Proceed to Apply
                    </button>
                 </div>
             </Card>
        );
    };
    
    const renderActiveLoans = () => (
        <div className="space-y-6">
            {activeLoans.length > 0 ? activeLoans.map(loan => {
                const totalToRepay = loan.amount * (1 + (loan.interestRate / 100));
                const numPayments = Math.max(1, loan.term / 30);
                const nextPayment = totalToRepay / numPayments;
                const collateral = portfolio.assets.find(a => a.id === loan.collateralAssetId);

                return (
                    <Card key={loan.id} className="p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">Loan #{loan.id.slice(-6)}</h3>
                                <p className="text-slate-400 text-sm">Collateral: {collateral?.name || 'N/A'}</p>
                            </div>
                            <LoanStatusChip status={loan.status} />
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-300">Repayment Progress</span>
                                <span className="font-semibold text-white">{formatCurrency(((loan.repaymentProgress || 0) / 100) * totalToRepay)} / {formatCurrency(totalToRepay)}</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${loan.repaymentProgress || 0}%` }}></div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700 flex flex-wrap justify-between items-center gap-4">
                            <div className="text-sm">
                                <p className="text-slate-400">Next Payment Due:</p>
                                <p className="font-semibold text-white">{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <button 
                                onClick={() => onLoanRepayment(loan.id, nextPayment)} 
                                className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-md shadow-sky-500/20"
                                disabled={loan.repaymentProgress === 100}
                            >
                                Pay {formatCurrency(nextPayment)}
                            </button>
                        </div>
                    </Card>
                )
            }) : <div className="text-center py-16 text-slate-400">You have no active loans.</div>}
        </div>
    );
    
    const renderRepaymentSchedule = () => {
        const scheduleItems: any[] = [];
        activeLoans.forEach(loan => {
            const totalToRepay = loan.amount * (1 + (loan.interestRate / 100));
            const numPayments = Math.max(1, loan.term / 30);
            const paymentAmount = totalToRepay / numPayments;
            const paymentsDone = Math.floor((loan.repaymentProgress || 0) / (100 / numPayments));

            for (let i = 1; i <= numPayments; i++) {
                const dueDate = new Date(loan.startDate!);
                dueDate.setMonth(dueDate.getMonth() + i);
                scheduleItems.push({
                    id: `${loan.id}-${i}`,
                    dueDate,
                    loanId: loan.id,
                    amountDue: paymentAmount,
                    status: i <= paymentsDone ? 'Paid' : 'Upcoming'
                });
            }
        });
        
        scheduleItems.sort((a,b) => a.dueDate.getTime() - b.dueDate.getTime());

        return (
            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/40">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Due Date</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Loan ID</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-right">Amount Due</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {scheduleItems.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-16 text-slate-400">No upcoming payments.</td></tr>
                            ) : (
                                scheduleItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-800/40">
                                        <td className="p-4 text-slate-300">{item.dueDate.toLocaleDateString()}</td>
                                        <td className="p-4 text-white">#{item.loanId.slice(-6)}</td>
                                        <td className="p-4 text-white font-mono text-right">{formatCurrency(item.amountDue)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        );
    };
    
    const renderLoanHistory = () => (
        <Card className="overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-900/40">
                         <tr>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Date Closed</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Term</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase text-center">Status</th>
                            <th className="p-4 text-xs font-semibold text-slate-400 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                         {loanHistory.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-16 text-slate-400">No loan history.</td></tr>
                        ) : (
                            loanHistory.sort((a,b) => new Date(b.dateClosed || b.date).getTime() - new Date(a.dateClosed || a.date).getTime()).map(loan => (
                                 <tr key={loan.id} className="hover:bg-slate-800/40">
                                    <td className="p-4 text-slate-300">{loan.dateClosed ? new Date(loan.dateClosed).toLocaleDateString() : new Date(loan.date).toLocaleDateString()}</td>
                                    <td className="p-4 text-white font-mono">{formatCurrency(loan.amount)}</td>
                                    <td className="p-4 text-white">{loan.term} days</td>
                                    <td className="p-4 text-center"><LoanStatusChip status={loan.status} /></td>
                                    <td className="p-4 text-sm text-slate-400">
                                        {loan.status === 'Repaid' && `Paid ${formatCurrency(loan.finalAmountRepaid || 0)}`}
                                        {loan.status === 'Rejected' && loan.rejectionReason}
                                        {loan.status === 'Defaulted' && `Repaid ${formatCurrency(loan.finalAmountRepaid || 0)}`}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
    );

    return (
        <div className="p-6 lg:p-8 space-y-8 view-container">
            <div className="flex items-center gap-4">
                <div className="bg-sky-500/10 p-3 rounded-full border border-sky-500/20">
                    <LoanIcon className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Loan Center</h1>
                    <p className="text-slate-400 mt-1">Access premium financing based on your portfolio's strength.</p>
                </div>
            </div>

            <Card className="max-w-6xl mx-auto">
                <div className="border-b border-slate-300/10 px-4">
                    <TabButton label="Apply for Loan" isActive={activeTab === 'apply'} onClick={() => setActiveTab('apply')} />
                    <TabButton label="Active Loans" isActive={activeTab === 'active'} onClick={() => setActiveTab('active')} />
                    <TabButton label="Repayment Schedule" isActive={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} />
                    <TabButton label="Loan History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                </div>

                <div className="p-6">
                    {activeTab === 'apply' && renderApplyContent()}
                    {activeTab === 'active' && renderActiveLoans()}
                    {activeTab === 'schedule' && renderRepaymentSchedule()}
                    {activeTab === 'history' && renderLoanHistory()}
                </div>
            </Card>
        </div>
    );
};

export default LoansView;