import { createAsyncThunk, createSlice } from "@reduxjs/toolkit"
import axios from "axios"
import { jwtDecode } from "jwt-decode"

const BASE_URL = "https://864d1276-9c4f-4282-980e-ba98c1c3f422-00-1hcvfsir1vaaz.pike.repl.co"

// action/message fetchPostByUser
export const fetchPostsByUser = createAsyncThunk(
    "posts/fetchByUser",
    async (userId) => {
        const response = await fetch(`${BASE_URL}/posts/user/${userId}`)
        return response.json() //this is the action in the addCase
        // return [{id: 1, content: "when is lunch"}]
    }
)

// action/message savePost
export const savePost = createAsyncThunk(
    "posts/savePost",
    async (postContent) => {
        //Get stored JWT Token
        const token = localStorage.getItem("authToken");

        //Decode the token to fetch user id
        const decode = jwtDecode(token);
        const userId = decode.id // May change depending on how the server encode the token

        //Prepare data to be sent
        const data = {
            title: "Post Title",  //Add functionality to set this properly
            content: postContent,
            user_id: userId,
        };
        const response = await axios.post(`${BASE_URL}/posts`, data)
        return response.data
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
    }
})

export default postsSlice.reducer