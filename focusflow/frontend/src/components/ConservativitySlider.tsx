"use client";

interface ConservativitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

/**
 * Conservativity slider for adjusting prediction aggressiveness.
 * 0 = aggressive (median), 1 = conservative (90th percentile)
 * TODO: Person C - Add preview of how predictions change
 */
export default function ConservativitySlider({
  value,
  onChange,
}: ConservativitySliderProps) {
  // Calculate example prediction to show effect
  const baseMinutes = 45;
  const maxBuffer = 20;
  const examplePrediction = Math.round(baseMinutes + maxBuffer * value);

  return (
    <div className="space-y-4">
      {/* Slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Aggressive</span>
          <span className="font-medium text-gray-900">
            {(value * 100).toFixed(0)}%
          </span>
          <span className="text-gray-500">Conservative</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
        />
      </div>

      {/* Explanation */}
      <div className="bg-gray-50 rounded-lg p-3 text-sm">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-gray-700">
              <strong>Example:</strong> A 45-minute task would be predicted as{" "}
              <span className="font-semibold text-primary-600">
                {examplePrediction} minutes
              </span>{" "}
              with current settings.
            </p>
            <p className="text-gray-500 mt-1">
              {value < 0.3 && "Uses median estimates. Best for ideal conditions."}
              {value >= 0.3 && value < 0.7 && "Balanced predictions. Accounts for some variability."}
              {value >= 0.7 && "Conservative estimates. Accounts for interruptions and delays."}
            </p>
          </div>
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2">
        <button
          onClick={() => onChange(0)}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            value === 0
              ? "bg-primary-100 text-primary-700 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Optimistic
        </button>
        <button
          onClick={() => onChange(0.5)}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            value === 0.5
              ? "bg-primary-100 text-primary-700 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Balanced
        </button>
        <button
          onClick={() => onChange(1)}
          className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
            value === 1
              ? "bg-primary-100 text-primary-700 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Safe
        </button>
      </div>
    </div>
  );
}
