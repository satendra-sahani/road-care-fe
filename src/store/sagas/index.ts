import { all, fork } from 'redux-saga/effects';
import authSaga from './authSaga';
import categorySaga from './categorySaga';
import brandSaga from './brandSaga';
import productSaga from './productSaga';
import serviceRequestSaga from './serviceRequestSaga';
import mechanicSaga from './mechanicSaga';
import userSaga from './userSaga';
import customerAuthSaga from './customerAuthSaga';

export default function* rootSaga() {
  yield all([
    fork(authSaga),
    fork(categorySaga),
    fork(brandSaga),
    fork(productSaga),
    fork(serviceRequestSaga),
    fork(mechanicSaga),
    fork(userSaga),
    fork(customerAuthSaga),
  ]);
}
