import { trpc } from "@/lib/trpc";

export interface FeedPost {
  id: number;
  userId: number;
  userName: string;
  userPhoto?: string;
  content: string;
  imageUrl?: string;
  rating?: number;
  cigarName: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
}

export interface PostComment {
  id: number;
  userName: string;
  userPhoto: string;
  content: string;
  createdAt: string;
}

/**
 * Fetch feed posts from the server
 */
export async function getFeedPosts(limit: number = 20, offset: number = 0): Promise<FeedPost[]> {
  try {
    // TODO: Implementar chamada tRPC para buscar posts do servidor
    // const posts = await trpc.feed.getPosts.query({ limit, offset });
    // return posts;
    
    // Por enquanto, retorna dados mock
    return [];
  } catch (error) {
    console.error("Failed to fetch feed posts:", error);
    throw error;
  }
}

/**
 * Create a new post from a review
 */
export async function createPostFromReview(
  reviewId: number,
  isPublic: boolean,
  content?: string
): Promise<FeedPost> {
  try {
    // TODO: Implementar chamada tRPC para criar post
    // const post = await trpc.feed.createPost.mutate({
    //   reviewId,
    //   isPublic,
    //   content,
    // });
    // return post;
    
    throw new Error("Not implemented");
  } catch (error) {
    console.error("Failed to create post:", error);
    throw error;
  }
}

/**
 * Like or unlike a post
 */
export async function toggleLikePost(postId: number): Promise<boolean> {
  try {
    // TODO: Implementar chamada tRPC para dar like
    // const result = await trpc.feed.toggleLike.mutate({ postId });
    // return result.isLiked;
    
    return true;
  } catch (error) {
    console.error("Failed to toggle like:", error);
    throw error;
  }
}

/**
 * Add a comment to a post
 */
export async function addCommentToPost(postId: number, content: string): Promise<PostComment> {
  try {
    // TODO: Implementar chamada tRPC para adicionar comentário
    // const comment = await trpc.feed.addComment.mutate({
    //   postId,
    //   content,
    // });
    // return comment;
    
    throw new Error("Not implemented");
  } catch (error) {
    console.error("Failed to add comment:", error);
    throw error;
  }
}

/**
 * Get comments for a post
 */
export async function getPostComments(postId: number): Promise<PostComment[]> {
  try {
    // TODO: Implementar chamada tRPC para buscar comentários
    // const comments = await trpc.feed.getComments.query({ postId });
    // return comments;
    
    return [];
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    throw error;
  }
}

/**
 * Delete a post
 */
export async function deletePost(postId: number): Promise<void> {
  try {
    // TODO: Implementar chamada tRPC para deletar post
    // await trpc.feed.deletePost.mutate({ postId });
  } catch (error) {
    console.error("Failed to delete post:", error);
    throw error;
  }
}

/**
 * Share a post (returns shareable URL)
 */
export async function getShareablePostUrl(postId: number): Promise<string> {
  try {
    // TODO: Gerar URL compartilhável
    // const url = `${process.env.EXPO_PUBLIC_APP_URL}/posts/${postId}`;
    // return url;
    
    return `cigarcollab://posts/${postId}`;
  } catch (error) {
    console.error("Failed to get shareable URL:", error);
    throw error;
  }
}
