import { httpClient } from '@shared/api/httpClient'
import { type AdminPageResponse, normalizeAdminPageResponse } from '@shared/api/adminPage'
import { resolveAdminPath } from '@shared/api/adminApiPath'

export type AdminPostStatus = 'PENDING' | 'ACTIVE' | 'DELETED' | 'HIDDEN' | 'REPORTED'
export type AdminPostChannel =
  | 'DOOSAN'
  | 'LG'
  | 'KIWOOM'
  | 'KT'
  | 'SSG'
  | 'KIA'
  | 'SAMSUNG'
  | 'NC'
  | 'HANWHA'
  | 'LOTTE'
  | 'ALL'

export type AdminPostItemResponse = {
  postId: number
  authorUserId: number
  authorNickname: string | null
  content: string
  channel: AdminPostChannel
  status: AdminPostStatus
  createdAt: string
}

type GetAdminPostsParams = {
  page: number
  size: number
  status?: AdminPostStatus
  channel?: AdminPostChannel
  keyword?: string
}

export type AdminPostImageResponse = {
  imageId: number
  imageUrl: string
}

export type AdminPostAuthorResponse = {
  userId: number
  nickname: string | null
  teamCode: string | null
}

export type AdminPostEmotionCountResponse = {
  likeCount: number
  sadCount: number
  funCount: number
  hypeCount: number
}

export type AdminPostReplyResponse = {
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

export type AdminPostCommentResponse = AdminPostReplyResponse & {
  replies: AdminPostReplyResponse[]
}

export type AdminPostDetailResponse = {
  postId: number
  content: string
  channel: AdminPostChannel
  status: AdminPostStatus
  images: AdminPostImageResponse[]
  hashtags: string[]
  author: AdminPostAuthorResponse
  emotions: AdminPostEmotionCountResponse
  commentCount: number
  createdAt: string
  comments: AdminPostCommentResponse[]
  hasNextComments: boolean
  nextCommentCursor: number | null
}

export type AdminPostCommentsResponse = {
  comments: AdminPostCommentResponse[]
  hasNext: boolean
  nextCursor: number | null
}

function normalizeAdminPost(item: AdminPostItemResponse): AdminPostItemResponse {
  return {
    postId: item.postId,
    authorUserId: item.authorUserId,
    authorNickname: item.authorNickname ?? null,
    content: item.content,
    channel: item.channel,
    status: item.status,
    createdAt: item.createdAt,
  }
}

function normalizeReply(reply: AdminPostReplyResponse): AdminPostReplyResponse {
  return {
    commentId: Number(reply.commentId),
    userId: reply.userId == null ? null : Number(reply.userId),
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

function normalizeComment(comment: AdminPostCommentResponse): AdminPostCommentResponse {
  return {
    ...normalizeReply(comment),
    replies: Array.isArray(comment.replies)
      ? comment.replies.map(normalizeReply)
      : [],
  }
}

function normalizeAdminPostDetail(detail: AdminPostDetailResponse): AdminPostDetailResponse {
  return {
    postId: Number(detail.postId),
    content: detail.content,
    channel: detail.channel,
    status: detail.status,
    images: Array.isArray(detail.images)
      ? detail.images.map((image) => ({
        imageId: Number(image.imageId),
        imageUrl: image.imageUrl,
      }))
      : [],
    hashtags: Array.isArray(detail.hashtags) ? detail.hashtags : [],
    author: {
      userId: Number(detail.author.userId),
      nickname: detail.author.nickname ?? null,
      teamCode: detail.author.teamCode ?? null,
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

function normalizeAdminPostCommentsResponse(
  response: AdminPostCommentsResponse,
): AdminPostCommentsResponse {
  return {
    comments: Array.isArray(response.comments)
      ? response.comments.map(normalizeComment)
      : [],
    hasNext: Boolean(response.hasNext),
    nextCursor: response.nextCursor == null ? null : Number(response.nextCursor),
  }
}

export async function getAdminPosts(
  params: GetAdminPostsParams,
): Promise<AdminPageResponse<AdminPostItemResponse>> {
  const { data } = await httpClient.get<AdminPageResponse<AdminPostItemResponse>>(
    resolveAdminPath('/posts'),
    {
      params,
    },
  )

  return normalizeAdminPageResponse(data, normalizeAdminPost)
}

export async function getAdminPostDetail(postId: number): Promise<AdminPostDetailResponse> {
  const { data } = await httpClient.get<AdminPostDetailResponse>(
    resolveAdminPath(`/posts/${postId}`),
  )

  return normalizeAdminPostDetail(data)
}

export async function getAdminPostComments(
  postId: number,
  cursor: number,
): Promise<AdminPostCommentsResponse> {
  const { data } = await httpClient.get<AdminPostCommentsResponse>(
    resolveAdminPath(`/posts/${postId}/comments`),
    {
      params: {
        cursor,
      },
    },
  )

  return normalizeAdminPostCommentsResponse(data)
}
