import { createSlice, nanoid } from '@reduxjs/toolkit';

// helpers
// Use `_id` to match backend MongoDB `_id` (ObjectId string) everywhere
const createEmptyChat = (title) => ({ _id: nanoid(), title: title || 'New Chat', messages: [] });

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        chats: [],
        activeChatId: null,
        isSending: false,
        input: ''
    },
    reducers: {
        ensureInitialChat(state) {
            if (state.chats.length === 0) {
                const chat = createEmptyChat();
                state.chats.unshift(chat);
                state.activeChatId = chat._id;
            }
        },
        startNewChat: {
            reducer(state, action) {
                const {_id, title } = action.payload;
                console.info(action.payload)
                state.chats.unshift({ _id, title: title || 'New Chat', messages: [] });
                state.activeChatId = _id;
            },
            // Accept either a title string or a backend-created chat object
            prepare(input){
                if (input && typeof input === 'object' && input._id) {
                    return { payload: { _id: input._id, title: input.title || 'New Chat' } };
                }
                return { payload: { _id: nanoid(), title: input || 'New Chat' } };
            }
        },
        selectChat(state, action) {
            state.activeChatId = action.payload;
        },
        setInput(state, action) {
            state.input = action.payload;
        },
        sendingStarted(state) {
            state.isSending = true;
        },
        sendingFinished(state) {
            state.isSending = false;
        },
        setChats(state,action){
            state.chats=action.payload
        },
        addUserMessage: {
            reducer(state, action) {
                const { chatId, message } = action.payload;
                const chat = state.chats.find(c => c._id === chatId);
                if (!chat) return;
                if (chat.messages.length === 0) {
                    chat.title = message.content.slice(0, 40) + (message.content.length > 40 ? '…' : '');
                }
                chat.messages.push(message);
            },
            prepare(chatId, content) {
                return { payload: { chatId, message: { id: nanoid(), role: 'user', content, ts: Date.now() } } };
            }
        },
        addAIMessage: {
            reducer(state, action) {
                const { chatId, message } = action.payload;
                const chat = state.chats.find(c => c._id === chatId);
                if (!chat) return;
                chat.messages.push(message);
            },
            prepare(chatId, content, error = false) {
                return { payload: { chatId, message: { id: nanoid(), role: 'ai', content, ts: Date.now(), ...(error ? { error: true } : {}) } } };
            }
        }
    }
});

export const {
    ensureInitialChat,
    startNewChat,
    selectChat,
    setInput,
    sendingStarted,
    sendingFinished,
    addUserMessage,
    addAIMessage,
    setChats
} = chatSlice.actions;

export default chatSlice.reducer;
