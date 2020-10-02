import { Dispatch } from 'redux'
import { setAppStatusAC } from '../../app/app-reducer'
import { authAPI, LoginParamsType } from '../../api/todolists-api'
import { handleServerAppError, handleServerNetworkError } from '../../utils/error-utils'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
    isLoggedIn: false
}

export const loginTC = createAsyncThunk('auth/loginTC', async (param: LoginParamsType, thunkAPI) => {
    thunkAPI.dispatch(setAppStatusAC({status: 'loading'}))
    try {
        const res = await authAPI.login(param)
        if (res.data.resultCode === 0) {
            thunkAPI.dispatch(setAppStatusAC({status: 'succeeded'}))
            thunkAPI.dispatch(setIsLoggedInAC({value: true}))
            return {isLoggedIn: true}
        } else {
            handleServerAppError(res.data, thunkAPI.dispatch)
            return {isLoggedIn: false}
        }
    } catch (error) {
        handleServerNetworkError(error, thunkAPI.dispatch)
        return {isLoggedIn: false}
    }
})


// slice - редьюсеры создаем с помощью функции createSlice
const slice = createSlice({
    // имя редьюсера
    name: 'auth',
    initialState: initialState,
    reducers: {
        // // каждый case будет маленьким под-редьюсером
        setIsLoggedInAC(state, action: PayloadAction<{value: boolean}>) {
            // теперь state изменяем мутабельным образом
            // иммутабельность сделает за нас библиотека immer.js
            state.isLoggedIn = action.payload.value
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginTC.fulfilled, (state, action) => {
                state.isLoggedIn = action.payload.isLoggedIn
            })
    }
})

// Создаем reducer с помощью slice
export const authReducer = slice.reducer;
// Action creator также достаем с помощью slice
export const {setIsLoggedInAC} = slice.actions


export const logoutTC = () => (dispatch: Dispatch) => {
    dispatch(setAppStatusAC({status: 'loading'}))
    authAPI.logout()
        .then(res => {
            if (res.data.resultCode === 0) {
                // dispatch(setIsLoggedInAC({value: false}))
                dispatch(setAppStatusAC({status: 'succeeded'}))
            } else {
                handleServerAppError(res.data, dispatch)
            }
        })
        .catch((error) => {
            handleServerNetworkError(error, dispatch)
        })
}
