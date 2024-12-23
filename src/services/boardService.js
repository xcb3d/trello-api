/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import { DEFAULT_ITEM_PER_PAGE, DEFAULT_PAGE } from '~/utils/constants'

const createNew = async (userId, reqBody) => {
  try {
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }
    const createdBoard = await boardModel.createNew(userId, newBoard)
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId)
    return getNewBoard
  } catch (error) {
    throw error
  }
}

const getDetails = async (userId, boardId) => {
  try {
    const board = await boardModel.getDetails(userId, boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found')
    }
    //Modify do not effect to origin data
    const resBoard = cloneDeep(board)
    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(card => card.columnId.toString() === column._id.toString())
    })
    delete resBoard.cards
    return resBoard
  } catch (error) {
    throw error
  }
}

const update = async (boardId, reqBody) => {
  try {
    const updatedBoard = await boardModel.update(boardId, {
      ...reqBody,
      updatedAt: Date.now()
    })
    return updatedBoard
  } catch (error) {
    throw error
  }
}

const moveCardDiffrentColumn = async (reqBody) => {
  try {
    await columnModel.update(reqBody.prevColumnId, {
      cardOrderIds: reqBody.prevCardOrderIds,
      updatedAt: Date.now()
    })
    await columnModel.update(reqBody.nextColumnId, {
      cardOrderIds: reqBody.nextCardOrderIds,
      updatedAt: Date.now()
    })
    await cardModel.update(reqBody.currentCardId, {
      columnId: reqBody.nextColumnId,
      updatedAt: Date.now()
    })
    return { message: 'Success' }
  } catch (error) {
    throw error
  }
}

const getBoards = async (userId, page, itemPerPage, queryFilters) => {
  try {
    if (!page) page = DEFAULT_PAGE
    if (!itemPerPage) itemPerPage = DEFAULT_ITEM_PER_PAGE

    const result = await boardModel.getBoards(userId, parseInt(page, 10), parseInt(itemPerPage, 10), queryFilters)
    return result
  } catch (error) {
    throw error
  }
}


export const boardService = {
  createNew,
  getDetails,
  update,
  moveCardDiffrentColumn,
  getBoards
}
