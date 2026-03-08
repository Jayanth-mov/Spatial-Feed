import { useCallback, useEffect, useState } from 'react'
import { DefaultToolbar, DefaultToolbarContent, HighlightToolbarItem, Tldraw, type Editor, type TLComponents } from 'tldraw'
import { TweetShapeUtil, TWEET_SHAPE_TYPE } from './TweetShape'
import { Toolbar } from './Toolbar'
import { LaserPointer } from './LaserPointer'
import { isTweetUrl, extractTweetId } from '../utils/tweetParser'
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage'
import { throttle } from '../utils/throttle'

const CUSTOM_SHAPE_UTILS = [TweetShapeUtil]

function handleMount(editor: Editor) {
  editor.user.updateUserPreferences({ colorScheme: 'dark' })
  loadFromLocalStorage(editor)

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

export default function App() {
  const [presenting, setPresenting] = useState(false)

  const enterPresent = useCallback(() => {
    document.documentElement.requestFullscreen().catch(() => {})
    setPresenting(true)
  }, [])

  const exitPresent = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    setPresenting(false)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPresenting(false) }
    const onFsChange = () => { if (!document.fullscreenElement) setPresenting(false) }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFsChange)
    }
  }, [])

  const components: TLComponents = presenting
    ? {}
    : {
        InFrontOfTheCanvas: () => <Toolbar onPresent={enterPresent} />,
        Toolbar: () => (
          <DefaultToolbar>
            <HighlightToolbarItem />
            <DefaultToolbarContent />
          </DefaultToolbar>
        ),
      }

  return (
    <div style={{ position: 'fixed', inset: 0 }} className={presenting ? 'presenting' : ''}>
      <Tldraw
        licenseKey="tldraw-2026-06-16/WyJjNGExYWFZYSIsWyIqIl0sMTYsIjIwMjYtMDYtMTYiXQ.ZiaE8Fi+JcdB5DbE6158tqk2ClpwLUfHUNie871vk2r1z8hPoPuJWRTteNirWYsDYvY8ZXVVmWwiPeA6V/Id3w"
        shapeUtils={CUSTOM_SHAPE_UTILS}
        components={components}
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
  )
}
