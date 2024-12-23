/* eslint-disable no-useless-catch */
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }
    const createdCard = await cardModel.createNew(newCard)
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    if (getNewCard) {
      await columnModel.pushCardOrderIds(getNewCard)
    }
    return getNewCard
  } catch (error) {
    throw error
  }
}

const update = async (id, reqBody, cardCover, userInfo) => {
  try {


    let updatedCard = {}
    // console.log(reqBody)

    if (cardCover) {
      const uploadResult = await CloudinaryProvider.streamUpload(cardCover.buffer, 'cardCovers')
      updatedCard = await cardModel.update(id, {
        ...reqBody,
        cover: uploadResult.secure_url,
        updatedAt: Date.now()
      })
    } else if (reqBody.commentToAdd) {
      // Tạo dữ liệu comment thêm vào db. Bổ sung thêm field cần thiết
      const commentData = {
        ...reqBody.commentToAdd,
        commentAt: Date.now(),
        userId: userInfo._id,
        userEmail: userInfo.email
      }
      updatedCard = await cardModel.unshiftNewComment(id, commentData)
    } else if (reqBody.incomingMemberInfo) {
      // Trường hợp add hoặc remove thành viên ra khỏi card
      updatedCard = await cardModel.updateMembers(id, reqBody.incomingMemberInfo)
    }
    else {
      updatedCard = await cardModel.update(id, {
        ...reqBody,
        updatedAt: Date.now()
      })
    }

    return updatedCard
  } catch (error) {
    throw error
  }
}

export const cardService = {
  createNew,
  update
}
