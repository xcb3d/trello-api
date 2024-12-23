import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'
import ApiError from '~/utils/ApiError'
const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    //Navigate data to the service layer
    const createdBoard = await boardService.createNew(userId, req.body)
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const boardId = req.params.id
    const board = await boardService.getDetails(userId, boardId)
    res.status(StatusCodes.CREATED).json(board)
    return board
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const updatedBoard = await boardService.update(boardId, req.body)
    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) {
    next(error)
  }
}

const moveCardDiffrentColumn = async (req, res, next) => {
  try {
    const updatedBoard = await boardService.moveCardDiffrentColumn(req.body)
    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) {
    next(error)
  }
}

const getBoards = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    // Page và itemPerPage được truyền vào trong query url từ phía FE nên BE lấy thông qua req.query
    const { page, itemPerPage, q } = req.query
    const queryFilters = q
    const result = await boardService.getBoards(userId, page, itemPerPage, queryFilters)
    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    throw new ApiError(error)
  }
}

export const boardController = {
  createNew,
  getDetails,
  update,
  moveCardDiffrentColumn,
  getBoards
}
