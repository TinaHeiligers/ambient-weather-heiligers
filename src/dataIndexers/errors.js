const { errors } = require('@elastic/elasticsearch');

const isResponseError = function (error) {
  return error instanceof errors.ResponseError;
}

const isUnauthorizedError = function (error) {
  return isResponseError(error) && error.statusCode === 401;
}

const indexDoesNotExist = function (error) {
  return isResponseError(error) && error.meta.body.status === 404 && error.message.includes('[index_not_found_exception');
}

const indexExistsError = function (error) {
  return isResponseError(error) && isBadRequestError(error) && error.message.includes('[resource_already_exists_exception');
}

const isBadRequestError = function (error) {
  return isResponseError(error) && error.meta.body.status === 400;
}

module.exports = {
  isResponseError,
  isUnauthorizedError,
  indexDoesNotExist,
  indexExistsError
}
