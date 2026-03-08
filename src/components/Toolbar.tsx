import { useEditor } from 'tldraw'
import { exportBoardAsFile, importBoardFromFile } from '../utils/storage'

interface ToolbarProps {
  onPresent: () => void
}

export function Toolbar({ onPresent }: ToolbarProps) {
  const editor = useEditor()

  return (
    <div
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        pointerEvents: 'all',
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        background: 'rgba(15, 15, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '6px 10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <span
        style={{
          color: 'rgba(255,255,255,0.5)',
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          marginRight: '4px',
        }}
      >
        Jayanth's Spatial Feed
      </span>

      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />

      <button
        onClick={() => exportBoardAsFile(editor)}
        style={buttonStyle}
        title="Export board as JSON file"
      >
        Export
      </button>

      <button
        onClick={() => importBoardFromFile(editor)}
        style={buttonStyle}
        title="Import board from JSON file"
      >
        Import
      </button>

      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />

      <button
        onClick={onPresent}
        style={buttonStyle}
        title="Present — hide all UI"
      >
        Present
      </button>
    </div>
  )
}

const buttonStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '6px',
  color: 'rgba(255,255,255,0.85)',
  fontSize: '12px',
  fontFamily: 'system-ui, sans-serif',
  padding: '4px 10px',
  cursor: 'pointer',
  transition: 'background 0.15s',
}
