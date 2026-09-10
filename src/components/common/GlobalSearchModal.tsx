import React, { useState, useEffect, useRef } from 'react';
import { Search, User, FileText, Pill, Activity, ArrowRight, X, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import type { Patient, Prescription, Medication, Treatment } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPatient: (patientId: string) => void;
  onSelectPrescription: (prescriptionId: string) => void;
  onSelectMedication: (medicationId: string) => void;
  onSelectTreatment: (patientId: string) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectPatient,
  onSelectPrescription,
  onSelectMedication,
  onSelectTreatment
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    patients: Patient[];
    prescriptions: Prescription[];
    medications: Medication[];
    treatments: Treatment[];
  }>({ patients: [], prescriptions: [], medications: [], treatments: [] });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ patients: [], prescriptions: [], medications: [], treatments: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ patients: [], prescriptions: [], medications: [], treatments: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const hasResults =
    results.patients.length > 0 ||
    results.prescriptions.length > 0 ||
    results.medications.length > 0 ||
    results.treatments.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden transition-all transform animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-100 flex items-center px-4 py-3.5 bg-slate-50/50">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search patients, prescriptions, medications, diagnosis, or treatments..."
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-hidden text-sm sm:text-base font-medium"
          />
          {loading && <Loader2 className="w-4 h-4 text-sky-600 animate-spin mr-2 shrink-0" />}
          {query && !loading && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-slate-100">
          {!query.trim() && (
            <div className="py-8 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-slate-600">Global Clinical Search</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Instant lookup across patients, medications in formulary, prescriptions, and active treatment regimens.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs">
                <button
                  onClick={() => setQuery('Amoxicillin')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                >
                  Try &quot;Amoxicillin&quot;
                </button>
                <button
                  onClick={() => setQuery('Hypertension')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                >
                  Try &quot;Hypertension&quot;
                </button>
                <button
                  onClick={() => setQuery('Eleanor')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                >
                  Try &quot;Eleanor&quot;
                </button>
              </div>
            </div>
          )}

          {query.trim() && !loading && !hasResults && (
            <div className="py-8 text-center text-slate-500">
              <p className="text-sm font-medium">No clinical records found for &quot;{query}&quot;</p>
              <p className="text-xs text-slate-400 mt-1">Check spelling or search by patient ID, generic drug name, or diagnosis.</p>
            </div>
          )}

          {/* Patients Section */}
          {results.patients.length > 0 && (
            <div className="py-2.5 first:pt-0">
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <User className="w-3.5 h-3.5 mr-1.5 text-sky-600" /> Patients ({results.patients.length})
              </div>
              <div className="space-y-1">
                {results.patients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectPatient(p.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-sky-50/80 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                          {p.firstName} {p.lastName}
                        </span>
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {p.id}
                        </span>
                        <span className="text-xs text-slate-500">DOB: {p.dob}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{p.diagnosis}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 shrink-0 transform group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prescriptions Section */}
          {results.prescriptions.length > 0 && (
            <div className="py-2.5">
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-teal-600" /> Prescriptions ({results.prescriptions.length})
              </div>
              <div className="space-y-1">
                {results.prescriptions.map(rx => (
                  <button
                    key={rx.id}
                    onClick={() => {
                      onSelectPrescription(rx.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-teal-50/80 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 font-mono">
                          {rx.prescriptionNumber}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">{rx.patientName}</span>
                        <span className="text-[11px] text-slate-400">{rx.date}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {rx.items.map(i => `${i.medicationName} ${i.strength}`).join(', ')}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 shrink-0 transform group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Medications Section */}
          {results.medications.length > 0 && (
            <div className="py-2.5">
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <Pill className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Formulary Medications ({results.medications.length})
              </div>
              <div className="space-y-1">
                {results.medications.map(med => (
                  <button
                    key={med.id}
                    onClick={() => {
                      onSelectMedication(med.id);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-indigo-50/80 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
                          {med.genericName}
                        </span>
                        <span className="text-xs font-medium text-slate-600">{med.strength}</span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {med.dosageForm}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {med.brandName ? `Brand: ${med.brandName} • ` : ''}Category: {med.category}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 shrink-0 transform group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Treatments Section */}
          {results.treatments.length > 0 && (
            <div className="py-2.5">
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-2">
                <Activity className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Active Regimens ({results.treatments.length})
              </div>
              <div className="space-y-1">
                {results.treatments.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTreatment(t.patientId);
                      onClose();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50/80 flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700">
                          {t.medicationName}
                        </span>
                        <span className="text-xs text-slate-600">for {t.patientName}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 font-medium rounded-full ${
                          t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.dose} • {t.frequency} • {t.adherencePercentage}% adherence
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 shrink-0 transform group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold">ESC</kbd> to close</span>
            <span>Use <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-semibold">K</kbd> anywhere</span>
          </div>
          <span className="text-slate-400">OrdoCare Search</span>
        </div>
      </div>
    </div>
  );
}
