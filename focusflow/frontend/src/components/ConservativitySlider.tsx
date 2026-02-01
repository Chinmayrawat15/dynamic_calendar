"use client";

interface ConservativitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export default function ConservativitySlider({
  value,
  onChange,
}: ConservativitySliderProps) {
  const baseMinutes = 45;
  const maxBuffer = 20;
  const examplePrediction = Math.round(baseMinutes + maxBuffer * value);

  const getActivePreset = () => {
    if (value === 0) return "optimistic";
    if (value === 0.5) return "balanced";
    if (value === 1) return "safe";
    return null;
  };

  const activePreset = getActivePreset();

  return (
    <div className="space-y-5">
      {/* Slider */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-surface-500 font-medium flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Aggressive
          </span>
          <span className="font-semibold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-lg">
            {(value * 100).toFixed(0)}%
          </span>
          <span className="text-surface-500 font-medium flex items-center gap-1.5">
            Conservative
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Example Preview */}
      <div className="bg-gradient-to-r from-primary-50 to-violet-50 rounded-xl p-4 border border-primary-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm flex-shrink-0">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-surface-700 text-sm">
              <span className="font-medium">Example:</span> A 45-minute task would be predicted as{" "}
              <span className="font-bold text-primary-600 bg-white px-2 py-0.5 rounded-md shadow-sm">
                {examplePrediction} minutes
              </span>
            </p>
            <p className="text-surface-500 text-sm mt-2">
              {value < 0.3 && "Uses median estimates. Best when you have uninterrupted focus time."}
              {value >= 0.3 && value < 0.7 && "Balanced predictions. Accounts for typical workday variability."}
              {value >= 0.7 && "Conservative estimates. Recommended for meetings or unpredictable schedules."}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onChange(0)}
          className={`px-4 py-3 text-sm rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
            activePreset === "optimistic"
              ? "bg-primary-100 text-primary-700 font-medium shadow-sm border-2 border-primary-300"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 border-2 border-transparent"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Optimistic</span>
        </button>
        <button
          onClick={() => onChange(0.5)}
          className={`px-4 py-3 text-sm rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
            activePreset === "balanced"
              ? "bg-primary-100 text-primary-700 font-medium shadow-sm border-2 border-primary-300"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 border-2 border-transparent"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <span>Balanced</span>
        </button>
        <button
          onClick={() => onChange(1)}
          className={`px-4 py-3 text-sm rounded-xl transition-all duration-200 flex flex-col items-center gap-1 ${
            activePreset === "safe"
              ? "bg-primary-100 text-primary-700 font-medium shadow-sm border-2 border-primary-300"
              : "bg-surface-100 text-surface-600 hover:bg-surface-200 border-2 border-transparent"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Safe</span>
        </button>
      </div>
    </div>
  );
}
