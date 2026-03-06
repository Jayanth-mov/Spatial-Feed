import { useEffect, useRef } from 'react'
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  useIsEditing,
  type TLBaseShape,
  type RecordProps,
} from 'tldraw'

export const TWEET_SHAPE_TYPE = 'tweet' as const

export type TweetShapeProps = {
  tweetId: string
  w: number
  h: number
}

declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    tweet: TweetShapeProps
  }
}

export type TweetShape = TLBaseShape<typeof TWEET_SHAPE_TYPE, TweetShapeProps>

// Extend window with the Twitter widget API
declare global {
  interface Window {
    twttr?: {
      widgets: {
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: Record<string, unknown>
        ) => Promise<HTMLElement | undefined>
        load: (el?: HTMLElement) => void
      }
    }
  }
}

// Load the Twitter widgets.js script once, globally
function loadWidgetsScript(): Promise<void> {
  if (window.twttr) return Promise.resolve()
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://platform.twitter.com/widgets.js'
    script.async = true
    script.charset = 'utf-8'
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export class TweetShapeUtil extends BaseBoxShapeUtil<TweetShape> {
  static override type = TWEET_SHAPE_TYPE as typeof TWEET_SHAPE_TYPE

  static override props: RecordProps<TweetShape> = {
    tweetId: T.string,
    w: T.number,
    h: T.number,
  }

  getDefaultProps(): TweetShapeProps {
    return {
      tweetId: '',
      w: 550,
      h: 650,
    }
  }

  override canResize() {
    return true
  }

  override canEdit() {
    return true
  }

  component(shape: TweetShape) {
    return <TweetShapeComponent shape={shape} />
  }

  indicator(shape: TweetShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={12}
        ry={12}
      />
    )
  }
}

function TweetShapeComponent({ shape }: { shape: TweetShape }) {
  const isEditing = useIsEditing(shape.id)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderedIdRef = useRef<string>('')

  useEffect(() => {
    const el = containerRef.current
    if (!el || !shape.props.tweetId) return
    // Don't re-render if already showing this tweet
    if (renderedIdRef.current === shape.props.tweetId) return

    el.innerHTML = ''
    renderedIdRef.current = shape.props.tweetId

    loadWidgetsScript().then(() => {
      if (!window.twttr || !containerRef.current) return
      // Clear again in case the effect ran twice (React strict mode)
      containerRef.current.innerHTML = ''
      window.twttr.widgets.createTweet(shape.props.tweetId, containerRef.current, {
        theme: 'dark',
        dnt: true,
      })
    })
  }, [shape.props.tweetId])

  return (
    <HTMLContainer
      id={shape.id}
      style={{
        overflow: 'auto',
        pointerEvents: isEditing ? 'all' : 'none',
        backgroundColor: '#15202b',
        borderRadius: '12px',
        border: '1px solid #2f3336',
        position: 'relative',
      }}
      onWheelCapture={(e) => {
        if (isEditing) e.stopPropagation()
      }}
    >
      <div
        ref={containerRef}
        style={{ padding: '8px', minHeight: '100px' }}
      />

    </HTMLContainer>
  )
}
