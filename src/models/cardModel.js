import Joi from 'joi'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createCard = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .insertOne({
        ...validData,
        'boardId': new ObjectId(validData.boardId),
        'columnId': new ObjectId(validData.columnId)
      })
    return createCard
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(id)
      })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (cardId, reqBody) => {
  Object.keys(reqBody).forEach((key) => {
    if (INVALID_UPDATE_FIELDS.includes(key)) {
      delete reqBody[key]
    }
  })
  if (reqBody.columnId) {
    reqBody.columnId = new ObjectId(reqBody.columnId)
  }
  const result = await GET_DB()
    .collection(CARD_COLLECTION_NAME)
    .findOneAndUpdate(
      { _id: new ObjectId(cardId) },
      { $set: reqBody },
      { returnDocument: 'after' }
    )
  return result
}

const deleteAllCardsByColumnId = async (id) => {
  try {
    const result = await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .deleteMany({
        columnId: new ObjectId(id)
      })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  deleteAllCardsByColumnId
}
