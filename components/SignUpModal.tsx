import React, { useState } from 'react';
import { ValifiLogo, CloseIcon } from './icons';

interface SignUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignUp: (fullName: string, username: string, email: string, password: string) => Promise<{ success: boolean, message?: string }>;
    onOpenSignIn: () => void;
}

const SignUpModal: React.FC<SignUpModalProps> = ({ isOpen, onClose, onSignUp, onOpenSignIn }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError('');
        setIsLoading(true);
        const result = await onSignUp(fullName, username, email, password);
        setIsLoading(false);
        if (!result.success) {
            setError(result.message || 'An unknown error occurred during registration.');
        }
        // On success, parent component handles the state change and modal closure.
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
                        <h2 className="text-2xl font-bold">Create your Account</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-700/80" aria-label="Close">
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                        <input id="fullName" name="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white" />
                    </div>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                        <input id="username" name="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white" />
                    </div>
                    <div>
                        <label htmlFor="signup-email" className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                        <input id="signup-email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white" />
                    </div>
                    <div>
                        <label htmlFor="signup-password"className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                        <input id="signup-password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white" />
                    </div>
                    <div>
                        <label htmlFor="confirm-password"className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                        <input id="confirm-password" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-4 text-white" />
                    </div>
                    
                    {error && <div className="bg-red-900/50 border border-red-500/50 text-red-300 text-sm p-3 rounded-lg text-center">{error}</div>}

                    <div className="pt-2">
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 rounded-lg font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700">
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </div>
                </form>
                 <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{' '}
                    <button onClick={() => { onClose(); onOpenSignIn(); }} className="font-semibold leading-6 text-sky-400 hover:text-sky-300">
                        Sign In
                    </button>
                </p>
            </div>
        </div>
    );
};

export default SignUpModal;
