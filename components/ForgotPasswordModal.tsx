import React, { useState } from 'react';
import { ValifiLogo, CloseIcon, CheckCircleIcon } from './icons';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenSignIn: () => void;
}

const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose, onOpenSignIn }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!isOpen) return null;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Mock API call
        try {
            const response = await fetch('/api/auth/forgot-password', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error("Something went wrong.");
            }

            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex justify-center items-center z-50 p-4 motion-safe:animate-slide-in-fade"
            onClick={onClose}
        >
            <div 
                className="bg-slate-900/70 backdrop-blur-xl border border-slate-300/10 rounded-2xl shadow-2xl w-full max-w-md m-4 text-white p-8"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <ValifiLogo className="w-10 h-10 text-sky-400" />
                        <h2 className="text-2xl font-bold">Reset Password</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700/80" aria-label="Close">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>
                
                {isSubmitted ? (
                    <div className="text-center space-y-4">
                        <CheckCircleIcon className="w-16 h-16 text-emerald-400 mx-auto" />
                        <h3 className="text-xl font-bold">Check Your Email</h3>
                        <p className="text-slate-300">If an account with that email address exists, we have sent instructions to reset your password.</p>
                        <button onClick={onClose} className="w-full py-3 rounded-lg font-bold text-white bg-sky-600 hover:bg-sky-500">
                           Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <p className="text-sm text-slate-300">Enter your email address and we will send you a link to reset your password.</p>
                        <div>
                            <label htmlFor="reset-email" className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                            <input id="reset-email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-white" />
                        </div>
                        
                        {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg text-center">{error}</div>}

                        <div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 rounded-lg font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700">
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </div>
                    </form>
                )}
                 <p className="mt-8 text-center text-sm text-slate-400">
                    Remembered your password?{' '}
                    <button type="button" onClick={() => { onClose(); onOpenSignIn(); }} className="font-semibold leading-6 text-sky-400 hover:text-sky-300">
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordModal;
