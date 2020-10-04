import { TaskPriorities, TaskStatuses, TaskType, todolistsAPI, UpdateTaskModelType } from '../../api/todolists-api'
import { setAppStatusAC } from '../../app/app-reducer'
import { handleServerAppError, handleServerNetworkError } from '../../utils/error-utils'
import { addTodolistAC, removeTodolistAC, setTodolistsAC } from './todolists-reducer'
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppRootStateType } from '../../app/store';

export const updateTaskTC = createAsyncThunk('tasks/updateTask',
    async (param: { taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string },
           {dispatch, rejectWithValue, getState}) => {

        const state = getState() as AppRootStateType;

        const task = state.tasks[param.todolistId].find(t => t.id === param.taskId)
        if (!task) {
            //throw new Error("task not found in the state");
            console.warn('task not found in the state')
            return rejectWithValue(null)
        }

        const apiModel: UpdateTaskModelType = {
            deadline: task.deadline,
            description: task.description,
            priority: task.priority,
            startDate: task.startDate,
            title: task.title,
            status: task.status,
            ...param.domainModel
        }

        const res = await todolistsAPI.updateTask(param.todolistId, param.taskId, apiModel)
        try {
            if (res.data.resultCode === 0) {
                return {taskId: param.taskId, model: param.domainModel, todolistId: param.todolistId}
                // dispatch(updateTaskAC({taskId, model: domainModel, todolistId}))
            } else {
                handleServerAppError(res.data, dispatch);
                return rejectWithValue(null)
            }
        } catch (error) {
            handleServerNetworkError(error, dispatch);
            return rejectWithValue(null)
        }
    })


export const addTaskTC = createAsyncThunk('tasks/addTask', async (param: { title: string, todolistId: string, }, {dispatch, rejectWithValue}) => {
    dispatch(setAppStatusAC({status: 'loading'}))
    const res = await todolistsAPI.createTask(param.todolistId, param.title)
    try {
        if (res.data.resultCode === 0) {
            dispatch(setAppStatusAC({status: 'succeeded'}))
            const task = res.data.data.item
            return {task}
        } else {
            handleServerAppError(res.data, dispatch);
            return rejectWithValue(null)
        }
    } catch (error) {
        handleServerNetworkError(error, dispatch)
        return rejectWithValue(null)
    }
})


export const fetchTasksTC = createAsyncThunk('tasks/fetchTasks', async (todolistId: string, thunkAPI) => {
    thunkAPI.dispatch(setAppStatusAC({status: 'loading'}))
    const res = await todolistsAPI.getTasks(todolistId)
    const tasks = res.data.items
    thunkAPI.dispatch(setAppStatusAC({status: 'succeeded'}))
    return {tasks, todolistId}
})

export const removeTaskTC = createAsyncThunk('tasks/removeTask', async (param: { taskId: string, todolistId: string }) => {
    await todolistsAPI.deleteTask(param.todolistId, param.taskId)
    return {taskId: param.taskId, todolistId: param.todolistId}
})

const slice = createSlice({
    name: 'tasks',
    initialState: {} as TasksStateType,
    reducers: {
        // updateTaskAC(state, action: PayloadAction<{ taskId: string, model: UpdateDomainTaskModelType, todolistId: string }>) {
        //     const tasks = state[action.payload.todolistId]
        //     const index = tasks.findIndex(el => el.id === action.payload.taskId)
        //     tasks[index] = {...tasks[index], ...action.payload.model}
        // },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addTodolistAC, (state, action) => {
                state[action.payload.todolist.id] = []
            })
            .addCase(removeTodolistAC, (state, action) => {
                delete state[action.payload.id]
            })
            .addCase(setTodolistsAC, (state, action) => {
                action.payload.todolists.forEach((tl: any) => {
                    state[tl.id] = []
                })
            })
            .addCase(fetchTasksTC.fulfilled, (state, action) => {
                state[action.payload.todolistId] = action.payload.tasks
            })
            .addCase(removeTaskTC.fulfilled, (state, action) => {
                const index = state[action.payload.todolistId].findIndex(el => el.id === action.payload.taskId)
                if (index !== -1) state[action.payload.todolistId].splice(index, 1)
            })
            .addCase(addTaskTC.fulfilled, (state, action) => {
                state[action.payload.task.todoListId].unshift(action.payload.task)
            })
            .addCase(updateTaskTC.fulfilled, (state, action) => {
                const tasks = state[action.payload.todolistId]
                const index = tasks.findIndex(el => el.id === action.payload.taskId)
                tasks[index] = {...tasks[index], ...action.payload.model}
            })
    }
})

export const tasksReducer = slice.reducer;


// const _updateTaskTC = (taskId: string, domainModel: UpdateDomainTaskModelType, todolistId: string) =>
//    (dispatch: Dispatch, getState: () => AppRootStateType) => {
//        const state = getState()
//        const task = state.tasks[todolistId].find(t => t.id === taskId)
//        if (!task) {
//            //throw new Error("task not found in the state");
//            console.warn('task not found in the state')
//            return
//        }
//
//        const apiModel: UpdateTaskModelType = {
//            deadline: task.deadline,
//            description: task.description,
//            priority: task.priority,
//            startDate: task.startDate,
//            title: task.title,
//            status: task.status,
//            ...domainModel
//        }
//
//        todolistsAPI.updateTask(todolistId, taskId, apiModel)
//            .then(res => {
//                if (res.data.resultCode === 0) {
//                    const action = updateTaskAC({taskId, model: domainModel, todolistId})
//                    dispatch(action)
//                } else {
//                    handleServerAppError(res.data, dispatch);
//                }
//            })
//            .catch((error) => {
//                handleServerNetworkError(error, dispatch);
//            })
//    }

// types
export type UpdateDomainTaskModelType = {
    title?: string
    description?: string
    status?: TaskStatuses
    priority?: TaskPriorities
    startDate?: string
    deadline?: string
}
export type TasksStateType = {
    [key: string]: Array<TaskType>
}
