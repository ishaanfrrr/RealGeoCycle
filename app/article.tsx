import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, ActivityIndicator, MD2Colors } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { API_BASE_URL } from '@/constants/api';
export default function NewsArticle() {
  const { uri } = useLocalSearchParams();
  const [articleData, setArticleData]: any = useState(null);
  const [loading, setLoading] = useState(true);   
  
  useEffect(() => {
    fetch(`${API_BASE_URL}/article?uri=${uri}`)
      .then((response) => response.text())
      .then((data: any) => {        
        setArticleData(data);
        console.log (data)
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching article data:', error);
        setLoading(false);
      });   
  }, [uri]);
  if (loading) {
    return  (
        <View style={styles.loadingContainer}>                  
            <ActivityIndicator animating={true} color={MD2Colors.red800} />
        </View>
    )
  }

  if (!articleData) {
    return <Text>Error loading article.</Text>;
  }

  return (
    <ScrollView style={styles.container}>
        <View style={styles.textContainer}>
      <Text><Markdown style = {newStyles}>{articleData}</Markdown></Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  meta: {
    fontSize: 16,
    color: 'grey',
    marginBottom: 20,
  },
  textContainer: {
    ...Platform.select({
        ios: {
            width:'100%'
        },
        android: {
            width:'100%'
        },
        default: {
          width:'80%'
        },
      }),
    alignSelf:'center',
    padding:20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

const newStyles = StyleSheet.create({
  // The main container
  body: {
    fontSize:15,
    lineHeight:23,
    color:'white'
  },

  // Headings
  heading1: {
    flexDirection: 'row',
    fontSize: 40,
    fontWeight:'bold',
    marginTop:30,
    marginBottom:20,
    lineHeight:50
  },
  heading2: {
    flexDirection: 'row',
    fontSize: 35,
    fontWeight:'bold',
    marginTop:25,
    marginBottom:10,
    lineHeight:40
  },
  heading3: {
    flexDirection: 'row',
    fontSize: 30,
    fontWeight:'bold',
    marginTop:20,
    marginBottom:10,
    lineHeight:35
  },
  heading4: {
    flexDirection: 'row',
    fontSize: 20,
    fontWeight:'bold',
    marginTop:15,
    marginBottom:10,
    lineHeight:30
  },
  heading5: {
    flexDirection: 'row',
    fontSize: 17,
    fontWeight:'bold',
    marginTop:10,
    marginBottom:10,
    lineHeight:20
  },
  heading6: {
    flexDirection: 'row',
    fontSize: 15,
    fontWeight:'bold',
    marginTop:5 ,
    marginBottom:10,
    lineHeight:15
  },

  // Horizontal Rule
  hr: {
    backgroundColor: '#000000',
    height: 1,
  },

  // Emphasis
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  s: {
    textDecorationLine: 'line-through',
  },

  // Blockquotes
  blockquote: {
    backgroundColor: '#000000',
    borderColor: '#CCC',
    borderLeftWidth: 4,
    marginLeft: 5,
    paddingHorizontal: 5,
  },

  // Lists
  bullet_list: {},
  ordered_list: {},
  list_item: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  // @pseudo class, does not have a unique render rule
  bullet_list_icon: {
    marginLeft: 10,
    marginRight: 10,
  },
  // @pseudo class, does not have a unique render rule
  bullet_list_content: {
    flex: 1,
  },
  // @pseudo class, does not have a unique render rule
  ordered_list_icon: {
    marginLeft: 10,
    marginRight: 10,
  },
  // @pseudo class, does not have a unique render rule
  ordered_list_content: {
    flex: 1,
  },

  // Code
  code_inline: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 4,
    ...Platform.select({
      ['ios']: {
        fontFamily: 'Courier',
      },
      ['android']: {
        fontFamily: 'monospace',
      },
    }),
  },
  code_block: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 4,
    ...Platform.select({
      ['ios']: {
        fontFamily: 'Courier',
      },
      ['android']: {
        fontFamily: 'monospace',
      },
    }),
  },
  fence: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    backgroundColor: '#000000',
    padding: 10,
    borderRadius: 4,
    ...Platform.select({
      ['ios']: {
        fontFamily: 'Courier',
      },
      ['android']: {
        fontFamily: 'monospace',
      },
    }),
  },

  // Tables
  table: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 3,
  },
  thead: {},
  tbody: {},
  th: {
    flex: 1,
    padding: 5,
  },
  tr: {
    borderBottomWidth: 1,
    borderColor: '#000000',
    flexDirection: 'row',
  },
  td: {
    flex: 1,
    padding: 5,
  },

  // Links
  link: {
    textDecorationLine: 'underline',
  },
  blocklink: {
    flex: 1,
    borderColor: '#000000',
    borderBottomWidth: 1,
  },

  // Images
  image: {
    flex: 1
  },

  // Text Output
  text: {},
  textgroup: {},
  paragraph: {
    marginTop: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
  },
  hardbreak: {
    width: '100%',
    height: 1,
  },
  softbreak: {},

  // Believe these are never used but retained for completeness
  pre: {},
  inline: {},
  span: {},
});