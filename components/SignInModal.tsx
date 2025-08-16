import React, { useState } from 'react';
import { ValifiLogo, CloseIcon } from './icons';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (email: string, password: string) => Promise<{ success: boolean, message?: string }>;
    onOpenSignUp: () => void;
    onOpenForgotPassword: () => void;
}

const SignInModal: React.FC<SignInModalProps> = ({ isOpen, onClose, onLogin, onOpenSignUp, onOpenForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const result = await onLogin(email, password);
        setIsLoading(false);
        if (!result.success) {
            setError(result.message || 'An unknown error occurred.');
        }
        // On success, the parent component will handle closing the modal/transitioning the view.
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
                        <h2 className="text-2xl font-bold">Sign In to Valifi</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700/80" aria-label="Close">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                    <div>
                        <div className="flex items-center justify-between">
                             <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                             <div className="text-sm">
                                <button type="button" onClick={() => { onClose(); onOpenForgotPassword(); }} className="font-semibold text-sky-400 hover:text-sky-300">Forgot password?</button>
                            </div>
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 disabled:bg-slate-700 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
                 <p className="mt-8 text-center text-sm text-slate-400">
                    Not a member?{' '}
                    <button type="button" onClick={() => { onClose(); onOpenSignUp(); }} className="font-semibold leading-6 text-sky-400 hover:text-sky-300">
                        Start your journey today
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignInModal;