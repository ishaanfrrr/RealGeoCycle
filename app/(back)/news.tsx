import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, Image, Platform, Pressable } from 'react-native';
import { Card, Text, ActivityIndicator, MD2Colors } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { API_BASE_URL } from '@/constants/api';

const { height, width } = Dimensions.get('window');

const placeholderImage = require('@/assets/images/no_image.png');

const NewsDashboard = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    //
    fetch(`${API_BASE_URL}/news`)
      .then((response) => response.json())
      .then((data) => {
        setNewsData(data.articles);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching news data:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (  
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={MD2Colors.red800} size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      {...(Platform.OS !== 'web' && {
        snapToOffsets: Array.from(Array(1000).keys()).map(x => x * 351.6),
        snapToAlignment: 'center',
        decelerationRate: 'fast'
      })}
    >
      {newsData.map((article: any, index) => (
        <Pressable 
          key={index}
          onPress={() => router.push({ pathname: 'article', params: { uri: article.uri } })}
        >
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <View style={styles.textContainer}>
                <Text style={styles.title}>{article.title.length > 90 ? article.title.substring(0,90) + "..." : article.title}</Text>
                <Text style={styles.secondaryText}>{`${article.date} by \n${article.authors[0] ? article.authors[0].name : 'Anonymous'}`}</Text>
              </View>
              <View style={styles.imageContainer}>
                <Image
                  source={article.image ? { uri: article.image } : placeholderImage}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
            </View>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 10,
  },
  card: {
    height: height * 0.37,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  cardContent: {
    flexDirection: 'row',
  },
  textContainer: {
    width: '50%',
    padding: 10,
    justifyContent: 'center',
  },
  imageContainer: {
    width: '50%',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  secondaryText: {
    fontSize: 14,
    color: 'grey',
    marginTop: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        height: 290,
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default NewsDashboard;