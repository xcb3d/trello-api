import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'
const Router = express.Router()

Router
  .route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'Api get list board' })
  })
  .post(boardValidation.createNew, boardController.createNew)

Router
  .route('/:id')
  .get(boardController.getDetails)
  .put(boardValidation.update, boardController.update)

Router
  .route('/supports/moving_card')
  .put(boardValidation.moveCardDiffrentColumn, boardController.moveCardDiffrentColumn)
export const boardRoute = Router