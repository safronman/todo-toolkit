import { setAppStatusAC } from '../../app/app-reducer'
import { authAPI, FieldErrorType, LoginParamsType } from '../../api/todolists-api'
import { handleServerAppError, handleServerNetworkError } from '../../utils/error-utils'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';


export const logoutTC = createAsyncThunk('auth/logout', async (param, {dispatch, rejectWithValue}) => {
    dispatch(setAppStatusAC({status: 'loading'}))
    try {
        const res = await authAPI.logout()
        if (res.data.resultCode === 0) {
            dispatch(setAppStatusAC({status: 'succeeded'}))
            return
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue(null)
        }
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})


// 1. То, что возвращает Thunk
// 2. ThunkArg - аргументы санки.
// 3. ThunkApiConfig содержит следующие поля
/*declare type AsyncThunkConfig = {
    state?: unknown;
    dispatch?: Dispatch;
    extra?: unknown;
    rejectValue?: unknown;
};*/
// Но нам для отобржения ошибки нужен rejectValue
export const loginTC = createAsyncThunk<undefined, LoginParamsType,
    { rejectValue: { errors: Array<string>, fieldsErrors?: Array<FieldErrorType> } }>('auth/loginTC', async (param, {dispatch, rejectWithValue}) => {
    dispatch(setAppStatusAC({status: 'loading'}))
    try {
        const res = await authAPI.login(param)
        if (res.data.resultCode === 0) {
            dispatch(setAppStatusAC({status: 'succeeded'}))
            return
        } else {
            handleServerAppError(res.data, dispatch)
            return rejectWithValue({errors: res.data.messages, fieldsErrors: res.data.fieldsErrors})
        }
    } catch (err) {
        const error: AxiosError = err
        handleServerNetworkError(error, dispatch)
        return rejectWithValue({errors: [error.message], fieldsErrors: undefined})
    }
})


// slice - редьюсеры создаем с помощью функции createSlice
const slice = createSlice({
    // имя редьюсера
    name: 'auth',
    initialState: {
        isLoggedIn: false
    },
    reducers: {
        // // каждый case будет маленьким под-редьюсером
        setIsLoggedInAC(state, action: PayloadAction<{ value: boolean }>) {
            // теперь state изменяем мутабельным образом
            // иммутабельность сделает за нас библиотека immer.js
            state.isLoggedIn = action.payload.value
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginTC.fulfilled, (state) => {
                state.isLoggedIn = true
            })
            .addCase(logoutTC.fulfilled, (state) => {
                state.isLoggedIn = false
            })
    }
})

// Создаем reducer с помощью slice
export const authReducer = slice.reducer;
// Action creator также достаем с помощью slice
export const {setIsLoggedInAC} = slice.actions
