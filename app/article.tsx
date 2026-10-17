import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { API_BASE_URL } from '@/constants/api';
import { EmptyState } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';

export default function NewsArticle() {
  const { uri } = useLocalSearchParams();
  const [articleData, setArticleData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/article?uri=${uri}`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((data) => setArticleData(data))
      .catch((error) => console.error('Error fetching article data:', error))
      .finally(() => setLoading(false));
  }, [uri]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!articleData) {
    return <EmptyState icon="document-text-outline" title="Couldn't load this article" message="Go back and try again in a moment." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Markdown style={markdownStyles}>{articleData}</Markdown>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});

const mono = Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' });

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 17,
    lineHeight: 28,
    color: colors.text,
  },
  heading1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  heading2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  heading3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  heading4: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  heading5: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  heading6: { fontSize: 15, fontWeight: '700', color: colors.textMuted, marginTop: spacing.md },
  paragraph: {
    marginTop: 0,
    marginBottom: spacing.lg,
  },
  strong: { fontWeight: '700' },
  em: { fontStyle: 'italic', color: colors.textMuted },
  hr: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.xl,
  },
  blockquote: {
    backgroundColor: colors.surface,
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginVertical: spacing.md,
    marginLeft: 0,
  },
  bullet_list: { marginBottom: spacing.lg },
  ordered_list: { marginBottom: spacing.lg },
  list_item: { marginBottom: spacing.xs },
  bullet_list_icon: { color: colors.primary, marginLeft: spacing.xs, marginRight: spacing.sm },
  ordered_list_icon: { color: colors.primary, marginLeft: spacing.xs, marginRight: spacing.sm },
  link: { color: colors.primary, textDecorationLine: 'none' },
  code_inline: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: mono,
  },
  code_block: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: mono,
  },
  fence: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: mono,
  },
  table: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, marginBottom: spacing.lg },
  tr: { borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row' },
  th: { flex: 1, padding: spacing.sm, fontWeight: '700' },
  td: { flex: 1, padding: spacing.sm },
  image: { borderRadius: radius.md },
});
