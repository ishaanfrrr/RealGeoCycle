import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  StyleSheet, View, Text, FlatList, TextInput, Pressable, Modal, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { auth } from '../../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { API_BASE_URL } from '@/constants/api';
import { Button, TextField, EmptyState, Banner } from '@/components/ui';
import { colors, contentMaxWidth, noWebOutline, radius, spacing, type } from '@/constants/theme';

interface Comment {
  comment: string; // stored by the server as "Author: text"
}

interface PostType {
  id: number;
  title: string;
  content: string;
  comments: Comment[];
  likes: number;
  author: string;
}

// The server saves comments as "Author: text"; split them back apart for display.
function splitComment(raw: string) {
  const i = raw.indexOf(': ');
  if (i === -1) return { author: '', text: raw };
  return { author: raw.slice(0, i), text: raw.slice(i + 2) };
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = (name || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initials}</Text>
    </View>
  );
}

function ActionButton({ icon, label, color = colors.textMuted, onPress, accessibilityLabel }: {
  icon: React.ComponentProps<typeof Ionicons>['name']; label?: string; color?: string; onPress: () => void; accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.action, pressed && { backgroundColor: colors.surfaceRaised }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      {label !== undefined && <Text style={[styles.actionText, { color }]}>{label}</Text>}
    </Pressable>
  );
}

const Forum: React.FC = () => {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [filter, setFilter] = useState<'all' | 'saved'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');

  const [composerOpen, setComposerOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [composerError, setComposerError] = useState('');

  const [openPostId, setOpenPostId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.displayName && user.email) {
        setUserName(user.displayName);
        setEmail(user.email);
      }
    });
    return unsubscribe;
  }, []);

  const loadPosts = useCallback(async () => {
    setLoadError(false);
    try {
      const [postsRes, likesRes] = await Promise.all([
        axios.get<PostType[]>(`${API_BASE_URL}/posts`),
        email ? axios.get<number[]>(`${API_BASE_URL}/likes/${email}`) : Promise.resolve({ data: [] as number[] }),
      ]);
      setPosts([...postsRes.data].reverse()); // newest first
      setLikedIds(likesRes.data);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    }
  }, [email]);

  useEffect(() => {
    loadPosts().finally(() => setLoading(false));
  }, [loadPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handleLike = async (postId: number) => {
    if (!email) return;
    const newHasLiked = !likedIds.includes(postId);
    // Update immediately, roll back if the server call fails.
    setLikedIds((ids) => (newHasLiked ? [...ids, postId] : ids.filter((id) => id !== postId)));
    setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, likes: p.likes + (newHasLiked ? 1 : -1) } : p)));
    try {
      await axios.post(`${API_BASE_URL}/like`, { email, postId, newHasLiked });
    } catch (error) {
      console.error(error);
      setLikedIds((ids) => (newHasLiked ? ids.filter((id) => id !== postId) : [...ids, postId]));
      setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, likes: p.likes + (newHasLiked ? -1 : 1) } : p)));
    }
  };

  const handleSave = (postId: number) => {
    setSavedIds((ids) => (ids.includes(postId) ? ids.filter((id) => id !== postId) : [...ids, postId]));
  };

  const handleAddPost = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      setComposerError('Add a title and a message.');
      return;
    }
    setComposerError('');
    setPosting(true);
    try {
      await axios.post(`${API_BASE_URL}/posts`, {
        id: Date.now(),
        title: newTitle.trim(),
        content: newContent.trim(),
        author: userName,
      });
      await loadPosts();
      setNewTitle('');
      setNewContent('');
      setComposerOpen(false);
    } catch (error) {
      console.error(error);
      setComposerError('Couldn\'t publish your post. Try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || openPostId === null) return;
    setCommenting(true);
    try {
      await axios.post(`${API_BASE_URL}/comment`, { id: openPostId, comment: newComment.trim(), author: userName });
      setNewComment('');
      await loadPosts();
    } catch (error: any) {
      console.error(error?.response?.data || error);
    } finally {
      setCommenting(false);
    }
  };

  const visiblePosts = filter === 'saved' ? posts.filter((p) => savedIds.includes(p.id)) : posts;
  const openPost = posts.find((p) => p.id === openPostId) || null;

  const renderPost = ({ item }: { item: PostType }) => {
    const liked = likedIds.includes(item.id);
    const saved = savedIds.includes(item.id);
    return (
      <Pressable
        onPress={() => setOpenPostId(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open post ${item.title}`}
        style={({ pressed }) => [styles.post, pressed && { borderColor: colors.borderStrong }]}
      >
        <View style={styles.postHeader}>
          <Avatar name={item.author} />
          <Text style={styles.postAuthor} numberOfLines={1}>{item.author}</Text>
        </View>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
        <View style={styles.actions}>
          <ActionButton
            icon={liked ? 'heart' : 'heart-outline'}
            label={String(item.likes)}
            color={liked ? colors.danger : colors.textMuted}
            onPress={() => handleLike(item.id)}
            accessibilityLabel={liked ? 'Unlike' : 'Like'}
          />
          <ActionButton
            icon="chatbubble-outline"
            label={String(item.comments?.length || 0)}
            onPress={() => setOpenPostId(item.id)}
            accessibilityLabel="Comments"
          />
          <View style={{ flex: 1 }} />
          <ActionButton
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            color={saved ? colors.primary : colors.textMuted}
            onPress={() => handleSave(item.id)}
            accessibilityLabel={saved ? 'Remove from saved' : 'Save post'}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.screen}>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={visiblePosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={type.title}>Community</Text>
              <Text style={[type.bodyMuted, { marginTop: spacing.xs }]}>Share ideas for living more sustainably</Text>
              <View style={styles.chips}>
                {(['all', 'saved'] as const).map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => setFilter(f)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: filter === f }}
                    style={[styles.chip, filter === f && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                      {f === 'all' ? 'All posts' : `Saved${savedIds.length ? ` (${savedIds.length})` : ''}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {loadError && <Banner message="Couldn't load posts. Pull down to try again." />}
            </View>
          }
          ListEmptyComponent={
            loadError ? null : filter === 'saved' ? (
              <EmptyState icon="bookmark-outline" title="Nothing saved yet" message="Tap the bookmark on a post to keep it here." />
            ) : (
              <EmptyState
                icon="chatbubbles-outline"
                title="No posts yet"
                message="Be the first to start a conversation."
                action={<Button label="Write a post" icon="create-outline" onPress={() => setComposerOpen(true)} />}
              />
            )
          }
        />
      )}

      <Pressable
        onPress={() => setComposerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Write a post"
        style={({ pressed }) => [styles.fab, pressed && { backgroundColor: colors.primaryPressed }]}
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </Pressable>

      {/* New post composer */}
      <Modal visible={composerOpen} transparent animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={type.heading}>New post</Text>
              <Pressable onPress={() => setComposerOpen(false)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ padding: spacing.xl }} keyboardShouldPersistTaps="handled">
              {composerError !== '' && <Banner message={composerError} />}
              <TextField label="Title" placeholder="What's on your mind?" value={newTitle} onChangeText={setNewTitle} />
              <TextField
                label="Message"
                placeholder="Share a tip, question or idea"
                value={newContent}
                onChangeText={setNewContent}
                multiline
                style={{ minHeight: 120, textAlignVertical: 'top' }}
              />
              <Button label="Post" icon="send" onPress={handleAddPost} loading={posting} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Post detail + comments */}
      <Modal visible={openPost !== null} transparent animationType="slide" onRequestClose={() => setOpenPostId(null)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {openPost && (
            <View style={[styles.sheet, { height: '88%' }]}>
              <View style={styles.sheetHeader}>
                <Text style={type.heading}>Post</Text>
                <Pressable onPress={() => setOpenPostId(null)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                  <Ionicons name="close" size={24} color={colors.textMuted} />
                </Pressable>
              </View>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.xl }}>
                <View style={styles.postHeader}>
                  <Avatar name={openPost.author} />
                  <Text style={styles.postAuthor}>{openPost.author}</Text>
                </View>
                <Text style={[type.title, { marginBottom: spacing.sm }]}>{openPost.title}</Text>
                <Text style={type.body}>{openPost.content}</Text>

                <Text style={styles.commentsLabel}>
                  {openPost.comments?.length ? `${openPost.comments.length} comment${openPost.comments.length === 1 ? '' : 's'}` : 'No comments yet'}
                </Text>
                {(openPost.comments || []).map((c, i) => {
                  const { author, text } = splitComment(c.comment);
                  return (
                    <View key={i} style={styles.comment}>
                      <Avatar name={author} size={28} />
                      <View style={{ flex: 1 }}>
                        {author !== '' && <Text style={styles.commentAuthor}>{author}</Text>}
                        <Text style={styles.commentText}>{text}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <View style={styles.commentBar}>
                <TextInput
                  style={[styles.commentInput, noWebOutline]}
                  value={newComment}
                  onChangeText={setNewComment}
                  placeholder="Add a comment"
                  placeholderTextColor={colors.textFaint}
                  accessibilityLabel="Add a comment"
                  onSubmitEditing={handleAddComment}
                />
                <Pressable
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || commenting}
                  accessibilityRole="button"
                  accessibilityLabel="Send comment"
                  style={[styles.sendButton, (!newComment.trim() || commenting) && { opacity: 0.4 }]}
                >
                  {commenting ? <ActivityIndicator color={colors.onPrimary} size="small" /> : <Ionicons name="arrow-up" size={20} color={colors.onPrimary} />}
                </Pressable>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
    flexGrow: 1,
  },
  header: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.primary,
  },
  post: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  avatar: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '700',
  },
  postAuthor: {
    ...type.label,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  postContent: {
    ...type.bodyMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    marginLeft: -spacing.sm,
    marginRight: -spacing.sm,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '92%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentsLabel: {
    ...type.label,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 12,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  comment: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  commentText: {
    ...type.bodyMuted,
  },
  commentBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    color: colors.text,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Forum;
