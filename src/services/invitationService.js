import { boardModel } from '~/models/boardModel'
import { invitationModel } from '~/models/invitationModel'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { pickUser } from '~/utils/formatters'
import { INVITAION_TYPES, BOARD_INVITATION_STATUS } from '~/utils/constants'
import { StatusCodes } from 'http-status-codes'
import { ObjectId } from 'mongodb'


const createNew = async (reqBody, inviterId) => {
  try {
    const inviter = await userModel.findOneById(inviterId)
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)
    const board = await boardModel.findOneById(reqBody.boardId)
    const listInviteeInInvitation = await invitationModel.findInviteeByBoardId(reqBody.boardId)
    // console.log(board)
    if (!inviter || !invitee || !board) throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, invitee or board not found')
    board.ownerIds.concat(board.memberIds).forEach(element => {
      if (element.toString() === invitee._id.toString()) {
        throw new ApiError(StatusCodes.CONFLICT, 'User are already member of this board')
      }
    })

    if (listInviteeInInvitation) {
      listInviteeInInvitation.forEach(element => {
        if (element.inviteeId.toString() === invitee._id.toString()) {
          throw new ApiError(StatusCodes.CONFLICT, 'Invitee already invited to this board')
        }
      })
    }


    const newInvitationData = {
      inviterId,
      inviteeId: invitee._id.toString(),
      type: INVITAION_TYPES.BOARD_INVITATION,
      boardInvitation: {
        boardId: board._id.toString(),
        status: BOARD_INVITATION_STATUS.PENDING
      }
    }

    const createdInvitation = await invitationModel.createNew(newInvitationData)
    const getInvitation = await invitationModel.findOneById(createdInvitation.insertedId.toString())

    const result = {
      ...getInvitation,
      board,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee)
    }
    return result
  } catch (error) {
    throw new Error(error)
  }
}

const getInvitations = async (userId) => {
  try {
    const getInvitations = await invitationModel.findByUser(userId)
    // console.log('🚀 ~ getInvitations ~ getInvitations:', getInvitations)

    return getInvitations
  } catch (error) {
    throw new Error(error)
  }
}

const update = async (userId, invitationId, status) => {
  try {
    const invitation = await invitationModel.findOneById(invitationId)
    if (!invitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found')

    const board = await boardModel.findOneById(invitation.boardInvitation.boardId)
    if (!board) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')

    // Status ACCEPTED

    // Tạo dữ liệu để update vào db
    const updateData = {
      boardInvitation: {
        ...invitation.boardInvitation,
        status
      },
      updatedAt: Date.now()
    }
    // B1: Cập nhật lại trạng thái lời mời
    const updatedInvitation = await invitationModel.update(invitationId, updateData)
    // B2: Cập nhật lại trạng thái thành viên board
    if (status === BOARD_INVITATION_STATUS.ACCEPTED) {
      const updateBoardData = {
        memberIds: [...board.memberIds, new ObjectId(userId)]
      }
      await boardModel.update(board._id.toString(), updateBoardData)
    }
    return updatedInvitation
  } catch (error) {
    throw new Error(error)
  }
}

export const invitationService = {
  createNew,
  getInvitations,
  update
}