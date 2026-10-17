  import React, { useState, useEffect, useRef } from 'react';
  import axios from 'axios';
  import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, TouchableWithoutFeedback, Dimensions, StyleProp, ViewStyle, TextStyle, KeyboardAvoidingView, Animated, Keyboard, Easing, Platform} from 'react-native';
  import Icon from 'react-native-vector-icons/MaterialIcons';
  import { Modal, Portal } from 'react-native-paper';
  import { auth } from '../../FirebaseConfig'; // Import Firebase Auth
  import { onAuthStateChanged } from 'firebase/auth';
  import { API_BASE_URL } from '@/constants/api';

  const { width, height } = Dimensions.get('window');

  interface Comment {
    comment: string;
    author: string; // Add author field for comments
  }

  interface PostType {
    id: number;
    title: string;
    content: string;
    comments: Comment[];
    likes: number;
    hasLiked: boolean;
    isSaved: boolean;
    author: string; // Add author field for posts
  }

  interface InputFieldProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    style?: StyleProp<TextStyle>;
  }

  interface PostProps {
    post: PostType;
    onAddComment: (postId: number, comment: string) => void;
    onLike: (postId: number) => void;
    onSave: (postId: number) => void;
    hasLiked: boolean;
    isSaved: boolean;
    onPress: () => void;
  }

  const InputField: React.FC<InputFieldProps> = ({ value, onChangeText, placeholder, style }) => (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="gray"
    />
  );

  const Post: React.FC<PostProps> = ({ post, onAddComment, onLike, onSave, hasLiked, isSaved, onPress }) => {
    const [newComment, setNewComment] = useState<string>('');
    const [visible, setVisible] = useState<boolean>(false);

    const showModal = () => setVisible(true);
    const hideModal = () => setVisible(false);
    const marginBottomAnim = useRef(new Animated.Value(0)).current; // Initial marginBottom value

    useEffect(() => {
      const keyboardDidShowListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        () => {
          // Animate to marginBottom: 60 when the keyboard is visible
          Animated.timing(marginBottomAnim, {
            toValue: 60,
            duration: 100, // 1 second
            easing: Easing.ease,
            useNativeDriver: false,
          }).start();
        }
      );
      const keyboardDidHideListener = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => {
          // Animate back to marginBottom: 0 when the keyboard is hidden
          Animated.timing(marginBottomAnim, {
            toValue: 0,
            duration: 100, // 1 second
            easing: Easing.ease,
            useNativeDriver: false,
          }).start();
        }
      );
    
      // Clean up the listeners on component unmount
      return () => {
        keyboardDidHideListener.remove();
        keyboardDidShowListener.remove();
      };
    }, [marginBottomAnim]);
    
    
    return (
  <View style={styles.post}>
    <TouchableWithoutFeedback onPress={showModal}>
      <View>
        <Text style={styles.postTitle}>{post.title}</Text>
        <Text style={styles.postAuthor}>By: {post.author}</Text>
        <Text style={styles.postContent}>{post.content}</Text>
              
        <View style={styles.actionContainer}>
          <View style={styles.likeAndSaveContainer}>
            <TouchableOpacity onPress={() => onLike(post.id)} style={styles.actionButton}>
              <Icon name={hasLiked ? 'favorite' : 'favorite-border'} size={24} color={hasLiked ? 'red' : 'gray'} />
              <Text style={styles.likeCount}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(post.id)} style={styles.actionButton}>
              <Icon name={isSaved ? 'bookmark' : 'bookmark-border'} size={24} color={isSaved ? 'green' : 'gray'} />
              <Text style={styles.saveCount}>{isSaved ? 'Saved' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.commentSection}>
            <TouchableOpacity style={styles.commentButton} onPress={showModal}>
              <Icon name="comment" size={24} color="#D3D3D3" />
              <Text style={styles.commentCount}>{post.comments.length}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
      </View>
    </TouchableWithoutFeedback>
      <Portal>
      
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.fullScreenModal}>

          <View style={styles.overlayBox} />
          <View style={styles.smth}>
              <TouchableOpacity style={styles.closeButton} onPress={hideModal}>
                <Icon name="close" size={30} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.fullScreenTitle}>{"\n\n "}{post.title}</Text>
              <Text style = {{color:"#D3D3D3", textAlign:'center', fontSize:15}}>By {post.author}</Text>
              <Text style={styles.fullScreenContent}>{post.content}</Text>
              <Text>{"\n\n"}</Text>
              <FlatList
                data={post.comments}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Text style={styles.comment}>{item.comment}</Text> // Display comment author
                )}
                showsVerticalScrollIndicator={false}
                style={styles.commentsContainer}
              />
            <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Animated.View style={[styles.commentInputContainer, { marginBottom: marginBottomAnim }]}>
              <InputField
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Add a comment"
                style={styles.commentInput}
              />
              <TouchableOpacity 
                style={styles.smallSubmitButton} 
                onPress={() => {
                  if (newComment.trim()) {
                    onAddComment(post.id, newComment);
                    setNewComment('');
                  }
                }}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </Animated.View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </Portal>
  </View>
    );
  };

  const Forum: React.FC = () => {
    const [posts, setPosts] = useState<PostType[]>([]);
    const [newPost, setNewPost] = useState<string>('');
    const [newDescription, setNewDescription] = useState<string>('');
    const [showInput, setShowInput] = useState<boolean>(false);
    const [viewSavedPosts, setViewSavedPosts] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>(''); // State for storing user name
    const [email, setEmail] = useState<string>(''); // State for storing user name
    const [likedPosts, setLikedPosts] = useState<number[]>([]);
    useEffect(() => {
      fetchPosts();

      // Listen for authentication state changes and retrieve user name
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user && user.displayName && user.email) {
          setUserName(user.displayName);
          setEmail(user.email)
        }
      });

      return unsubscribe; // Cleanup subscription on unmount
    }, []);

    const fetchLikedPosts = async () => {
      try {
        if (!email) return;
        const response = await axios.get<number[]>(`${API_BASE_URL}/likes/${email}`);
        setLikedPosts(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axios.get<PostType[]>('${API_BASE_URL}/posts');
        const postsWithLikes = response.data.map(post => ({
          ...post,
          hasLiked: likedPosts.includes(post.id)
        }));
        setPosts(postsWithLikes);
      } catch (error) {
        console.error(error);
      }
    };

    const handleLike = async (postId: number) => {
      const post = posts.find(p => p.id === postId);
      if (post) {
        const newHasLiked = !post.hasLiked;
        try {
          await axios.post('${API_BASE_URL}/like', { email: email, postId, newHasLiked });
          // Update local state after liking
          setPosts(posts.map(p =>
            p.id === postId ? { ...p, hasLiked: newHasLiked, likes: newHasLiked ? p.likes + 1 : p.likes - 1 } : p
          ));
          // Fetch liked posts again to ensure consistency
          fetchLikedPosts();
        } catch (error) {
          console.error(error);
        }
      }
    };

    const handleSave = async (postId: number) => {
      setPosts(posts.map(post => post.id === postId ? { ...post, isSaved: !post.isSaved } : post));
    };
    const handleAddPost = async () => {
      if (newPost.trim() && newDescription.trim()) {
        const newPostObject = {
          id: Date.now(),
          title: newPost,
          content: newDescription,
          comments: [],
          likes: 0,
          hasLiked: false,
          isSaved: false,
          author: userName, // Include the author's name
        };
        try {
          await axios.post('${API_BASE_URL}/posts', newPostObject);
          setTimeout(async () => {
          fetchPosts();
          setNewPost('');
          setNewDescription('');
          setShowInput(false);
          },500)
        } catch (error) {
          console.error(error);
        }
      } else {
        alert('Please enter both title and description');
      }
    };

    const handleAddComment = async (postId: number, comment: string) => {
      if (comment.trim()) {
        try {
          await axios.post('${API_BASE_URL}/comment', {
            id: postId,
            comment: comment,
            author: userName
          });
          fetchPosts();
        } catch (error: any) {
          console.error(error.response.data)
        }
      } else {
        alert('Comment cannot be empty');
      }
    };

    const handleViewSavedPosts = () => {
      setViewSavedPosts(!viewSavedPosts);
    };

    return (
      <View style={styles.container}>
        {showInput && (
          <View style={styles.inputContainerTop}>
            <InputField 
              value={newPost} 
              onChangeText={setNewPost} 
              placeholder="Post Title" 
              style={styles.titleInput} 
            />
            <InputField 
              value={newDescription} 
              onChangeText={setNewDescription} 
              placeholder="Post Description" 
              style={styles.descriptionInput} 
            />
            <TouchableOpacity style={styles.smallSubmitButton} onPress={handleAddPost}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          data={viewSavedPosts ? posts.filter(post => post.isSaved) : posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Post
              post={item}
              onAddComment={handleAddComment}
              onLike={handleLike}
              onSave={handleSave}
              hasLiked={item.hasLiked}
              isSaved={item.isSaved}
              onPress={() => {}}
            />
          )}
          showsVerticalScrollIndicator={false}
          style={styles.postsContainer}
        />

  <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setShowInput(!showInput)}
          >
            <Icon name="add" size={24} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={handleViewSavedPosts}
          >
            <Icon name="bookmark" size={24} color="white" />
          </TouchableOpacity>
    </View>
      </View>
    );
  };

const styles = StyleSheet.create({
  postsContainer: {
    flex: 1,
    cursor:'pointer'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#6200ee',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 40,
    paddingHorizontal: 10,
  } as ViewStyle,
  inputContainerTop: {
    backgroundColor: '#35374f',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
  } as ViewStyle,
  post: {
    backgroundColor: '#111111',
    padding: 20,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#4F515B',
    borderWidth: 1,
  } as ViewStyle,
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  } as TextStyle,
  postContent: {
    fontSize: 16,
    marginTop: 10,
    color: '#D3D3D3',
  } as TextStyle,
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  } as ViewStyle,
  likeAndSaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  } as ViewStyle,
  likeCount: {
    color: '#D3D3D3',
    marginLeft: 5,
  } as TextStyle,
  saveCount: {
    color: '#D3D3D3',
    marginLeft: 5,
  } as TextStyle,
  commentSection: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  commentButton: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  commentCount: {
    color: '#D3D3D3',
    marginLeft: 5,
  } as TextStyle,
  commentInputContainer: {
    flexDirection: 'row',
    padding: 10,  
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderColor: '#4F515B',
    alignItems: 'center',
  } as ViewStyle,
  commentInput: {
    flex: 1,
    marginRight: 10,
    color: 'white',
  } as TextStyle,
  smallSubmitButton: {
    backgroundColor: '#4F515B',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  } as ViewStyle,
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  } as TextStyle,
  titleInput: {
    marginBottom: 10,
    color: 'white',
  } as TextStyle,
  descriptionInput: {
    marginBottom: 20,
    color: 'white',
  } as TextStyle,
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#8CDBA9',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  } as ViewStyle,
  bookmarkButton: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: '#4F515B',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  } as ViewStyle,
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  } as ViewStyle,
  fullScreenModal: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    flex: 1,
  } as ViewStyle,
  smth: {
    marginTop:20,
    padding:20,
    height:'100%'
  },
  overlayBox: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 0,
  } as ViewStyle,
  fullScreenContainer: {
    flex: 1,
    justifyContent: 'space-between',
  } as ViewStyle,
  scrollView: {
    flex: 1,
    padding: 20,
    paddingBottom: 70, // Make room for the comment input at the bottom
  } as ViewStyle,
  fullScreenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  } as TextStyle,
  fullScreenContent: {
    fontSize: 18,
    color: '#D3D3D3',
    textAlign:'center',
    marginTop: 30,
  } as TextStyle,
  commentsContainer: {
    flex: 1,
    marginTop: 10,
  } as ViewStyle,
  comment: {
    fontSize: 16,
    color: '#D3D3D3',
    marginBottom: 10,
    backgroundColor: '#35374f',
    padding: 10,
    borderRadius: 5,
  } as TextStyle,
  postAuthor: {
    fontSize: 14,
    color: '#D3D3D3',
    marginBottom: 5,
  } as TextStyle,
  input: {
    height: 40,
    borderColor: '#D3D3D3',
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    color: 'white',
  } as TextStyle,
});

export default Forum;
