import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'mongodb'
import { BOARD_TYPES } from '~/utils/constants'
import { columnModel } from './columnModel'
import { cardModel } from './cardModel'
import { pagingSkipValue } from '~/utils/algorithms'
import { userModel } from './userModel'

// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(256).trim().strict(),
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),

  // Lưu ý các item trong mảng columnOrderIds là ObjectId nên cần thêm pattern cho chuẩn nhé, (lúc quay video số 57 mình quên nhưng sang đầu video số 58 sẽ có nhắc lại về cái này.)
  columnOrderIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  // Những người chủ sở hữu board
  ownerIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),
  // Thành viên board
  memberIds: Joi.array()
    .items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE))
    .default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (userId, data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const newBoardToAdd = {
      ...validData,
      ownerIds: [new ObjectId(userId)],
      memberIds: []
    }
    const createdBoard = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .insertOne(newBoardToAdd)
    return createdBoard
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOne({
        _id: new ObjectId(id)
      })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getDetails = async (userId, boardId) => {
  try {
    const queryCondition = [
      { _id: new ObjectId(boardId), },
      { _destroy: false },
      { $or: [
        { ownerIds : {
          $all: [new ObjectId(userId)]
        } },
        { memberIds : {
          $all: [new ObjectId(userId)]
        } }
      ] }
    ]

    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .aggregate([
        { $match: { $and: queryCondition } },
        { $lookup: {
          from: columnModel.COLUMN_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'columns'
        } },
        { $lookup: {
          from: cardModel.CARD_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'cards'
        } },
        { $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'ownerIds',
          foreignField: '_id',
          as: 'onwers',
          pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
        } },
        { $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'memberIds',
          foreignField: '_id',
          as: 'members',
          pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
        } }
      ]).toArray()
    return result[0] || null
  } catch (error) {
    throw new Error(error)
  }
}

const pushColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(column.boardId) },
        { $push: { columnOrderIds: column._id } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const pullColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(column.boardId) },
        { $pull: { columnOrderIds: column._id } },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (boardId, reqBody) => {
  try {
    Object.keys(reqBody).forEach((key) => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete reqBody[key]
      }
    })
    if (reqBody.columnOrderIds) {
      reqBody.columnOrderIds = reqBody.columnOrderIds.map(id => new ObjectId(id))
    }
    const result = await GET_DB()
      .collection(BOARD_COLLECTION_NAME)
      .findOneAndUpdate(
        { _id: new ObjectId(boardId) },
        { $set: reqBody },
        { returnDocument: 'after' }
      )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    const queryCondition = [
      // Điều kiện 1: board chưa bị xoá
      { _destroy: false },
      // Điều kiện 2: userId đang thực hiện request này phải thuộc vào 1 trong 2 mảng onwerIds hoặc memberIds, sử dụng toán tử $all trong MongoDB
      { $or: [
        { ownerIds : {
          $all: [new ObjectId(userId)]
        } },
        { memberIds : {
          $all: [new ObjectId(userId)]
        } }
      ] }
    ]

    // Xử lý trường hợp query filter
    if (queryFilters) {
      Object.keys(queryFilters).forEach(key => {
        // Có phân biệt hoa thường
        // queryCondition.push({ [key]: { $regex: queryFilters[key] } })
        // Không phân biệt hoa thường
        queryCondition.push({ [key]: { $regex: new RegExp(queryFilters[key], 'i') } })
      })
    }

    const query = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate(
      [
        { $match: { $and: queryCondition } },
        // Sort title của board theo thứ tự A-Z
        { $sort: { title: 1 } },
        // $facet để xử lý nhiều luồng trong 1 query
        { $facet: {
          // Luồng 1: Query boards
          'queryBoards': [
            { $skip: pagingSkipValue(page, itemPerPage) }, // Bỏ qua số lượng bản ghi của những trang trước đó
            { $limit: itemPerPage } // Giới hạn tối đa số lượng bản ghi trả về trên 1 page
          ],
          // Luồng 2: Query đếm tổng số lượng bản ghi boards có trong database và trả về biến countedAllBoards
          'queryTotalBoards': [{ $count: 'countedAllBoards' }]
        } }
      ],
      {
        collation: { locale: 'en' }
      }
    ).toArray()
    // console.log(query)

    const res = query[0]
    return {
      boards: res.queryBoards || [],
      totalBoards: res.queryTotalBoards[0]?.countedAllBoards || 0
    }
  } catch (error) {
    throw new Error(error)
  }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  pullColumnOrderIds,
  update,
  getBoards
}
