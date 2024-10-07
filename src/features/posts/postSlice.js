import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { db, storage } from "../../firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

// action/message fetchPostByUser
export const fetchPostsByUser = createAsyncThunk(
    "posts/fetchByUser",
    async (userId) => {
        // userId = "123"
        try {
            const postsRef = collection(db, `users/${userId}/posts`);
            // const postsRef = collection(db, `/users/123/posts)
            const querySnapshot = await getDocs(postsRef);
            const docs = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            return docs;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
);

// action/message savePost
export const savePost = createAsyncThunk(
    "posts/savePost",
    async ({ userId, postContent, file }) => {
        // file = { name: "downloads/image.jpg"}
        try {
            let imageUrl = " ";
            console.log(file);
            if (file !== null) {
                const imageRef = ref(storage, `posts/${file.name}`);
                const response = await uploadBytes(imageRef, file);
                imageUrl = await getDownloadURL(response.ref);
            }

            const postsRef = collection(db, `users/${userId}/posts`);
            console.log(`users/${userId}/posts`);
            // Since no ID is given, Firestore auto generate a unique ID for this new document
            const newPostRef = doc(postsRef);
            await setDoc(newPostRef, { content: postContent, likes: [], imageUrl });
            // console.log(postContent)
            // await setDoc(newPostRef, { content: postContent, likes: [] });
            const newPost = await getDoc(newPostRef)

            const post = {
                id: newPost.id,
                ...newPost.data(),
            };

            return post;
        } catch (error) {
            console.error(error);
            throw error;
        }
    })

export const updatePost = createAsyncThunk(
    "posts/updatePost",
    async ({ userId, postId, newPostContent, newFile }) => {
        // file = { name: "downloads/image.jpg"}
        try {
            let newImageUrl = ''
            if (newFile !== null) {
                const imageRef = ref(storage, `posts/${newFile.name}`);
                const response = await uploadBytes(imageRef, newFile);
                newImageUrl = await getDownloadURL(response.ref);
                // const newImageUrl = `storage.google.com/image.jpg`
            }

            const postRef = doc(db, `users/${userId}/posts/${postId}`);
            const postSnap = await getDoc(postRef);
            if (postSnap.exists()) {
                const postData = postSnap.data(); //existing data of our post
                const updatedData = {
                    // if user don't want to update the text/content of the tweet, it will be empty string
                    // and empty string is a false-y boolena value
                    // and postData.content is 'hello'
                    ...postData,
                    content: newPostContent || postData.content,
                    imageUrl: newImageUrl || postData.imageUrl,
                };
                await updateDoc(postRef, updatedData);
                const updatedPost = { id: postId, ...updatedData }
                return updatedPost;
            } else {
                throw new Error("Post does not exist");
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    })

export const likePost = createAsyncThunk(
    "posts/likePost",
    async ({ userId, postId }) => {
        try {
            const postRef = doc(db, `users/${userId}/posts/${postId}`);

            const docSnap = await getDoc(postRef);

            if (docSnap.exists()) {
                const postData = docSnap.data();
                const likes = [...postData.likes, userId];

                await setDoc(postRef, { ...postData, likes });
            }

            return { userId, postId };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
);

export const removeLikeFromPost = createAsyncThunk(
    "posts/removeLikeFromPost",
    async ({ userId, postId }) => {
        try {
            const postRef = doc(db, `users/${userId}/posts/${postId}`)

            const docSnap = await getDoc(postRef);

            if (docSnap.exsist()) {
                const postData = docSnap.data();
                const likes = postData.likes.filter((id) => id !== userId);

                await setDoc(postRef, { ...postData, likes })
            }

            return { userId, postId };
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
)

const postsSlice = createSlice({
    name: "posts",
    initialState: { posts: [], loading: true },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(fetchPostsByUser.fulfilled, (state, action) => {

            // action.payload = [{id : 1, content: " when is lunch"}]
            // we got it from the fetchPostsByUser output or return
            state.posts = action.payload
            // state.posts = []
            // state.posts is the current posts that you are showing
            // since action payload is returned, we will update our state
            // state.posts = [{id: 1, content: "when is lunch"}] 

            state.loading = false
            // before: state.loading = true 
            // we want the loading animation to stop
        }),
            builder.addCase(savePost.fulfilled, (state, action) => {
                state.posts = [action.payload, ...state.posts]
                //action.payload comes from the output of savePost async thunk
                //action.payload {id:8, content: "when is lunch"}

                //state.posts refer to the current posts in the postsSlice state
                //state.posts = [{ id: 7, content:"when is dinner"},{id:6, content:"when is breakfast"}]

                //state.posts = [action.payload, ...state.posts]
                //state.posts = [{id:8, content:"when is lunch"}, ...state.posts]
                //state.posts = [{id:8, content:"when is lunch"},{ id: 7, content:"when is dinner"},{id:6, content:"when is breakfast"}]
            })
                .addCase(likePost.fulfilled, (state, action) => {
                    const { userId, postId } = action.payload;

                    const postIndex = state.posts.findIndex((post) => post.id === postId);

                    if (postIndex !== -1) {
                        state.posts[postIndex].likes.push(userId);
                    }
                })
                .addCase(removeLikeFromPost.fulfilled, (state, action) => {
                    const { userId, postId } = action.payload

                    const postIndex = state.posts.findIndex((post) => post.id === postId);

                    if (postIndex !== -1) {
                        state.posts[postIndex].likes = state.posts[postIndex].likes.filter((id) => id !== userId);
                    }
                })
                .addCase(updatePost.fulfilled, (state, action) => {
                    const updatedPost = action.payload;
                    const postIndex = state.posts.findIndex((post) => post.id === updatedPost.id);
                    if (postIndex !== -1) {
                        state.posts[postIndex] = updatedPost;
                    }
                })
    },
})

export default postsSlice.reducer