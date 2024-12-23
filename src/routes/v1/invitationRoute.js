import express from 'express'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { invitationValidation } from '~/validations/invitationValidation'
import { invitationController } from '~/controllers/invitationController'

const Router = express.Router()

Router
  .route('/')
  .get(authMiddleware.isAuthorized, invitationController.getInvitations)

Router
  .route('/board')
  .post(authMiddleware.isAuthorized, invitationValidation.createNew, invitationController.createNew)

Router
  .route('/board/:invitationId')
  .put(authMiddleware.isAuthorized, invitationController.update)

export const invitationRoute = Router