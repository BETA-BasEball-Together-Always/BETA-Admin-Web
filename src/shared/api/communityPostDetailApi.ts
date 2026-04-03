import { httpClient } from '@shared/api/httpClient'

const COMMUNITY_API_BASE_PATH = '/api/v1/community'

export type CommunityPostImageResponse = {
  imageId: number
  imageUrl: string
}

export type CommunityPostAuthorResponse = {
  userId: number
  nickname: string
  teamCode: string
}

export type CommunityPostEmotionCountResponse = {
  likeCount: number
  sadCount: number
  funCount: number
  hypeCount: number
}

export type CommunityPostReplyResponse = {
  commentId: number
  userId: number | null
  nickname: string | null
  teamCode: string | null
  content: string
  likeCount: number
  depth: number
  createdAt: string
  isLiked: boolean
  deleted: boolean
}

export type CommunityPostCommentResponse = CommunityPostReplyResponse & {
  replies: CommunityPostReplyResponse[]
}

export type CommunityPostDetailResponse = {
  postId: number
  content: string
  channel: string
  images: CommunityPostImageResponse[]
  hashtags: string[]
  author: CommunityPostAuthorResponse
  emotions: CommunityPostEmotionCountResponse
  commentCount: number
  createdAt: string
  comments: CommunityPostCommentResponse[]
  hasNextComments: boolean
  nextCommentCursor: number | null
}

export type CommunityPostCommentsResponse = {
  comments: CommunityPostCommentResponse[]
  hasNext: boolean
  nextCursor: number | null
}

function resolveCommunityUrl(path: string): string {
  if (typeof window === 'undefined') {
    return `${COMMUNITY_API_BASE_PATH}${path}`
  }

  return new URL(`${COMMUNITY_API_BASE_PATH}${path}`, window.location.origin).toString()
}

function normalizeReply(reply: CommunityPostReplyResponse): CommunityPostReplyResponse {
  return {
    commentId: Number(reply.commentId),
    userId: reply.userId ?? null,
    nickname: reply.nickname ?? null,
    teamCode: reply.teamCode ?? null,
    content: reply.content,
    likeCount: Number(reply.likeCount ?? 0),
    depth: Number(reply.depth ?? 1),
    createdAt: reply.createdAt,
    isLiked: Boolean(reply.isLiked),
    deleted: Boolean(reply.deleted),
  }
}

function normalizeComment(comment: CommunityPostCommentResponse): CommunityPostCommentResponse {
  return {
    ...normalizeReply(comment),
    replies: Array.isArray(comment.replies)
      ? comment.replies.map(normalizeReply)
      : [],
  }
}

function normalizeDetail(detail: CommunityPostDetailResponse): CommunityPostDetailResponse {
  return {
    postId: Number(detail.postId),
    content: detail.content,
    channel: detail.channel,
    images: Array.isArray(detail.images)
      ? detail.images.map((image) => ({
        imageId: Number(image.imageId),
        imageUrl: image.imageUrl,
      }))
      : [],
    hashtags: Array.isArray(detail.hashtags) ? detail.hashtags : [],
    author: {
      userId: Number(detail.author.userId),
      nickname: detail.author.nickname,
      teamCode: detail.author.teamCode,
    },
    emotions: {
      likeCount: Number(detail.emotions.likeCount ?? 0),
      sadCount: Number(detail.emotions.sadCount ?? 0),
      funCount: Number(detail.emotions.funCount ?? 0),
      hypeCount: Number(detail.emotions.hypeCount ?? 0),
    },
    commentCount: Number(detail.commentCount ?? 0),
    createdAt: detail.createdAt,
    comments: Array.isArray(detail.comments)
      ? detail.comments.map(normalizeComment)
      : [],
    hasNextComments: Boolean(detail.hasNextComments),
    nextCommentCursor: detail.nextCommentCursor == null ? null : Number(detail.nextCommentCursor),
  }
}

function normalizeCommentsResponse(response: CommunityPostCommentsResponse): CommunityPostCommentsResponse {
  return {
    comments: Array.isArray(response.comments)
      ? response.comments.map(normalizeComment)
      : [],
    hasNext: Boolean(response.hasNext),
    nextCursor: response.nextCursor == null ? null : Number(response.nextCursor),
  }
}

export async function getCommunityPostDetail(postId: number): Promise<CommunityPostDetailResponse> {
  const { data } = await httpClient.get<CommunityPostDetailResponse>(
    resolveCommunityUrl(`/posts/${postId}`),
  )

  return normalizeDetail(data)
}

export async function getCommunityPostComments(
  postId: number,
  cursor: number,
): Promise<CommunityPostCommentsResponse> {
  const { data } = await httpClient.get<CommunityPostCommentsResponse>(
    resolveCommunityUrl(`/posts/${postId}/comments`),
    {
      params: {
        cursor,
      },
    },
  )

  return normalizeCommentsResponse(data)
}
