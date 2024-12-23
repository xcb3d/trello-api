import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { BOARD_INVITATION_STATUS, INVITAION_TYPES } from '~/utils/constants'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { userModel } from './userModel'
import { boardModel } from './boardModel'

const INVITATION_COLLECTION_NAME = 'invitations'
const INVATATION_COLLECTION_SCHEMA = Joi.object({
  inviterId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  inviteeId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  type: Joi.string().required().valid(...Object.values(INVITAION_TYPES)),
  boardInvitation: Joi.object({
    boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    status: Joi.string().required().valid(...Object.values(BOARD_INVITATION_STATUS))
  }).optional(),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})

const INVALID_UPDATE_FIELDS = ['_id', 'inviterId', 'inviteeId', 'type', 'createdAt']

const validateBeforeCreate = async (data) => {
  return await INVATATION_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)

    let newInvitationToAdd = {
      ...validData,
      inviterId: new ObjectId(validData.inviterId),
      inviteeId: new ObjectId(validData.inviteeId)
    }

    if (validData.boardInvitation) {
      newInvitationToAdd.boardInvitation = {
        ...validData.boardInvitation,
        boardId: new ObjectId(validData.boardInvitation.boardId)
      }
    }

    const createdInvitation = await GET_DB().collection(INVITATION_COLLECTION_NAME).insertOne(newInvitationToAdd)
    return createdInvitation
  } catch (error) {
    throw new Error(error)
  }
}

const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(INVITATION_COLLECTION_NAME).findOne({
      _id: new ObjectId(id)
    })
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (id, data) => {
  try {
    Object.keys(data).forEach((key) => {
      if (INVALID_UPDATE_FIELDS.includes(key)) {
        delete data[key]
      }
    })

    if (data.boardInvitation) {
      data.boardInvitation = {
        ...data.boardInvitation,
        boardId: new ObjectId(data.boardInvitation.boardId)
      }
    }
    const result = await GET_DB().collection(INVITATION_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: data },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const findByUser = async (userId) => {
  const queryCondition = [
    { inviteeId: new ObjectId(userId) },
    { _destroy: false }
  ]
  const results = await GET_DB().collection(INVITATION_COLLECTION_NAME).aggregate([
    { $match: { $and: queryCondition } },
    { $lookup: {
      from: userModel.USER_COLLECTION_NAME,
      localField: 'inviterId',
      foreignField: '_id',
      as: 'inviter',
      pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
    } },
    { $lookup: {
      from: userModel.USER_COLLECTION_NAME,
      localField: 'inviteeId',
      foreignField: '_id',
      as: 'invitee',
      pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
    } },
    { $lookup: {
      from: boardModel.BOARD_COLLECTION_NAME,
      localField: 'boardInvitation.boardId',
      foreignField: '_id',
      as: 'board'
    } },
    { $unwind: { path: '$inviter', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$invitee', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$board', preserveNullAndEmptyArrays: true } }
  ]).toArray()

  return results || null
}

const findInviteeByBoardId = async (boardId) => {
  const queryCondition = [
    { 'boardInvitation.boardId': new ObjectId(boardId) },
    { _destroy: false }
  ]
  const results = await GET_DB().collection(INVITATION_COLLECTION_NAME).aggregate([
    { $match: { $and: queryCondition } },
    // { $lookup: {
    //   from: userModel.USER_COLLECTION_NAME,
    //   localField: 'inviteeId',
    //   foreignField: '_id',
    //   as: 'invitee',
    //   pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
    // } },
    // { $unwind: { path: '$invitee', preserveNullAndEmptyArrays: true } }
  ]).toArray()
  return results || []
}


export const invitationModel = {
  INVITATION_COLLECTION_NAME,
  INVATATION_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  findByUser,
  findInviteeByBoardId
}