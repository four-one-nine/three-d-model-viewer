import * as Slider from '@radix-ui/react-slider'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import * as Tooltip from '@radix-ui/react-tooltip'
import type { ModelSettings, BackgroundSettings, ExportSettings } from '../App'

interface ControlPanelProps {
  modelSettings: ModelSettings
  setModelSettings: (settings: ModelSettings) => void
  backgroundSettings: BackgroundSettings
  setBackgroundSettings: (settings: BackgroundSettings) => void
  exportSettings: ExportSettings
  setExportSettings: (settings: ExportSettings) => void
  onExport: () => void
  onReset: () => void
  onFlip: () => void
  isExporting: boolean
  hasModel: boolean
}

const aspectRatios = [
  { value: '16:9', label: '16:9' },
  { value: '2:3', label: '2:3' },
  { value: '4:3', label: '4:3' }
]

const resolutions = [
  { value: '1280x720', label: '720p' },
  { value: '1920x1080', label: '1080p' },
  { value: '2560x1440', label: '1440p' },
  { value: '3840x2160', label: '2160p' }
]

const SliderControl = ({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
}) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <label className="text-xs font-medium text-text-secondary">{label}</label>
      <span className="text-xs text-text-secondary">{value.toFixed(2)}</span>
    </div>
    <Slider.Root
      className="relative flex items-center select-none touch-none w-full h-5"
      value={[value]}
      onValueChange={(v) => onChange(v[0])}
      min={min}
      max={max}
      step={step}
    >
      <Slider.Track className="bg-border relative grow rounded-full h-[3px]">
        <Slider.Range className="absolute bg-accent rounded-full h-full" />
      </Slider.Track>
      <Slider.Thumb className="block w-4 h-4 bg-white rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-accent" />
    </Slider.Root>
  </div>
)

const ControlPanel = ({
  modelSettings,
  setModelSettings,
  backgroundSettings,
  setBackgroundSettings,
  exportSettings,
  setExportSettings,
  onExport,
  onReset,
  onFlip,
  isExporting,
  hasModel
}: ControlPanelProps) => {
  return (
    <Tooltip.Provider>
      <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">3D Model Viewer</h2>
          <p className="text-xs text-text-secondary">Upload and preview 3D models</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-primary">Colors</h3>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-xs text-text-secondary">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundSettings.color}
                  onChange={(e) => setBackgroundSettings({ ...backgroundSettings, color: e.target.value })}
                />
                <span className="text-xs text-text-secondary font-mono">
                  {backgroundSettings.color.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-xs text-text-secondary">Model</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={modelSettings.color}
                  onChange={(e) => setModelSettings({ ...modelSettings, color: e.target.value })}
                />
                <span className="text-xs text-text-secondary font-mono">
                  {modelSettings.color.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-primary">Model Properties</h3>
          <SliderControl
            label="Roughness"
            value={modelSettings.roughness}
            onChange={(v) => setModelSettings({ ...modelSettings, roughness: v })}
          />

          <SliderControl
            label="Metalness"
            value={modelSettings.metalness}
            onChange={(v) => setModelSettings({ ...modelSettings, metalness: v })}
          />

          <button
            onClick={onFlip}
            disabled={!hasModel}
            className={`w-full py-3 px-4 rounded-md font-medium text-sm transition-colors border border-border ${
              hasModel
                ? 'bg-surface text-text-secondary hover:bg-surface/80'
                : 'bg-surface text-text-secondary cursor-not-allowed'
            }`}
          >
            Flip Model
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium text-text-primary">Export</h3>
          
          <div className="space-y-2">
            <label className="text-xs text-text-secondary">Aspect Ratio</label>
            <ToggleGroup.Root
              className="flex rounded-md overflow-hidden border border-border"
              type="single"
              value={exportSettings.aspectRatio}
              onValueChange={(v) => v && setExportSettings({ ...exportSettings, aspectRatio: v })}
            >
              {aspectRatios.map((ar) => (
                <ToggleGroup.Item
                  key={ar.value}
                  value={ar.value}
                  className={`
                    flex-1 px-3 py-2 text-xs font-medium transition-colors
                    ${exportSettings.aspectRatio === ar.value 
                      ? 'bg-accent text-white' 
                      : 'bg-surface text-text-secondary hover:bg-border'}
                  `}
                >
                  {ar.label}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-text-secondary">Resolution</label>
            <select
              value={exportSettings.resolution}
              onChange={(e) => setExportSettings({ ...exportSettings, resolution: e.target.value })}
              className="w-full px-3 py-2 bg-surface border border-border rounded-md text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {resolutions.map((res) => (
                <option key={res.value} value={res.value}>
                  {res.label} ({res.value})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onExport}
            disabled={!hasModel || isExporting}
            className={`
              w-full py-3 px-4 rounded-md font-medium text-sm transition-colors
              ${hasModel && !isExporting
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-surface text-text-secondary cursor-not-allowed'}
            `}
          >
            {isExporting ? 'Exporting...' : 'Export Image'}
          </button>

          <button
            onClick={onReset}
            className="w-full py-3 px-4 rounded-md font-medium text-sm transition-colors bg-surface text-text-secondary hover:bg-surface/80 border border-border"
          >
            Load New Model
          </button>
        </div>
      </div>
    </Tooltip.Provider>
  )
}

export default ControlPanel