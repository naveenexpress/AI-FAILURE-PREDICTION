import React, { useState, useEffect } from 'react';
import {
  BarChart2,
  RefreshCw,
  Info,
  Layers,
  Sliders
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { api } from '../api/client';
import type { ModelInfo } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ModelInformationProps {
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ModelInformation: React.FC<ModelInformationProps> = ({ onToast }) => {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRetraining, setIsRetraining] = useState(false);

  // Retraining parameters
  const [nSamples, setNSamples] = useState(3000);
  const [randomSeed, setRandomSeed] = useState(42);

  const fetchModelInfo = async () => {
    try {
      const data = await api.getModelInfo();
      setModelInfo(data);
    } catch (err: any) {
      onToast(err.message || 'Failed to load model metadata.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const handleRetrain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRetraining(true);
    try {
      const res = await api.trainModel({
        n_samples: Number(nSamples),
        random_seed: Number(randomSeed),
      });
      onToast(`Model retrained successfully! Accuracy: ${(res.metrics.accuracy * 100).toFixed(1)}%`, 'success');
      fetchModelInfo();
    } catch (err: any) {
      onToast(err.message || 'Retraining failed.', 'error');
    } finally {
      setIsRetraining(false);
    }
  };

  if (loading && !modelInfo) {
    return <LoadingSpinner size="lg" message="Loading model metrics & architecture..." />;
  }

  // Format feature importances for Recharts bar chart
  const featureData = modelInfo?.feature_importances
    ? Object.entries(modelInfo.feature_importances)
        .map(([name, score]) => ({
          feature: name.replace('_', ' ').toUpperCase(),
          importance: Math.round(score * 1000) / 10, // percentage with 1 decimal
        }))
        .sort((a, b) => b.importance - a.importance)
    : [];

  const cm = modelInfo?.confusion_matrix || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">
          Machine Learning Model Specifications & Metrics
        </h2>
        <p className="text-xs text-slate-400">
          Architecture, classification performance evaluation, confusion matrix, and feature importances.
        </p>
      </div>

      {/* Model Limitations Notice */}
      <div className="rounded-xl border border-amber-950 bg-amber-950/20 p-4 text-xs text-amber-200">
        <div className="flex items-start gap-2.5">
          <Info className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-300">Academic & Engineering Prototype Disclaimer: </span>
            {modelInfo?.limitations}
          </div>
        </div>
      </div>

      {/* Evaluation Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-emerald-900/40 bg-slate-900/70 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accuracy</span>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {modelInfo ? `${(modelInfo.metrics.accuracy * 100).toFixed(1)}%` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Test split classification</p>
        </div>

        <div className="rounded-xl border border-cyan-900/40 bg-slate-900/70 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Precision (Macro)</span>
          <p className="mt-2 text-2xl font-bold text-cyan-400">
            {modelInfo ? `${(modelInfo.metrics.precision_macro * 100).toFixed(1)}%` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Zero division guarded</p>
        </div>

        <div className="rounded-xl border border-cyan-900/40 bg-slate-900/70 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recall (Macro)</span>
          <p className="mt-2 text-2xl font-bold text-cyan-400">
            {modelInfo ? `${(modelInfo.metrics.recall_macro * 100).toFixed(1)}%` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Multi-class sensitivity</p>
        </div>

        <div className="rounded-xl border border-cyan-900/40 bg-slate-900/70 p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">F1-Score (Macro)</span>
          <p className="mt-2 text-2xl font-bold text-cyan-400">
            {modelInfo ? `${(modelInfo.metrics.f1_macro * 100).toFixed(1)}%` : '--'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Harmonic mean</p>
        </div>
      </div>

      {/* Feature Importance & Confusion Matrix Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Feature Importance Bar Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Gini Feature Importances</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Relative predictive weight assigned to each physical sensor channel
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="feature" type="category" stroke="#64748b" tick={{ fontSize: 10 }} width={110} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Importance Weight']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                  {featureData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#06b6d4' : index === 1 ? '#38bdf8' : '#60a5fa'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Classification Confusion Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Test split validation (Actual vs Predicted condition categories)
          </p>

          {cm.length === 3 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-400">
                    <th className="py-2.5 px-3 text-left">Actual \ Predicted</th>
                    <th className="py-2.5 px-3 font-semibold text-emerald-400">Normal</th>
                    <th className="py-2.5 px-3 font-semibold text-amber-400">Warning</th>
                    <th className="py-2.5 px-3 font-semibold text-rose-400">High Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-855">
                  <tr>
                    <td className="py-3 px-3 text-left font-semibold text-emerald-400">Normal</td>
                    <td className="py-3 px-3 font-bold text-white bg-emerald-950/30">{cm[0][0]}</td>
                    <td className="py-3 px-3 text-slate-400">{cm[0][1]}</td>
                    <td className="py-3 px-3 text-slate-400">{cm[0][2]}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-left font-semibold text-amber-400">Warning</td>
                    <td className="py-3 px-3 text-slate-400">{cm[1][0]}</td>
                    <td className="py-3 px-3 font-bold text-white bg-amber-950/30">{cm[1][1]}</td>
                    <td className="py-3 px-3 text-slate-400">{cm[1][2]}</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 text-left font-semibold text-rose-400">High Risk</td>
                    <td className="py-3 px-3 text-slate-400">{cm[2][0]}</td>
                    <td className="py-3 px-3 text-slate-400">{cm[2][1]}</td>
                    <td className="py-3 px-3 font-bold text-white bg-rose-950/30">{cm[2][2]}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Confusion matrix data not available.
            </div>
          )}

          <div className="mt-5 rounded-lg bg-slate-950/70 p-3 text-[11px] text-slate-400 border border-slate-800">
            <span className="font-semibold text-white">Dataset Summary: </span>
            {modelInfo?.n_samples} synthetic samples generated • {modelInfo?.train_size} training samples (80%) • {modelInfo?.test_size} test samples (20% stratified)
          </div>
        </div>
      </div>

      {/* Retrain Model Action Section */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Retrain Random Forest Classifier</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Regenerate synthetic training telemetry with custom dataset volume and random seeds.
        </p>

        <form onSubmit={handleRetrain} className="flex flex-wrap items-end gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Sample Count (N)
            </label>
            <input
              type="number"
              min="1000"
              max="15000"
              step="500"
              value={nSamples}
              onChange={(e) => setNSamples(parseInt(e.target.value) || 3000)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Random Seed
            </label>
            <input
              type="number"
              value={randomSeed}
              onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
              className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isRetraining}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white shadow-md shadow-cyan-950 hover:bg-cyan-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
            <span>{isRetraining ? 'Retraining...' : 'Retrain & Persist Artifact'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
