import { StatusCodes } from 'http-status-codes'
import { invitationService } from '~/services/invitationService'

const createNew = async (req, res, next) => {
  try {
    const createdInvitation = await invitationService.createNew(req.body, req.jwtDecoded._id)
    res.status(StatusCodes.CREATED).json(createdInvitation)
  } catch (error) {
    next(error)
  }
}

const getInvitations = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const result = await invitationService.getInvitations(userId)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const { invitationId } = req.params
    const { status } = req.body
    const updatedInvitation = await invitationService.update(userId, invitationId, status)
    res.status(StatusCodes.OK).json(updatedInvitation)
  } catch (error) {
    next(error)
  }
}

export const invitationController = {
  createNew,
  getInvitations,
  update
}