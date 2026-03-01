import {
  BaseBoxShapeUtil,
  HTMLContainer,
  T,
  type TLBaseShape,
  type RecordProps,
} from 'tldraw'
import { Tweet } from 'react-tweet'

export const TWEET_SHAPE_TYPE = 'tweet' as const

export type TweetShapeProps = {
  tweetId: string
  w: number
  h: number
}

// Register our custom shape so it's part of TLShape and createShape accepts it
declare module 'tldraw' {
  interface TLGlobalShapePropsMap {
    tweet: TweetShapeProps
  }
}

export type TweetShape = TLBaseShape<typeof TWEET_SHAPE_TYPE, TweetShapeProps>

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

  override canScroll() {
    return true
  }

  component(shape: TweetShape) {
    return (
      <HTMLContainer
        id={shape.id}
        style={{
          overflow: 'auto',
          pointerEvents: 'all',
          backgroundColor: '#15202b',
          borderRadius: '12px',
          border: '1px solid #2f3336',
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div data-theme="dark" style={{ padding: '8px' }}>
          {shape.props.tweetId ? (
            <Tweet id={shape.props.tweetId} />
          ) : (
            <div style={{ color: '#aaa', padding: '16px', textAlign: 'center' }}>
              No tweet ID
            </div>
          )}
        </div>
      </HTMLContainer>
    )
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
