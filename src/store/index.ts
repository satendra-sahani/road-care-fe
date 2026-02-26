import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import authReducer from './slices/authSlice';
import categoryReducer from './slices/categorySlice';
import brandReducer from './slices/brandSlice';
import productReducer from './slices/productSlice';
import serviceRequestReducer from './slices/serviceRequestSlice';
import mechanicReducer from './slices/mechanicSlice';
import rootSaga from './sagas';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    category: categoryReducer,
    brand: brandReducer,
    product: productReducer,
    serviceRequest: serviceRequestReducer,
    mechanic: mechanicReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false, serializableCheck: false }).concat(sagaMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

sagaMiddleware.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
