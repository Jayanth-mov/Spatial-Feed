import { Tldraw, type Editor, type TLComponents } from 'tldraw'
import { TweetShapeUtil, TWEET_SHAPE_TYPE } from './TweetShape'
import { Toolbar } from './Toolbar'
import { isTweetUrl, extractTweetId } from '../utils/tweetParser'
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/storage'
import { throttle } from '../utils/throttle'

const CUSTOM_SHAPE_UTILS = [TweetShapeUtil]

const COMPONENTS: TLComponents = {
  InFrontOfTheCanvas: Toolbar,
}

function handleMount(editor: Editor) {
  // Force dark mode always
  editor.user.updateUserPreferences({ colorScheme: 'dark' })

  // Restore persisted board
  loadFromLocalStorage(editor)

  // Intercept URL pastes — detect tweet URLs and create tweet shapes
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

  // Auto-save on every store change, throttled to 500ms
  editor.store.listen(
    throttle(() => {
      saveToLocalStorage(editor)
    }, 500)
  )
}

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        shapeUtils={CUSTOM_SHAPE_UTILS}
        components={COMPONENTS}
        onMount={handleMount}
        inferDarkMode
      />
    </div>
  )
}
