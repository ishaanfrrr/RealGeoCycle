import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, View, StyleSheet, Image, Pressable, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';
import { Button, EmptyState } from '@/components/ui';
import { colors, contentMaxWidth, radius, spacing, type } from '@/constants/theme';

const placeholderImage = require('@/assets/images/no_image.png');

function formatDate(date: string) {
  // A bare "YYYY-MM-DD" is parsed as UTC midnight, which can show as the previous day; read it as local time.
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const NewsDashboard = () => {
  const [newsData, setNewsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const router = useRouter();

  const loadNews = useCallback(async () => {
    setError(false);
    try {
      const response = await fetch(`${API_BASE_URL}/news`);
      const data = await response.json();
      setNewsData(data.articles || []);
    } catch (e) {
      console.error('Error fetching news data:', e);
      setError(true);
    }
  }, []);

  useEffect(() => {
    loadNews().finally(() => setLoading(false));
  }, [loadNews]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNews();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error && newsData.length === 0) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="Couldn't load news"
        message="Check your connection and try again."
        action={<Button label="Retry" icon="refresh" onPress={() => { setLoading(true); loadNews().finally(() => setLoading(false)); }} />}
      />
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={newsData}
      keyExtractor={(item, index) => item.uri || String(index)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={type.title}>Eco News</Text>
          <Text style={[type.bodyMuted, { marginTop: spacing.xs }]}>Environmental headlines from around the world</Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState icon="newspaper-outline" title="No articles yet" message="Pull down to check for new stories." />
      }
      renderItem={({ item: article }) => {
        const author = article.authors?.[0]?.name || article.source?.title || 'Unknown source';
        return (
          <Pressable
            onPress={() => router.push({ pathname: 'article', params: { uri: article.uri } } as any)}
            accessibilityRole="link"
            accessibilityLabel={article.title}
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          >
            <Image
              source={article.image ? { uri: article.image } : placeholderImage}
              style={styles.image}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.cardBody}>
              <Text style={styles.title} numberOfLines={3}>{article.title}</Text>
              <Text style={styles.meta} numberOfLines={1}>{author} · {formatDate(article.date)}</Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: contentMaxWidth,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  header: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    borderColor: colors.borderStrong,
    opacity: 0.9,
  },
  image: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceRaised,
  },
  cardBody: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
  },
  meta: {
    ...type.caption,
    fontSize: 13,
    color: colors.textMuted,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

export default NewsDashboard;
