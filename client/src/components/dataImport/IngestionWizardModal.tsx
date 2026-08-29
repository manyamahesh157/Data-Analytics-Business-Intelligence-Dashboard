import React, { useState } from 'react';
import { X, Upload, Database, Globe, Sheet, ArrowRight, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { DataSource } from '../../types';

interface IngestionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (formData: FormData) => Promise<any>;
  onConnectorSync: (body: any) => Promise<any>;
}

export const IngestionWizardModal: React.FC<IngestionWizardModalProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onConnectorSync,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [sourceType, setSourceType] = useState<DataSource['type']>('csv');
  const [datasetName, setDatasetName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [restEndpoint, setRestEndpoint] = useState('https://api.stripe.com/v1/charges');
  const [dbHost, setDbHost] = useState('db.production.internal');
  const [dbName, setDbName] = useState('analytics_db');
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit');
  const [isIngesting, setIsIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSourceSelect = (type: DataSource['type']) => {
    setSourceType(type);
    setStep(2);
  };

  const handleRunEtl = async () => {
    setIsIngesting(true);
    setErrorMsg('');
    setProgress(20);

    try {
      const progressTimer = setInterval(() => {
        setProgress((p) => (p < 90 ? p + 20 : p));
      }, 300);

      if (sourceType === 'csv' || sourceType === 'excel') {
        if (!file) throw new Error('Please select a valid CSV or Excel file');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('datasetName', datasetName || file.name.split('.')[0]);
        formData.append('sourceType', sourceType);
        await onUploadFile(formData);
      } else {
        await onConnectorSync({
          sourceType,
          datasetName: datasetName || `${sourceType.toUpperCase()} Ingestion Sync`,
          restConfig: sourceType === 'rest_api' ? { endpoint: restEndpoint } : undefined,
          googleSheetsConfig: sourceType === 'google_sheets' ? { sheetUrl } : undefined,
        });
      }

      clearInterval(progressTimer);
      setProgress(100);
      setTimeout(() => {
        setIsIngesting(false);
        setStep(4);
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ingestion failed');
      setIsIngesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Step Indicator */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Multi-Source Data Ingestion & ETL Studio</h2>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className={`px-2 py-0.5 rounded font-mono ${step === 1 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>1. Source</span>
              <span className="text-slate-600">→</span>
              <span className={`px-2 py-0.5 rounded font-mono ${step === 2 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>2. Config</span>
              <span className="text-slate-600">→</span>
              <span className={`px-2 py-0.5 rounded font-mono ${step === 3 ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>3. ETL Pipeline</span>
              <span className="text-slate-600">→</span>
              <span className={`px-2 py-0.5 rounded font-mono ${step === 4 ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>4. Complete</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Select the external data origin for automated ETL extraction and type inference:</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'csv', label: 'CSV File Upload', desc: 'Flat delimiter files (.csv)', icon: Upload },
                  { type: 'excel', label: 'Excel Spreadsheet', desc: 'Workbooks (.xlsx, .xls)', icon: FileSpreadsheet },
                  { type: 'postgres', label: 'PostgreSQL Database', desc: 'Direct warehouse query connector', icon: Database },
                  { type: 'rest_api', label: 'REST API Endpoint', desc: 'JSON web service polling', icon: Globe },
                  { type: 'google_sheets', label: 'Google Sheets', desc: 'Live cloud spreadsheet sync', icon: Sheet },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      key={s.type}
                      onClick={() => handleSourceSelect(s.type as any)}
                      className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 hover:border-blue-500/50 transition-all text-left flex items-start gap-3 group"
                    >
                      <div className="p-2.5 rounded-lg bg-blue-600/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-slate-200">{s.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{s.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Dataset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 Sales & Revenue Metrics"
                  value={datasetName}
                  onChange={(e) => setDatasetName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {(sourceType === 'csv' || sourceType === 'excel') && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Choose File</label>
                  <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-blue-500/50 bg-slate-950/40">
                    <input
                      type="file"
                      accept={sourceType === 'csv' ? '.csv' : '.xlsx,.xls'}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setFile(f);
                          if (!datasetName) setDatasetName(f.name.split('.')[0]);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-8 h-8 text-blue-400 mb-2" />
                      <span className="text-sm font-medium text-slate-200">
                        {file ? file.name : `Click to browse or drop ${sourceType.toUpperCase()} file`}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">Supports up to 50MB</span>
                    </label>
                  </div>
                </div>
              )}

              {sourceType === 'rest_api' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">API Endpoint URL</label>
                  <input
                    type="url"
                    value={restEndpoint}
                    onChange={(e) => setRestEndpoint(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {sourceType === 'google_sheets' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Google Sheet URL</label>
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300">
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center gap-1"
                >
                  Configure ETL Pipeline <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-xs text-slate-300 uppercase tracking-wider">Automated ETL Pipeline Phases</div>
                <div className="grid grid-cols-4 gap-2 text-xs pt-2">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-blue-400 font-bold block mb-1">1. EXTRACT</span>
                    <span className="text-[11px] text-slate-400">Stream raw chunks</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-blue-400 font-bold block mb-1">2. VALIDATE</span>
                    <span className="text-[11px] text-slate-400">Infer types & nulls</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-blue-400 font-bold block mb-1">3. TRANSFORM</span>
                    <span className="text-[11px] text-slate-400">Coerce & normalize</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-center">
                    <span className="text-blue-400 font-bold block mb-1">4. LOAD</span>
                    <span className="text-[11px] text-slate-400">Store dataset</span>
                  </div>
                </div>
              </div>

              {isIngesting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Executing ETL pipeline...</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              <div className="pt-4 flex justify-between">
                <button disabled={isIngesting} onClick={() => setStep(2)} className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300">
                  Back
                </button>
                <button
                  disabled={isIngesting}
                  onClick={handleRunEtl}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 flex items-center gap-2"
                >
                  {isIngesting ? 'Running Pipeline...' : 'Start ETL Ingestion'}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-100">ETL Ingestion Completed Successfully!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Dataset <span className="text-blue-400 font-semibold">{datasetName}</span> is now fully indexed and ready for dashboard widgets and KPI monitoring.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20"
              >
                Close & View Dataset
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
