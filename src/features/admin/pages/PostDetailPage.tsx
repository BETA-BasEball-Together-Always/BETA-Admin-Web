import {
  Clock3,
  Flame,
  Frown,
  Hash,
  Heart,
  Images,
  MessageSquare,
  Smile,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { toApiError } from '@shared/api/apiError'
import {
  getCommunityPostComments,
  getCommunityPostDetail,
  type CommunityPostCommentResponse,
  type CommunityPostEmotionCountResponse,
  type CommunityPostImageResponse,
  type CommunityPostReplyResponse,
} from '@shared/api/communityPostDetailApi'
import { getTeamLogoByCode } from '@shared/team/teamLogo'

const numberFormatter = new Intl.NumberFormat('ko-KR')

type ReactionCard = {
  key: keyof CommunityPostEmotionCountResponse
  label: string
  icon: LucideIcon
  count: number
}

function resolvePostId(value: string | null | undefined): number | null {
  const numericValue = Number(value)

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    return null
  }

  return numericValue
}

function formatCount(value: number): string {
  return numberFormatter.format(value)
}

function formatDateTime(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function normalizeHashtag(hashtag: string): string {
  return hashtag.startsWith('#') ? hashtag.slice(1) : hashtag
}

function getReactionCards(emotions: CommunityPostEmotionCountResponse): ReactionCard[] {
  return [
    { key: 'likeCount', label: 'like', icon: Heart, count: emotions.likeCount },
    { key: 'sadCount', label: 'sad', icon: Frown, count: emotions.sadCount },
    { key: 'funCount', label: 'fun', icon: Smile, count: emotions.funCount },
    { key: 'hypeCount', label: 'hype', icon: Flame, count: emotions.hypeCount },
  ]
}

function getCommentAuthorName({
  deleted,
  nickname,
  userId,
}: {
  deleted: boolean
  nickname: string | null
  userId: number | null
}): string {
  if (deleted) {
    return '삭제된 사용자'
  }

  if (nickname) {
    return nickname
  }

  if (userId != null) {
    return `userId ${userId}`
  }

  return '알 수 없음'
}

function getCommentMeta({
  createdAt,
  teamCode,
}: {
  createdAt: string
  teamCode: string | null
}): string {
  return `${teamCode ?? '알 수 없음'} · ${formatDateTime(createdAt)}`
}

function hasReplies(
  comment: CommunityPostCommentResponse | CommunityPostReplyResponse,
): comment is CommunityPostCommentResponse {
  return 'replies' in comment
}

function CommentCard({
  comment,
  isReply = false,
}: {
  comment: CommunityPostCommentResponse | CommunityPostReplyResponse
  isReply?: boolean
}) {
  return (
    <article className={isReply ? 'admin-post-detail-reply' : 'admin-post-detail-comment'}>
      {isReply ? (
        <div className="admin-post-detail-reply-top">
          <span className="admin-post-detail-reply-label">답글</span>
        </div>
      ) : null}

      <div className="admin-post-detail-comment-header">
        <div className="admin-post-detail-comment-author">
          <span className={`admin-post-detail-comment-author-badge ${isReply ? 'is-reply' : ''}`}>
            {isReply ? (
              <MessageSquare aria-hidden className="admin-post-detail-comment-author-icon" strokeWidth={2} />
            ) : (
              <UserRound aria-hidden className="admin-post-detail-comment-author-icon" strokeWidth={2} />
            )}
          </span>
          <div>
            <p className="admin-post-detail-comment-author-name">{getCommentAuthorName(comment)}</p>
            <p className="admin-post-detail-comment-author-meta">{getCommentMeta(comment)}</p>
          </div>
        </div>

        {comment.deleted ? (
          <span className="admin-members-status-badge admin-members-status-withdrawn">삭제</span>
        ) : null}
      </div>

      <p className="admin-post-detail-comment-body">{comment.content}</p>

      <div className="admin-post-detail-comment-stats">
        <span>{isReply ? `답글 ID #${comment.commentId}` : `댓글 ID #${comment.commentId}`}</span>
        <span>{`좋아요 ${formatCount(comment.likeCount)}`}</span>
      </div>

      {!isReply && hasReplies(comment) && comment.replies.length > 0 ? (
        <div className="admin-post-detail-replies">
          {comment.replies.map((reply) => (
            <CommentCard comment={reply} isReply key={reply.commentId} />
          ))}
        </div>
      ) : null}
    </article>
  )
}

function ImageLightbox({
  image,
  onClose,
}: {
  image: CommunityPostImageResponse
  onClose: () => void
}) {
  return (
    <div
      aria-modal="true"
      className="admin-post-detail-lightbox"
      onClick={onClose}
      role="dialog"
    >
      <div className="admin-post-detail-lightbox-content" onClick={(event) => event.stopPropagation()}>
        <button
          aria-label="이미지 닫기"
          className="btn-base btn-neutral admin-post-detail-lightbox-close"
          onClick={onClose}
          type="button"
        >
          닫기
        </button>
        <img
          alt={`게시글 이미지 ${image.imageId}`}
          className="admin-post-detail-lightbox-image"
          loading="eager"
          src={image.imageUrl}
        />
      </div>
    </div>
  )
}

function PostDetailLoadingState() {
  return (
    <>
      <article className="surface admin-post-detail-main">
        <div className="admin-skeleton admin-members-skeleton-text" />
        <div className="admin-skeleton admin-members-skeleton-text" />
        <div className="admin-skeleton admin-members-skeleton-text" />
        <div className="admin-skeleton admin-members-skeleton-text" />
      </article>

      <article className="surface admin-post-detail-comments">
        <div className="admin-skeleton admin-members-skeleton-text" />
        <div className="admin-skeleton admin-members-skeleton-text" />
        <div className="admin-skeleton admin-members-skeleton-text" />
      </article>
    </>
  )
}

function PostDetailErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <article className="surface admin-feed-panel admin-error-panel">
      <h2 className="admin-feed-title">게시글 상세를 불러오지 못했습니다.</h2>
      <p className="page-subtitle">{message}</p>
      <div className="admin-post-detail-error-actions">
        <button className="btn-base btn-primary" onClick={onRetry} type="button">
          다시 시도
        </button>
      </div>
    </article>
  )
}

export function PostDetailPage() {
  const { postId: postIdParam } = useParams()
  const postId = resolvePostId(postIdParam)
  const [selectedImage, setSelectedImage] = useState<CommunityPostImageResponse | null>(null)
  const [loadedCommentsState, setLoadedCommentsState] = useState<{
    postId: number
    items: CommunityPostCommentResponse[]
    hasNext: boolean
    nextCursor: number | null
  } | null>(null)

  const postDetailQuery = useQuery({
    queryKey: ['community', 'post-detail', postId ?? 'invalid'],
    queryFn: () => getCommunityPostDetail(postId as number),
    enabled: postId != null,
    staleTime: 30_000,
  })

  const currentLoadedCommentsState = loadedCommentsState?.postId === postId
    ? loadedCommentsState
    : null
  const nextCommentCursor = currentLoadedCommentsState?.nextCursor ?? postDetailQuery.data?.nextCommentCursor ?? null

  const loadMoreCommentsMutation = useMutation({
    mutationFn: () => {
      if (postId == null || nextCommentCursor == null) {
        throw new Error('추가 댓글이 없습니다.')
      }

      return getCommunityPostComments(postId, nextCommentCursor)
    },
    onSuccess: (response) => {
      if (postId == null) {
        return
      }

      setLoadedCommentsState((currentState) => ({
        postId,
        items: [
          ...(currentState?.postId === postId ? currentState.items : []),
          ...response.comments,
        ],
        hasNext: response.hasNext,
        nextCursor: response.nextCursor,
      }))
    },
  })

  if (postId == null) {
    return (
      <section className="admin-page admin-post-detail-page">
        <header className="admin-page-header admin-post-detail-header">
          <div className="admin-post-detail-header-main">
            <h1 className="page-title admin-page-title">게시글 상세</h1>
          </div>
        </header>

        <article className="surface admin-feed-panel admin-error-panel">
          <h2 className="admin-feed-title">유효한 postId가 없습니다.</h2>
          <p className="page-subtitle">다른 화면에서 전달받은 게시글 ID를 확인해 주세요.</p>
        </article>
      </section>
    )
  }

  if (postDetailQuery.isPending) {
    return (
      <section className="admin-page admin-post-detail-page">
        <header className="admin-page-header admin-post-detail-header">
          <div className="admin-post-detail-header-main">
            <h1 className="page-title admin-page-title">게시글 상세</h1>
          </div>
        </header>

        <PostDetailLoadingState />
      </section>
    )
  }

  if (postDetailQuery.isError) {
    return (
      <section className="admin-page admin-post-detail-page">
        <header className="admin-page-header admin-post-detail-header">
          <div className="admin-post-detail-header-main">
            <h1 className="page-title admin-page-title">게시글 상세</h1>
          </div>
        </header>

        <PostDetailErrorState
          message={toApiError(postDetailQuery.error).message}
          onRetry={() => void postDetailQuery.refetch()}
        />
      </section>
    )
  }

  const detail = postDetailQuery.data
  const comments = [...detail.comments, ...(currentLoadedCommentsState?.items ?? [])]
  const hasNextComments = currentLoadedCommentsState?.hasNext ?? detail.hasNextComments
  const reactionCards = getReactionCards(detail.emotions)
  const teamLogo = getTeamLogoByCode(detail.author.teamCode) ?? getTeamLogoByCode(detail.channel)
  const imageGridStyle = {
    '--image-column-count': String(Math.max(detail.images.length, 1)),
  } as CSSProperties

  return (
    <>
      <section className="admin-page admin-post-detail-page">
        <header className="admin-page-header admin-post-detail-header">
          <div className="admin-post-detail-header-main">
            <h1 className="page-title admin-page-title">게시글 상세</h1>
          </div>
        </header>

        <article className="surface admin-post-detail-main">
          <div className="admin-post-detail-top-row">
            <div className="admin-post-detail-author">
              {teamLogo ? (
                <img
                  alt={`${detail.author.teamCode} logo`}
                  className="admin-team-logo admin-post-detail-author-logo"
                  loading="lazy"
                  src={teamLogo}
                />
              ) : (
                <span className="admin-channel-badge">{detail.author.teamCode}</span>
              )}

              <div>
                <p className="admin-post-detail-author-name">{detail.author.nickname}</p>
                <p className="admin-post-detail-author-meta">
                  {`userId ${detail.author.userId} · ${detail.author.teamCode}`}
                </p>
              </div>
            </div>

            <div className="admin-post-detail-meta">
              <div className="admin-post-detail-meta-item">
                <Hash aria-hidden className="admin-post-detail-meta-icon" strokeWidth={2} />
                <span>{`postId ${detail.postId}`}</span>
              </div>
              <div className="admin-post-detail-meta-item">
                <Clock3 aria-hidden className="admin-post-detail-meta-icon" strokeWidth={2} />
                <span>{formatDateTime(detail.createdAt)}</span>
              </div>
              <div className="admin-post-detail-meta-item">
                <MessageSquare aria-hidden className="admin-post-detail-meta-icon" strokeWidth={2} />
                <span>{`댓글 ${formatCount(detail.commentCount)}`}</span>
              </div>
            </div>
          </div>

          <div className="admin-post-detail-section">
            <h2 className="admin-feed-title admin-post-detail-section-title">본문</h2>
            <p className="admin-post-detail-content">{detail.content}</p>
          </div>

          {detail.images.length > 0 ? (
            <div className="admin-post-detail-section">
              <h2 className="admin-feed-title admin-post-detail-section-title">
                <Images aria-hidden className="admin-post-detail-section-icon" strokeWidth={2} />
                이미지
              </h2>
              <div className="admin-post-detail-image-grid" style={imageGridStyle}>
                {detail.images.map((image) => (
                  <button
                    className="admin-post-detail-image-button"
                    key={image.imageId}
                    onClick={() => setSelectedImage(image)}
                    type="button"
                  >
                    <img
                      alt={`게시글 이미지 ${image.imageId}`}
                      className="admin-post-detail-image"
                      loading="lazy"
                      src={image.imageUrl}
                    />
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {detail.hashtags.length > 0 ? (
            <div className="admin-post-detail-section">
              <h2 className="admin-feed-title admin-post-detail-section-title">해시태그</h2>
              <div className="admin-post-detail-tags">
                {detail.hashtags.map((hashtag) => (
                  <span className="admin-post-detail-tag" key={hashtag}>
                    #{normalizeHashtag(hashtag)}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="admin-post-detail-section">
            <h2 className="admin-feed-title admin-post-detail-section-title">반응</h2>
            <div className="admin-post-detail-reaction-grid">
              {reactionCards.map((reaction) => (
                <article className="surface-muted admin-post-detail-reaction-card" key={reaction.key}>
                  <div className="admin-post-detail-reaction-header">
                    <reaction.icon aria-hidden className="admin-post-detail-reaction-icon" strokeWidth={2} />
                    <span>{reaction.label}</span>
                  </div>
                  <p className="admin-post-detail-reaction-value">{formatCount(reaction.count)}</p>
                </article>
              ))}
            </div>
          </div>
        </article>

        <article className="surface admin-post-detail-comments">
          <div className="admin-panel-header">
            <h2 className="admin-feed-title admin-panel-title">
              <MessageSquare aria-hidden className="admin-panel-title-icon" strokeWidth={2} />
              <span>댓글</span>
            </h2>
            <span className="admin-panel-badge">{`총 ${formatCount(detail.commentCount)}개`}</span>
          </div>

          {comments.length > 0 ? (
            <div className="admin-post-detail-comments-list">
              {comments.map((comment) => (
                <CommentCard comment={comment} key={comment.commentId} />
              ))}
            </div>
          ) : (
            <div className="admin-post-detail-empty">
              아직 등록된 댓글이 없습니다.
            </div>
          )}

          {hasNextComments ? (
            <div className="admin-post-detail-comments-actions">
              {loadMoreCommentsMutation.isError ? (
                <p className="admin-post-detail-comments-error">
                  {toApiError(loadMoreCommentsMutation.error).message}
                </p>
              ) : null}
              <button
                className="btn-base btn-neutral admin-post-detail-comments-more"
                disabled={loadMoreCommentsMutation.isPending}
                onClick={() => loadMoreCommentsMutation.mutate()}
                type="button"
              >
                {loadMoreCommentsMutation.isPending ? '댓글 불러오는 중...' : '댓글 더보기'}
              </button>
            </div>
          ) : null}
        </article>
      </section>

      {selectedImage ? <ImageLightbox image={selectedImage} onClose={() => setSelectedImage(null)} /> : null}
    </>
  )
}
