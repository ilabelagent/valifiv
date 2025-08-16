import React, { useState, useEffect, useCallback } from 'react';
import type { KYCStatus } from '../types';
import { UserCheckIcon, UploadCloudIcon, LockIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from './icons';
import { countries } from './countries';

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({ children, className = '' }) => (
    <div className={`bg-slate-900/50 backdrop-blur-lg border border-slate-300/10 rounded-2xl shadow-2xl shadow-black/20 ${className}`}>
      {children}
    </div>
);

interface KYCViewProps {
    status: KYCStatus;
    setStatus: (status: KYCStatus) => void;
    reason: string;
    setReason: (reason: string) => void;
}

const FileInput: React.FC<{ label: string, file: File | null, setFile: (file: File | null) => void, preview: string | null, setPreview: (preview: string | null) => void }> = 
({ label, file, setFile, preview, setPreview }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0] || null;
        setFile(selectedFile);
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        if (selectedFile && selectedFile.type.startsWith('image/')) {
            setPreview(URL.createObjectURL(selectedFile));
        } else {
            setPreview(null);
        }
    };

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    return (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">{label}</label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-slate-600 px-6 py-10 bg-slate-800/40 hover:border-sky-500/50 transition-colors">
                <div className="text-center">
                    {preview ? (
                        <img src={preview} alt="Preview" className="mx-auto h-24 w-auto rounded-md object-contain" />
                    ) : file ? (
                        <p className="text-emerald-400">{file.name}</p>
                    ) : (
                        <UploadCloudIcon className="mx-auto h-12 w-12 text-slate-500" aria-hidden="true" />
                    )}
                    <div className="mt-4 flex text-sm leading-6 text-slate-400">
                        <label
                            htmlFor={label.toLowerCase().replace(/\s/g, '-')}
                            className="relative cursor-pointer rounded-md bg-transparent font-semibold text-sky-400 focus-within:outline-none hover:text-sky-300"
                        >
                            <span>Upload a file</span>
                            <input id={label.toLowerCase().replace(/\s/g, '-')} name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/jpeg, image/png, application/pdf" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-slate-500">PNG, JPG, PDF up to 10MB</p>
                </div>
            </div>
        </div>
    );
};

const KYCForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
    const [idFile, setIdFile] = useState<File | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [idPreview, setIdPreview] = useState<string | null>(null);
    const [profilePreview, setProfilePreview] = useState<string | null>(null);
    const inputClass = "block w-full rounded-md border-0 bg-slate-800/70 py-2.5 px-3 text-white shadow-sm ring-1 ring-inset ring-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-sky-500 sm:text-sm sm:leading-6";

    return (
        <Card>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-8 p-8">
                <div className="border-b border-slate-300/10 pb-8">
                    <h2 className="text-base font-semibold leading-7 text-white">Personal Information</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">Use a permanent address where you can receive mail.</p>
                    <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                            <label htmlFor="full-name" className="block text-sm font-medium leading-6 text-slate-300">Full legal name</label>
                            <input type="text" name="full-name" id="full-name" required className={inputClass}/>
                        </div>
                         <div className="sm:col-span-3">
                            <label htmlFor="dob" className="block text-sm font-medium leading-6 text-slate-300">Date of Birth</label>
                            <input type="date" name="dob" id="dob" required className={inputClass}/>
                        </div>
                        <div className="sm:col-span-3">
                           <label htmlFor="country" className="block text-sm font-medium leading-6 text-slate-300">Country of Residence</label>
                           <select id="country" name="country" required className={inputClass}>
                                {countries.map(c => <option key={c.code}>{c.name}</option>)}
                           </select>
                        </div>
                        <div className="col-span-full">
                            <label htmlFor="street-address" className="block text-sm font-medium leading-6 text-slate-300">Residential Address (Optional)</label>
                            <input type="text" name="street-address" id="street-address" className={inputClass}/>
                        </div>
                    </div>
                </div>

                <div className="border-b border-slate-300/10 pb-8">
                     <h2 className="text-base font-semibold leading-7 text-white">Identity Verification</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">Upload a clear, high-resolution image or PDF of your identification.</p>
                     <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-6">
                         <div className="sm:col-span-3">
                            <label htmlFor="id-type" className="block text-sm font-medium leading-6 text-slate-300">National ID Type</label>
                            <select id="id-type" name="id-type" required className={inputClass}>
                                <option>Passport</option><option>Driver's License</option><option>National ID</option>
                            </select>
                         </div>
                         <div className="sm:col-span-3">
                            <label htmlFor="id-number" className="block text-sm font-medium leading-6 text-slate-300">ID Number</label>
                            <input type="text" name="id-number" id="id-number" required className={inputClass}/>
                        </div>
                        <div className="col-span-full">
                            <FileInput label="ID Document Upload" file={idFile} setFile={setIdFile} preview={idPreview} setPreview={setIdPreview} />
                        </div>
                         <div className="col-span-full">
                            <FileInput label="Live Photo (Selfie)" file={profilePhoto} setFile={setProfilePhoto} preview={profilePreview} setPreview={setProfilePreview} />
                        </div>
                     </div>
                </div>
                
                <div className="text-xs p-3 rounded-lg bg-slate-800/70 text-slate-400 flex items-start gap-2">
                    <LockIcon className="w-8 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span>Your information is securely stored and used only for compliance verification. We do not share your data with third parties.</span>
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6">
                    <button type="button" className="text-sm font-semibold leading-6 text-white hover:text-slate-300">Cancel</button>
                    <button type="submit" className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">Submit for Review</button>
                </div>
            </form>
        </Card>
    );
};

const StatusDisplay: React.FC<{ status: KYCStatus, reason: string, onResubmit: () => void }> = ({ status, reason, onResubmit }) => {
    const statusConfig = {
        Pending: { Icon: ClockIcon, color: 'amber', title: 'Submission Pending Review', message: 'Your documents have been submitted and are currently under review. This process usually takes 1-2 business days.'},
        Approved: { Icon: CheckCircleIcon, color: 'emerald', title: 'KYC Verification Approved!', message: 'Congratulations! Your identity has been successfully verified. You now have full access to all platform features.' },
        Rejected: { Icon: XCircleIcon, color: 'red', title: 'Submission Rejected', message: `Your submission could not be approved. Reason: ${reason}. Please review the feedback and resubmit your documents.` },
        'Resubmit Required': { Icon: XCircleIcon, color: 'red', title: 'Resubmission Required', message: `Your submission could not be approved. Reason: ${reason}. Please review the feedback and resubmit your documents.` },
        'Not Started': { Icon: UserCheckIcon, color: 'slate', title: '', message: '' }
    };

    const config = statusConfig[status];
    if (!config || status === 'Not Started') return null;

    const colors = {
        amber: 'bg-amber-900/50 border-amber-700/50 text-amber-300',
        emerald: 'bg-emerald-900/50 border-emerald-700/50 text-emerald-300',
        red: 'bg-red-900/50 border-red-700/50 text-red-300',
        slate: ''
    };

    return (
        <Card className={`p-8 text-center ${colors[config.color as keyof typeof colors]}`}>
            <config.Icon className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white">{config.title}</h2>
            <p className="mt-2 max-w-lg mx-auto text-slate-300">{config.message}</p>
            {(status === 'Rejected' || status === 'Resubmit Required') && (
                 <button onClick={onResubmit} className="mt-6 rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500">
                    Resubmit Information
                 </button>
            )}
        </Card>
    );
};

const KYCView: React.FC<KYCViewProps> = ({ status, setStatus, reason, setReason }) => {
    
    const [isFormVisible, setIsFormVisible] = useState(status === 'Not Started' || status === 'Resubmit Required');

    useEffect(() => {
        setIsFormVisible(status === 'Not Started' || status === 'Resubmit Required');
    }, [status]);
    
    const handleFormSubmit = () => {
        setStatus('Pending');
        setIsFormVisible(false);
    };

    const handleResubmit = () => {
        setStatus('Not Started');
        setIsFormVisible(true);
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 view-container">
            <div className="flex items-center gap-4">
                 <div className="bg-sky-500/10 p-3 rounded-full border border-sky-500/20">
                    <UserCheckIcon className="w-8 h-8 text-sky-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">KYC Verification</h1>
                    <p className="text-slate-400 mt-1">Verify your identity to unlock all platform features.</p>
                </div>
            </div>

            {isFormVisible ? (
                <KYCForm onSubmit={handleFormSubmit} />
            ) : (
                <StatusDisplay status={status} reason={reason} onResubmit={handleResubmit} />
            )}
        </div>
    );
};

export default KYCView;