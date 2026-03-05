import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Tldraw, type Editor, type TLComponents } from 'tldraw'
import { DefaultSelectionBackground, DefaultSelectionForeground, DefaultShapeIndicators } from '@tldraw/editor'
import { TLINSTANCE_ID } from '@tldraw/tlschema'
import { TweetShapeUtil, TWEET_SHAPE_TYPE } from './TweetShape'
import { Toolbar } from './Toolbar'
import { LaserPointer } from './LaserPointer'
import { isTweetUrl, extractTweetId } from '../utils/tweetParser'
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage'
import { throttle } from '../utils/throttle'

const CUSTOM_SHAPE_UTILS = [TweetShapeUtil]

let globalEditor: Editor | null = null
let isPresenting = false

function handleMount(editor: Editor) {
  globalEditor = editor
  editor.user.updateUserPreferences({ colorScheme: 'dark' })
  loadFromLocalStorage(editor)

  // Suppress hover & selection indicators in present mode by intercepting instance state changes
  editor.store.listen((entry) => {
    if (!isPresenting) return
    const instanceChange = entry.changes.updated[TLINSTANCE_ID]
    if (!instanceChange) return
    const [, next] = instanceChange as unknown as [unknown, { isHoveringCanvas: boolean | null; hoveredShapeId: string | null }]
    if (next.isHoveringCanvas || next.hoveredShapeId) {
      editor.updateInstanceState({ isHoveringCanvas: false })
      editor.setHoveredShape(null)
    }
  })

  editor.registerExternalContentHandler('url', (content) => {
    const url = content.url
    if (!url || !isTweetUrl(url)) return

    const tweetId = extractTweetId(url)
    if (!tweetId) return

    const point = content.point ?? editor.getViewportPageBounds().center

    editor.createShape({
      type: TWEET_SHAPE_TYPE,
      x: point.x - 275,
      y: point.y - 325,
      props: {
        tweetId,
        w: 550,
        h: 650,
      },
    })
  })

  editor.store.listen(
    throttle(() => {
      saveToLocalStorage(editor)
    }, 500)
  )
}

const PresentingContext = createContext(false)
const OnPresentContext = createContext<() => void>(() => {})

// Stable component overrides — defined outside App so tldraw never remounts them.
// They read from context so they react to presenting state changes.
function PresentableShapeIndicators() {
  const presenting = useContext(PresentingContext)
  return <DefaultShapeIndicators hideAll={presenting} />
}

function PresentableSelectionForeground(props: any) {
  const presenting = useContext(PresentingContext)
  if (presenting) return null
  return <DefaultSelectionForeground {...props} />
}

function PresentableSelectionBackground(props: any) {
  const presenting = useContext(PresentingContext)
  if (presenting) return null
  return <DefaultSelectionBackground {...props} />
}

function ToolbarSlot() {
  const presenting = useContext(PresentingContext)
  const onPresent = useContext(OnPresentContext)
  if (presenting) return null
  return <Toolbar onPresent={onPresent} />
}

const COMPONENTS: TLComponents = {
  ShapeIndicators: PresentableShapeIndicators,
  SelectionForeground: PresentableSelectionForeground,
  SelectionBackground: PresentableSelectionBackground,
  InFrontOfTheCanvas: ToolbarSlot,
}

export default function App() {
  const [presenting, setPresenting] = useState(false)

  const enterPresent = useCallback(() => {
    document.documentElement.requestFullscreen().catch(() => {})
    globalEditor?.selectNone()
    globalEditor?.updateInstanceState({ isHoveringCanvas: false })
    setPresenting(true)
  }, [])

  const exitPresent = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setPresenting(false)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPresenting(false)
    }
    const onFsChange = () => {
      if (!document.fullscreenElement) setPresenting(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFsChange)
    }
  }, [])

  return (
    <PresentingContext.Provider value={presenting}>
      <OnPresentContext.Provider value={enterPresent}>
        <div style={{ position: 'fixed', inset: 0 }}>
          <Tldraw
            shapeUtils={CUSTOM_SHAPE_UTILS}
            components={COMPONENTS}
            onMount={handleMount}
            hideUi={presenting}
            inferDarkMode
          />
          {presenting && <LaserPointer />}
          {presenting && (
            <button
              onClick={exitPresent}
              title="Exit presentation (Esc)"
              style={{
                position: 'fixed',
                bottom: '16px',
                right: '16px',
                zIndex: 9999,
                background: 'rgba(15, 15, 15, 0.7)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                color: 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                fontFamily: 'system-ui, sans-serif',
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              Exit (Esc)
            </button>
          )}
        </div>
      </OnPresentContext.Provider>
    </PresentingContext.Provider>
  )
}
